<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lpk;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class LpkController extends Controller
{
    public function index(Request $request)
    {
        // tab: semua | terakreditasi | dibekukan | dicabut
        $query = Lpk::query()->inTab($request->get('tab', 'semua'));

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $s = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(certificate_number) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$s])
                    ->orWhereRaw('LOWER(scope) LIKE ?', [$s]);
            });
        }

        $data = $query->naturalOrder()
            ->paginate(min((int) $request->get('per_page', 10), 50));

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());
        $lpk  = Lpk::create($this->normalizeStatus($data));

        return response()->json(['success' => true, 'message' => 'Data berhasil ditambahkan', 'data' => $lpk], 201);
    }

    public function update(Request $request, int|string $id)
    {
        $lpk  = Lpk::findOrFail($id);
        $data = $request->validate($this->rules((int) $id), $this->messages());

        // LPK yang sudah dicabut statusnya dikunci
        if ($lpk->status === 'revoked' && $data['status'] !== 'revoked') {
            return response()->json([
                'success' => false,
                'message' => 'Status LPK yang sudah dicabut tidak dapat diubah kembali. LPK harus didaftarkan sebagai LPK baru dengan nomor akreditasi baru.',
            ], 422);
        }

        $lpk->update($this->normalizeStatus($data));

        return response()->json(['success' => true, 'message' => 'Data berhasil diperbarui', 'data' => $lpk]);
    }

    public function destroy(int|string $id)
    {
        Lpk::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }

    // ------------------------------------------------------------------

    private function rules(?int $ignoreId = null): array
    {
        return [
            'type'               => ['required', 'string', 'max:191'],
            'certificate_number' => ['required', 'string', 'max:100', Rule::unique('lpks', 'certificate_number')->ignore($ignoreId)],
            'name'               => ['required', 'string', 'max:255'],
            'address'            => ['nullable', 'string'],
            'phone'              => ['nullable', 'string', 'max:255'],
            'email'              => ['nullable', 'string'],
            'scope'              => ['nullable', 'string'],
            'expiry_date'        => ['nullable', 'date'],
            'certificate_link'   => ['nullable', 'string', 'max:500'],

            'status'             => ['required', Rule::in(['active', 'suspended', 'revoked'])],
            'suspension_scope'   => ['required_if:status,suspended', 'nullable', Rule::in(['full', 'partial'])],
            'suspension_status'  => ['nullable', 'string'],
            'suspended_at'       => ['nullable', 'date'],
            'revoked_at'         => ['nullable', 'date'],
        ];
    }

    private function messages(): array
    {
        return [
            'certificate_number.unique'    => 'No. Akreditasi sudah terdaftar',
            'suspension_scope.required_if' => 'Pilih jenis pembekuan (seluruh RL atau sebagian RL)',
        ];
    }

    /** Bersihkan kolom yang tidak relevan dengan status yang dipilih. */
    private function normalizeStatus(array $data): array
    {
        if ($data['status'] === 'active') {
            $data['suspension_scope']  = null;
            $data['suspension_status'] = null;
            $data['suspended_at']      = null;
            $data['revoked_at']        = null;
        } elseif ($data['status'] === 'suspended') {
            $data['revoked_at'] = null;
            if ($data['suspension_scope'] === 'full') {
                $data['suspension_status'] = 'Pembekuan Seluruh RL';
            }
        } else { // revoked
            $data['suspension_scope']  = null;
            $data['suspension_status'] = null;
            $data['suspended_at']      = null;
            $data['revoked_at']      ??= now()->toDateString();
        }

        return $data;
    }

    // ==================================================================
    // IMPORT: STATUS DIPILIH MANUAL
    // ==================================================================

    private const IMPORT_COLUMNS = [
        'active' => [
            'certificate_number' => ['NO. AKREDITASI', 'NO AKREDITASI', 'NOMOR AKREDITASI', 'NO. SERTIFIKAT'],
            'name'               => ['NAMA LPK', 'NAMA LEMBAGA'],
            'address'            => ['ALAMAT'],
            'phone'              => ['TELEPON/FAX', 'TELEPON', 'TELP/FAX', 'TELP'],
            'email'              => ['E-MAIL', 'EMAIL'],
            'scope'              => ['LINGKUP'],
            'expiry_date'        => ['MASA BERLAKU AKREDITASI (EXPIRED)', 'MASA BERLAKU AKREDITASI', 'MASA BERLAKU', 'EXPIRED'],
            'certificate_link'   => ['LINK'],
        ],
        'suspended' => [
            'certificate_number' => ['NO. AKREDITASI', 'NO AKREDITASI', 'NOMOR AKREDITASI'],
            'name'               => ['NAMA LPK', 'NAMA LEMBAGA'],
            'suspension_status'  => ['STATUS PEMBEKUAN', 'RUANG LINGKUP', 'LINGKUP', 'STATUS'],
            'suspended_at'       => ['TANGGAL DIBEKUKAN', 'TGL DIBEKUKAN'],
        ],
        'revoked' => [
            'certificate_number' => ['NO. AKREDITASI', 'NO AKREDITASI', 'NOMOR AKREDITASI'],
            'name'               => ['NAMA LPK', 'NAMA LEMBAGA'],
            'revoked_at'         => ['TANGGAL DICABUT', 'TGL DICABUT'],
        ],
    ];

    private const DATE_FIELDS = ['expiry_date', 'suspended_at', 'revoked_at'];

    public function importFile(Request $request)
    {
        $request->validate([
            'status_choice' => ['required', Rule::in(['from_file', 'active', 'suspended_full', 'suspended_partial', 'revoked'])],
            'type'          => ['required', 'string', 'max:191'],
            'file'          => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
            'dry_run'       => ['nullable', 'boolean'],
        ]);

        // Status dibaca dari kolom STATUS di dalam file
        if ($request->status_choice === 'from_file') {
            return $this->importFromFile($request);
        }

        $choice  = $request->status_choice;
        $group   = str_starts_with($choice, 'suspended') ? 'suspended' : $choice;
        $type    = $request->type;
        $dry     = $request->boolean('dry_run');
        $headers = self::IMPORT_COLUMNS[$group];

        $rows = Excel::toArray(new class {}, $request->file('file'))[0] ?? [];

        [$headerIdx, $map] = $this->detectHeader($rows, $headers);
        if ($headerIdx === null) {
            $expected = implode(', ', array_map(fn($a) => $a[0], $headers));
            return response()->json([
                'success' => false,
                'message' => "Baris judul kolom tidak ditemukan. File harus punya kolom: $expected",
            ], 422);
        }

        // ---- Baca & validasi baris ----
        $records = [];
        $errors  = [];
        foreach (array_slice($rows, $headerIdx + 1, null, true) as $i => $row) {
            $rec    = array_fill_keys(array_keys($headers), null);
            $filled = false;
            foreach ($map as $col => $field) {
                $v = $this->cell($row[$col] ?? null);
                if ($v !== null) $filled = true;
                $rec[$field] = $v;
            }
            if (!$filled) continue; // baris kosong

            $rowLabel = 'Baris ' . ($i + 1);
            if (!$rec['certificate_number'] || !$rec['name']) {
                $errors[] = ['row' => $rowLabel, 'message' => 'No. Akreditasi atau Nama LPK kosong'];
                continue;
            }
            foreach (self::DATE_FIELDS as $df) {
                if (array_key_exists($df, $rec) && $rec[$df] !== null) {
                    $d = $this->parseDate($rec[$df]);
                    if (!$d) {
                        $errors[] = ['row' => $rowLabel, 'message' => "Format tanggal tidak dikenali: {$rec[$df]}"];
                        continue 2;
                    }
                    $rec[$df] = $d;
                }
            }
            if (!empty($rec['certificate_link']) && !preg_match('#^https?://#i', $rec['certificate_link'])) {
                $rec['certificate_link'] = 'https://' . $rec['certificate_link'];
            }

            $records[$rec['certificate_number']] = $rec; // nomor ganda di file: baris terakhir dipakai
        }
        $records = array_values($records);

        // ---- Cek status LPK yang sudah ada di database ----
        $existing = [];
        foreach (array_chunk(array_column($records, 'certificate_number'), 500) as $chunk) {
            $existing += Lpk::whereIn('certificate_number', $chunk)->pluck('status', 'certificate_number')->all();
        }

        // LPK yang sudah Dicabut tidak boleh dibekukan lagi
        if ($group === 'suspended') {
            $records = array_values(array_filter($records, function ($r) use ($existing, &$errors) {
                if (($existing[$r['certificate_number']] ?? null) === 'revoked') {
                    $errors[] = ['row' => 'No. ' . $r['certificate_number'], 'message' => 'Sudah Dicabut, tidak dapat dibekukan'];
                    return false;
                }
                return true;
            }));
        }

        $new     = count(array_filter($records, fn($r) => !isset($existing[$r['certificate_number']])));
        $updated = count($records) - $new;

        if ($dry) {
            return response()->json(['success' => true, 'data' => [
                'total'       => count($records),
                'new'         => $new,
                'updated'     => $updated,
                'error_count' => count($errors),
                'errors'      => array_slice($errors, 0, 20),
                'preview'     => array_slice($records, 0, 5),
            ]]);
        }

        if (!$records) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris valid untuk diimpor.',
                'errors'  => array_slice($errors, 0, 20),
            ], 422);
        }

        // ---- Simpan ----
        $now        = now();
        $updateCols = $this->importUpdateColumns($group);
        DB::transaction(function () use ($records, $choice, $type, $now, $updateCols) {
            foreach (array_chunk($records, 500) as $chunk) {
                $payload = array_map(fn($r) => $this->importPayload($r, $choice, $type, $now), $chunk);
                Lpk::upsert($payload, ['certificate_number'], $updateCols);
            }
        });

        $message = "Import selesai: $new data baru, $updated data diperbarui.";
        if ($errors) $message .= ' ' . count($errors) . ' baris dilewati.';

        return response()->json(['success' => true, 'message' => $message, 'data' => [
            'total' => count($records),
            'new' => $new,
            'updated' => $updated,
            'error_count' => count($errors),
            'errors' => array_slice($errors, 0, 20),
        ]]);
    }

    /** Isi satu baris sesuai status yang dipilih admin. */
    private function importPayload(array $r, string $choice, string $type, $now): array
    {
        $stamps = ['created_at' => $now, 'updated_at' => $now];

        if ($choice === 'active') {
            return $r + ['type' => $type, 'status' => 'active'] + $stamps;
        }

        if ($choice === 'revoked') {
            return [
                'certificate_number' => $r['certificate_number'],
                'name'               => $r['name'],
                'type'               => $type,
                'status'             => 'revoked',
                'revoked_at'         => $r['revoked_at'] ?? now()->toDateString(),
                'suspension_scope'   => null,
                'suspension_status'  => null,
                'suspended_at'       => null,
            ] + $stamps;
        }

        // suspended_full | suspended_partial
        return [
            'certificate_number' => $r['certificate_number'],
            'name'               => $r['name'],
            'type'               => $type,
            'status'             => 'suspended',
            'suspension_scope'   => $choice === 'suspended_full' ? 'full' : 'partial',
            'suspension_status'  => $choice === 'suspended_full' ? 'Pembekuan Seluruh RL' : $r['suspension_status'],
            'suspended_at'       => $r['suspended_at'],
            'revoked_at'         => null,
        ] + $stamps;
    }

    /** Kolom yang diperbarui kalau nomor akreditasinya sudah ada. */
    private function importUpdateColumns(string $group): array
    {
        return match ($group) {
            // Import Terakreditasi: data umum diperbarui, STATUS tidak ditimpa
            'active'    => ['name', 'type', 'address', 'phone', 'email', 'scope', 'expiry_date', 'certificate_link', 'updated_at'],
            'suspended' => ['status', 'suspension_scope', 'suspension_status', 'suspended_at', 'revoked_at', 'updated_at'],
            default     => ['status', 'revoked_at', 'suspension_scope', 'suspension_status', 'suspended_at', 'updated_at'],
        };
    }

    // ==================================================================
    // IMPORT: STATUS DIBACA DARI KOLOM "STATUS" DI FILE
    // ==================================================================

    private const FILE_COLUMNS = [
        'certificate_number' => ['NO. AKREDITASI', 'NO AKREDITASI', 'NOMOR AKREDITASI', 'NO. SERTIFIKAT'],
        'name'               => ['NAMA LPK', 'NAMA LEMBAGA'],
        'file_status'        => ['STATUS'],
        'address'            => ['ALAMAT'],
        'phone'              => ['TELEPON/FAX', 'TELEPON', 'TELP/FAX', 'TELP'],
        'email'              => ['E-MAIL', 'EMAIL'],
        'expiry_date'        => ['MASA BERLAKU AKREDITASI (EXPIRED)', 'MASA BERLAKU AKREDITASI', 'MASA BERLAKU', 'EXPIRED'],
        'certificate_link'   => ['LINK'],
        'suspension_status'  => ['STATUS PEMBEKUAN'],
        'suspended_at'       => ['TANGGAL DIBEKUKAN', 'TGL DIBEKUKAN'],
        'revoked_at'         => ['TANGGAL DICABUT', 'TGL DICABUT'],
    ];

    // Dipakai hanya kalau kolom E-mail tidak ditemukan
    private const SCOPE_FALLBACK = ['LINGKUP', 'RUANG LINGKUP', 'KELOMPOK LINGKUP', 'PRODUK', 'BIDANG PEMERIKSAAN'];

    private function importFromFile(Request $request)
    {
        $type = $request->type;
        $dry  = $request->boolean('dry_run');

        $rows = Excel::toArray(new class {}, $request->file('file'))[0] ?? [];

        [$headerIdx, $map] = $this->detectHeader($rows, self::FILE_COLUMNS);
        if ($headerIdx === null || !in_array('file_status', $map, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Kolom wajib tidak ditemukan. File harus punya kolom: NO. AKREDITASI, NAMA LPK, STATUS.',
            ], 422);
        }

        // Kolom Lingkup = kolom tepat di sebelah kanan E-mail, apa pun judulnya
        $headerRow = $rows[$headerIdx];
        $scopeCol  = null;
        $emailCol  = array_search('email', $map, true);

        if ($emailCol !== false && array_key_exists($emailCol + 1, $headerRow) && !isset($map[$emailCol + 1])) {
            $scopeCol = $emailCol + 1;
        } else {
            $fallback = array_map(fn($s) => $this->norm($s), self::SCOPE_FALLBACK);
            foreach ($headerRow as $c => $cell) {
                if (!isset($map[$c]) && in_array($this->norm((string) $cell), $fallback, true)) {
                    $scopeCol = $c;
                    break;
                }
            }
        }

        $scopeLabel = null;
        if ($scopeCol !== null) {
            $map[$scopeCol] = 'scope';
            $scopeLabel = trim((string) ($headerRow[$scopeCol] ?? '')) ?: '(judul kolom kosong)';
        }

        // ---- Baca & validasi baris ----
        $fields  = [
            'certificate_number',
            'name',
            'file_status',
            'address',
            'phone',
            'email',
            'scope',
            'expiry_date',
            'certificate_link',
            'suspension_status',
            'suspended_at',
            'revoked_at'
        ];

        $records  = [];
        $errors   = [];
        $warnings = [];

        foreach (array_slice($rows, $headerIdx + 1, null, true) as $i => $row) {
            $rec    = array_fill_keys($fields, null);
            $filled = false;
            foreach ($map as $col => $field) {
                $v = $this->cell($row[$col] ?? null);
                if (in_array($v, ['-', '–', '—'], true)) $v = null;
                if ($v !== null) $filled = true;
                $rec[$field] = $v;
            }
            if (!$filled) continue; // baris kosong

            $label = 'Baris ' . ($i + 1);
            if (!$rec['certificate_number'] || !$rec['name']) {
                $errors[] = ['row' => $label, 'message' => 'No. Akreditasi atau Nama LPK kosong'];
                continue;
            }

            $resolved = $this->resolveFileStatus($rec['file_status'], $rec['suspension_status']);
            if (isset($resolved['error'])) {
                $errors[] = ['row' => $label, 'message' => $resolved['error']];
                continue;
            }
            if (isset($resolved['warning'])) {
                $warnings[] = ['row' => $label, 'message' => $resolved['warning']];
            }

            foreach (['expiry_date', 'suspended_at', 'revoked_at'] as $df) {
                if ($rec[$df] !== null) {
                    $d = $this->parseDate($rec[$df]);
                    if (!$d) {
                        $errors[] = ['row' => $label, 'message' => "Format tanggal tidak dikenali: {$rec[$df]}"];
                        continue 2;
                    }
                    $rec[$df] = $d;
                }
            }

            if (!empty($rec['certificate_link']) && !preg_match('#^https?://#i', $rec['certificate_link'])) {
                $rec['certificate_link'] = 'https://' . $rec['certificate_link'];
            }

            // Kosongkan isian yang tidak relevan dengan status hasil pembacaan
            $rec['status']            = $resolved['status'];
            $rec['suspension_scope']  = $resolved['suspension_scope'];
            $rec['suspension_status'] = $resolved['suspension_status'];
            if ($rec['status'] === 'active') {
                $rec['suspended_at'] = null;
                $rec['revoked_at']   = null;
            } elseif ($rec['status'] === 'suspended') {
                $rec['revoked_at'] = null;
            } else {
                $rec['suspended_at'] = null;
            }

            $records[$rec['certificate_number']] = $rec; // nomor ganda di file: baris terakhir dipakai
        }
        $records = array_values($records);

        // ---- Cek status LPK yang sudah ada di database ----
        $existing = [];
        foreach (array_chunk(array_column($records, 'certificate_number'), 500) as $chunk) {
            $existing += Lpk::whereIn('certificate_number', $chunk)->pluck('status', 'certificate_number')->all();
        }

        // LPK yang sudah Dicabut di database statusnya terkunci
        $records = array_values(array_filter($records, function ($r) use ($existing, &$errors) {
            if (($existing[$r['certificate_number']] ?? null) === 'revoked' && $r['status'] !== 'revoked') {
                $errors[] = ['row' => 'No. ' . $r['certificate_number'], 'message' => 'Sudah Dicabut di database, statusnya tidak dapat diubah'];
                return false;
            }
            return true;
        }));

        $new      = count(array_filter($records, fn($r) => !isset($existing[$r['certificate_number']])));
        $updated  = count($records) - $new;
        $byStatus = array_count_values(array_column($records, 'status'));

        if ($dry) {
            return response()->json(['success' => true, 'data' => [
                'total'        => count($records),
                'new'          => $new,
                'updated'      => $updated,
                'by_status'    => [
                    'active'    => $byStatus['active'] ?? 0,
                    'suspended' => $byStatus['suspended'] ?? 0,
                    'revoked'   => $byStatus['revoked'] ?? 0,
                ],
                'scope_column' => $scopeLabel,
                'warning_count' => count($warnings),
                'warnings'      => array_slice($warnings, 0, 20),
                'error_count'  => count($errors),
                'errors'       => array_slice($errors, 0, 20),
            ]]);
        }

        if (!$records) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris valid untuk diimpor.',
                'errors'  => array_slice($errors, 0, 20),
            ], 422);
        }

        // ---- Simpan ----
        $now        = now();
        $updateCols = [
            'name',
            'type',
            'address',
            'phone',
            'email',
            'scope',
            'expiry_date',
            'certificate_link',
            'status',
            'suspension_scope',
            'suspension_status',
            'suspended_at',
            'revoked_at',
            'updated_at'
        ];

        DB::transaction(function () use ($records, $type, $now, $updateCols) {
            foreach (array_chunk($records, 500) as $chunk) {
                $payload = array_map(fn($r) => [
                    'certificate_number' => $r['certificate_number'],
                    'name'               => $r['name'],
                    'type'               => $type,
                    'address'            => $r['address'],
                    'phone'              => $r['phone'],
                    'email'              => $r['email'],
                    'scope'              => $r['scope'],
                    'expiry_date'        => $r['expiry_date'],
                    'certificate_link'   => $r['certificate_link'],
                    'status'             => $r['status'],
                    'suspension_scope'   => $r['suspension_scope'],
                    'suspension_status'  => $r['suspension_status'],
                    'suspended_at'       => $r['suspended_at'],
                    'revoked_at'         => $r['revoked_at'],
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ], $chunk);

                Lpk::upsert($payload, ['certificate_number'], $updateCols);
            }
        });

        $message = "Import selesai: $new data baru, $updated data diperbarui.";
        if ($errors) $message .= ' ' . count($errors) . ' baris dilewati.';

        return response()->json(['success' => true, 'message' => $message, 'data' => [
            'total' => count($records),
            'new' => $new,
            'updated' => $updated,
            'error_count' => count($errors),
            'errors' => array_slice($errors, 0, 20),
        ]]);
    }

    /** Terjemahkan isi kolom STATUS di file ke status sistem. */
    private function resolveFileStatus(?string $raw, ?string $suspensionText): array
    {
        if ($raw === null) {
            return ['error' => 'Kolom STATUS kosong'];
        }

        $k = preg_replace('/[^a-z0-9]/', '', strtolower($raw));

        if ($k === 'inactivewithdrawn') {
            return ['status' => 'revoked', 'suspension_scope' => null, 'suspension_status' => null];
        }

        if ($k === 'activebeku') {
            $result = $this->suspendedFrom($suspensionText);
            if ($suspensionText === null) {
                $result['warning'] = 'Status "Active (beku)" tetapi Status Pembekuan kosong, jenis pembekuan belum ditentukan';
            }
            return $result;
        }

        // STATUS masih Active, tetapi Status Pembekuan terisi: dibaca sebagai Pembekuan
        if ($k === 'active' && $suspensionText !== null) {
            $result = $this->suspendedFrom($suspensionText);
            $result['warning'] = 'STATUS "Active" tetapi Status Pembekuan terisi, dibaca sebagai Pembekuan';
            return $result;
        }

        if (in_array($k, ['active', 'expired', 'kadaluarsaonprocess', 'kadaluarsa'], true)) {
            return ['status' => 'active', 'suspension_scope' => null, 'suspension_status' => null];
        }

        return ['error' => "Nilai STATUS tidak dikenali: $raw"];
    }

    /** Bentuk status Pembekuan dari isi kolom Status Pembekuan. */
    private function suspendedFrom(?string $text): array
    {
        if ($text === null) {
            return ['status' => 'suspended', 'suspension_scope' => null, 'suspension_status' => null];
        }
        if (stripos($text, 'seluruh') !== false) {
            return ['status' => 'suspended', 'suspension_scope' => 'full', 'suspension_status' => 'Pembekuan Seluruh RL'];
        }
        return ['status' => 'suspended', 'suspension_scope' => 'partial', 'suspension_status' => $text];
    }

    // ==================================================================
    // FUNGSI BANTU
    // ==================================================================

    private function norm(string $s): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($s)));
    }

    /** Cari baris judul (maks. 15 baris pertama) dan petakan kolom ke field. */
    private function detectHeader(array $rows, array $headers): array
    {
        $lookup = [];
        foreach ($headers as $field => $aliases) {
            foreach ($aliases as $a) $lookup[$this->norm($a)] = $field;
        }

        foreach (array_slice($rows, 0, 15, true) as $i => $row) {
            $map = [];
            foreach ($row as $c => $cell) {
                $k = $this->norm((string) $cell);
                if ($k !== '' && isset($lookup[$k]) && !in_array($lookup[$k], $map, true)) {
                    $map[$c] = $lookup[$k];
                }
            }
            if (in_array('certificate_number', $map, true) && in_array('name', $map, true)) {
                return [$i, $map];
            }
        }
        return [null, []];
    }

    private function cell(mixed $v): ?string
    {
        if ($v === null) return null;
        if (is_float($v) && floor($v) == $v) $v = (int) $v;
        $v = trim((string) $v);
        return $v === '' ? null : $v;
    }

    private function parseDate(string $v): ?string
    {
        // Excel menyimpan tanggal sebagai angka serial
        if (is_numeric($v) && $v > 20000 && $v < 80000) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $v))->toDateString();
        }

        $s = strtr(strtolower(trim($v)), [
            'januari' => 'january',
            'februari' => 'february',
            'maret' => 'march',
            'mei' => 'may',
            'juni' => 'june',
            'juli' => 'july',
            'agustus' => 'august',
            'oktober' => 'october',
            'desember' => 'december',
            'agu' => 'aug',
            'okt' => 'oct',
            'des' => 'dec',
        ]);

        foreach (['d/m/Y', 'd-m-Y', 'd.m.Y', 'Y-m-d', 'Y/m/d', 'j/n/Y', 'j-n-Y', 'd F Y', 'j F Y', 'd M Y', 'j M Y'] as $f) {
            try {
                $d = Carbon::createFromFormat('!' . $f, $s);
                if ($d && $d->year >= 1900 && $d->year <= 2200) return $d->toDateString();
            } catch (\Throwable $e) {
                // coba format berikutnya
            }
        }
        return null;
    }
}
