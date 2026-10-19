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
    private const FULL_SUSPENSION_STATUS = 'Pembekuan Seluruh RL';
    private const COLUMN_CERTIFICATE_NUMBER = 'NO. AKREDITASI';
    private const COLUMN_CERTIFICATE_NUMBER_ALT = 'NO AKREDITASI';
    private const COLUMN_CERTIFICATE_NUMBER_LONG = 'NOMOR AKREDITASI';
    private const COLUMN_LPK_NAME = 'NAMA LPK';
    private const COLUMN_INSTITUTION_NAME = 'NAMA LEMBAGA';

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
                $data['suspension_status'] = self::FULL_SUSPENSION_STATUS;
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
            'certificate_number' => [self::COLUMN_CERTIFICATE_NUMBER, self::COLUMN_CERTIFICATE_NUMBER_ALT, self::COLUMN_CERTIFICATE_NUMBER_LONG, 'NO. SERTIFIKAT'],
            'name'               => [self::COLUMN_LPK_NAME, self::COLUMN_INSTITUTION_NAME],
            'address'            => ['ALAMAT'],
            'phone'              => ['TELEPON/FAX', 'TELEPON', 'TELP/FAX', 'TELP'],
            'email'              => ['E-MAIL', 'EMAIL'],
            'scope'              => ['LINGKUP'],
            'expiry_date'        => ['MASA BERLAKU AKREDITASI (EXPIRED)', 'MASA BERLAKU AKREDITASI', 'MASA BERLAKU', 'EXPIRED'],
            'certificate_link'   => ['LINK'],
        ],
        'suspended' => [
            'certificate_number' => [self::COLUMN_CERTIFICATE_NUMBER, self::COLUMN_CERTIFICATE_NUMBER_ALT, self::COLUMN_CERTIFICATE_NUMBER_LONG],
            'name'               => [self::COLUMN_LPK_NAME, self::COLUMN_INSTITUTION_NAME],
            'suspension_status'  => ['STATUS PEMBEKUAN', 'RUANG LINGKUP', 'LINGKUP', 'STATUS'],
            'suspended_at'       => ['TANGGAL DIBEKUKAN', 'TGL DIBEKUKAN'],
        ],
        'revoked' => [
            'certificate_number' => [self::COLUMN_CERTIFICATE_NUMBER, self::COLUMN_CERTIFICATE_NUMBER_ALT, self::COLUMN_CERTIFICATE_NUMBER_LONG],
            'name'               => [self::COLUMN_LPK_NAME, self::COLUMN_INSTITUTION_NAME],
            'revoked_at'         => ['TANGGAL DICABUT', 'TGL DICABUT'],
        ],
    ];

    private const DATE_FIELDS = ['expiry_date', 'suspended_at', 'revoked_at'];

    public function importFile(Request $request)
    {
        $request->validate([
            'status_choice' => ['required', Rule::in(['from_file', 'active', 'suspended_full', 'suspended_partial', 'revoked'])],
            'type'          => ['required', 'string', 'max:191'],
            'file'          => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:1024'],
            'dry_run'       => ['nullable', 'boolean'],
        ]);

        // Status dibaca dari kolom STATUS di dalam file
        if ($request->status_choice === 'from_file') {
            return $this->importFromFile($request);
        }

        $choice = $request->status_choice;
        $group = str_starts_with($choice, 'suspended') ? 'suspended' : $choice;
        $headers = self::IMPORT_COLUMNS[$group];
        $rows = Excel::toArray(new class {}, $request->file('file'))[0] ?? [];
        [$headerIdx, $map] = $this->detectHeader($rows, $headers);
        if ($headerIdx === null) {
            return $this->missingImportHeaderResponse($headers);
        }

        [$records, $errors] = $this->buildImportRecords($rows, $headerIdx, $map, $headers);
        $existing = $this->existingRecords($records);
        $records = $this->excludeRevokedRecords($records, $group, $existing, $errors);

        $new     = count(array_filter($records, fn($r) => !isset($existing[$r['certificate_number']])));
        $updated = count($records) - $new;

        if ($request->boolean('dry_run')) {
            return $this->importPreviewResponse($records, $errors, $new, $updated);
        }
        if (!$records) {
            return $this->emptyImportResponse($errors);
        }

        $this->persistImportRecords($records, $choice, $request->type, $group);
        return $this->importResultResponse($records, $errors, $new, $updated);
    }

    private function missingImportHeaderResponse(array $headers)
    {
        $expected = implode(', ', array_map(fn ($column) => $column[0], $headers));
        return response()->json([
            'success' => false,
            'message' => "Baris judul kolom tidak ditemukan. File harus punya kolom: $expected",
        ], 422);
    }

    private function buildImportRecords(array $rows, int $headerIndex, array $map, array $headers): array
    {
        $records = [];
        $errors = [];
        foreach (array_slice($rows, $headerIndex + 1, null, true) as $index => $row) {
            $record = $this->parseImportRow($row, $map, $headers, $index + 1, $errors);
            if ($record !== null) {
                $records[$record['certificate_number']] = $record;
            }
        }
        return [array_values($records), $errors];
    }

    private function parseImportRow(array $row, array $map, array $headers, int $rowNumber, array &$errors): ?array
    {
        $record = array_fill_keys(array_keys($headers), null);
        $filled = false;
        foreach ($map as $column => $field) {
            $value = $this->cell($row[$column] ?? null);
            $filled = $filled || $value !== null;
            $record[$field] = $value;
        }
        $label = 'Baris ' . $rowNumber;
        if (!$filled || !$record['certificate_number'] || !$record['name']) {
            if ($filled) {
                $errors[] = ['row' => $label, 'message' => 'No. Akreditasi atau Nama LPK kosong'];
            }
            return null;
        }
        if (!$this->normalizeImportDates($record, $label, $errors)) {
            return null;
        }
        $record['certificate_link'] = $this->normalizeCertificateLink($record['certificate_link']);
        return $record;
    }

    private function normalizeImportDates(array &$record, string $label, array &$errors): bool
    {
        foreach (self::DATE_FIELDS as $field) {
            if (!array_key_exists($field, $record) || $record[$field] === null) {
                continue;
            }
            $date = $this->parseDate($record[$field]);
            if (!$date) {
                $errors[] = ['row' => $label, 'message' => "Format tanggal tidak dikenali: {$record[$field]}"];
                return false;
            }
            $record[$field] = $date;
        }
        return true;
    }

    private function normalizeCertificateLink(?string $link): ?string
    {
        if ($link && !preg_match('#^https?://#i', $link)) {
            return 'https://' . $link;
        }
        return $link;
    }

    private function existingRecords(array $records): array
    {
        $existing = [];
        foreach (array_chunk(array_column($records, 'certificate_number'), 500) as $chunk) {
            $existing += Lpk::whereIn('certificate_number', $chunk)->pluck('status', 'certificate_number')->all();
        }
        return $existing;
    }

    private function excludeRevokedRecords(array $records, string $group, array $existing, array &$errors): array
    {
        if ($group !== 'suspended') {
            return $records;
        }
        return array_values(array_filter($records, function ($record) use ($existing, &$errors) {
            if (($existing[$record['certificate_number']] ?? null) === 'revoked') {
                $errors[] = ['row' => 'No. ' . $record['certificate_number'], 'message' => 'Sudah Dicabut, tidak dapat dibekukan'];
                return false;
            }
            return true;
        }));
    }

    private function importPreviewResponse(array $records, array $errors, int $new, int $updated)
    {
        return response()->json(['success' => true, 'data' => [
            'total' => count($records), 'new' => $new, 'updated' => $updated,
            'error_count' => count($errors), 'errors' => array_slice($errors, 0, 20),
            'preview' => array_slice($records, 0, 5),
        ]]);
    }

    private function emptyImportResponse(array $errors)
    {
        return response()->json([
            'success' => false,
            'message' => 'Tidak ada baris valid untuk diimpor.',
            'errors' => array_slice($errors, 0, 20),
        ], 422);
    }

    private function persistImportRecords(array $records, string $choice, string $type, string $group): void
    {
        $now = now();
        $columns = $this->importUpdateColumns($group);
        DB::transaction(function () use ($records, $choice, $type, $now, $columns) {
            foreach (array_chunk($records, 500) as $chunk) {
                $payload = array_map(fn ($record) => $this->importPayload($record, $choice, $type, $now), $chunk);
                Lpk::upsert($payload, ['certificate_number'], $columns);
            }
        });
    }

    private function importResultResponse(array $records, array $errors, int $new, int $updated)
    {
        $message = "Import selesai: $new data baru, $updated data diperbarui.";
        if ($errors) {
            $message .= ' ' . count($errors) . ' baris dilewati.';
        }
        return response()->json(['success' => true, 'message' => $message, 'data' => [
            'total' => count($records), 'new' => $new, 'updated' => $updated,
            'error_count' => count($errors), 'errors' => array_slice($errors, 0, 20),
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
            'suspension_status'  => $choice === 'suspended_full' ? self::FULL_SUSPENSION_STATUS : $r['suspension_status'],
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
        'certificate_number' => [self::COLUMN_CERTIFICATE_NUMBER, self::COLUMN_CERTIFICATE_NUMBER_ALT, self::COLUMN_CERTIFICATE_NUMBER_LONG, 'NO. SERTIFIKAT'],
        'name'               => [self::COLUMN_LPK_NAME, self::COLUMN_INSTITUTION_NAME],
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
        $rows = Excel::toArray(new class {}, $request->file('file'))[0] ?? [];
        [$headerIndex, $map, $scopeLabel] = $this->mapFileImportHeaders($rows);
        if ($headerIndex === null) {
            return response()->json([
                'success' => false,
                'message' => 'Kolom wajib tidak ditemukan. File harus punya kolom: NO. AKREDITASI, NAMA LPK, STATUS.',
            ], 422);
        }

        [$records, $errors, $warnings] = $this->buildFileImportRecords($rows, $headerIndex, $map);
        $existing = $this->existingRecords($records);
        $records = $this->excludeLockedRevokedRecords($records, $existing, $errors);
        $new = count(array_filter($records, fn ($record) => !isset($existing[$record['certificate_number']])));
        $updated = count($records) - $new;

        if ($request->boolean('dry_run')) {
            return $this->fileImportPreview($records, $errors, $warnings, $scopeLabel, $new, $updated);
        }
        if (!$records) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada baris valid untuk diimpor.',
                'errors' => array_slice($errors, 0, 20),
            ], 422);
        }

        $this->persistFileImportRecords($records, $request->type);
        return $this->importResultResponse($records, $errors, $new, $updated);
    }

    private function mapFileImportHeaders(array $rows): array
    {
        [$headerIndex, $map] = $this->detectHeader($rows, self::FILE_COLUMNS);
        if ($headerIndex === null || !in_array('file_status', $map, true)) {
            return [null, [], null];
        }

        $headerRow = $rows[$headerIndex];
        $emailColumn = array_search('email', $map, true);
        $scopeColumn = null;
        if ($emailColumn !== false && isset($headerRow[$emailColumn + 1]) && !isset($map[$emailColumn + 1])) {
            $scopeColumn = $emailColumn + 1;
        } else {
            $scopeColumn = $this->findFallbackScopeColumn($headerRow, $map);
        }

        $scopeLabel = null;
        if ($scopeColumn !== null) {
            $map[$scopeColumn] = 'scope';
            $scopeLabel = trim((string) ($headerRow[$scopeColumn] ?? '')) ?: '(judul kolom kosong)';
        }
        return [$headerIndex, $map, $scopeLabel];
    }

    private function findFallbackScopeColumn(array $headerRow, array $map): ?int
    {
        $fallback = array_map(fn ($value) => $this->norm($value), self::SCOPE_FALLBACK);
        foreach ($headerRow as $column => $cell) {
            if (!isset($map[$column]) && in_array($this->norm((string) $cell), $fallback, true)) {
                return $column;
            }
        }
        return null;
    }

    private function buildFileImportRecords(array $rows, int $headerIndex, array $map): array
    {
        $fields = ['certificate_number', 'name', 'file_status', 'address', 'phone', 'email', 'scope', 'expiry_date', 'certificate_link', 'suspension_status', 'suspended_at', 'revoked_at'];
        $records = [];
        $errors = [];
        $warnings = [];
        foreach (array_slice($rows, $headerIndex + 1, null, true) as $index => $row) {
            $record = $this->parseFileImportRow($row, $map, $fields, $index + 1, $errors, $warnings);
            if ($record !== null) {
                $records[$record['certificate_number']] = $record;
            }
        }
        return [array_values($records), $errors, $warnings];
    }

    private function parseFileImportRow(array $row, array $map, array $fields, int $rowNumber, array &$errors, array &$warnings): ?array
    {
        $record = array_fill_keys($fields, null);
        $filled = false;
        foreach ($map as $column => $field) {
            $value = $this->cell($row[$column] ?? null);
            if (in_array($value, ['-', '–', '—'], true)) {
                $value = null;
            }
            $filled = $filled || $value !== null;
            $record[$field] = $value;
        }
        if (!$filled) {
            return null;
        }

        $label = 'Baris ' . $rowNumber;
        $valid = (bool) $record['certificate_number'] && (bool) $record['name'];
        if (!$valid) {
            $errors[] = ['row' => $label, 'message' => 'No. Akreditasi atau Nama LPK kosong'];
        }
        if ($valid) {
            $valid = $this->resolveFileImportStatus($record, $label, $errors, $warnings);
        }
        if ($valid) {
            $valid = $this->normalizeImportDates($record, $label, $errors);
        }
        if ($valid) {
            $record['certificate_link'] = $this->normalizeCertificateLink($record['certificate_link']);
        }
        return $valid ? $record : null;
    }

    private function resolveFileImportStatus(array &$record, string $label, array &$errors, array &$warnings): bool
    {
        $resolved = $this->resolveFileStatus($record['file_status'], $record['suspension_status']);
        if (isset($resolved['error'])) {
            $errors[] = ['row' => $label, 'message' => $resolved['error']];
            return false;
        }
        if (isset($resolved['warning'])) {
            $warnings[] = ['row' => $label, 'message' => $resolved['warning']];
        }
        $record['status'] = $resolved['status'];
        $record['suspension_scope'] = $resolved['suspension_scope'];
        $record['suspension_status'] = $resolved['suspension_status'];
        $this->clearIrrelevantFileStatusDates($record);
        return true;
    }

    private function clearIrrelevantFileStatusDates(array &$record): void
    {
        if ($record['status'] === 'active') {
            $record['suspended_at'] = null;
            $record['revoked_at'] = null;
        } elseif ($record['status'] === 'suspended') {
            $record['revoked_at'] = null;
        } else {
            $record['suspended_at'] = null;
        }
    }

    private function excludeLockedRevokedRecords(array $records, array $existing, array &$errors): array
    {
        return array_values(array_filter($records, function ($record) use ($existing, &$errors) {
            if (($existing[$record['certificate_number']] ?? null) === 'revoked' && $record['status'] !== 'revoked') {
                $errors[] = ['row' => 'No. ' . $record['certificate_number'], 'message' => 'Sudah Dicabut di database, statusnya tidak dapat diubah'];
                return false;
            }
            return true;
        }));
    }

    private function fileImportPreview(array $records, array $errors, array $warnings, ?string $scopeLabel, int $new, int $updated)
    {
        $byStatus = array_count_values(array_column($records, 'status'));
        return response()->json(['success' => true, 'data' => [
            'total' => count($records), 'new' => $new, 'updated' => $updated,
            'by_status' => ['active' => $byStatus['active'] ?? 0, 'suspended' => $byStatus['suspended'] ?? 0, 'revoked' => $byStatus['revoked'] ?? 0],
            'scope_column' => $scopeLabel, 'warning_count' => count($warnings), 'warnings' => array_slice($warnings, 0, 20),
            'error_count' => count($errors), 'errors' => array_slice($errors, 0, 20),
        ]]);
    }

    private function persistFileImportRecords(array $records, string $type): void
    {
        $now = now();
        $columns = ['name', 'type', 'address', 'phone', 'email', 'scope', 'expiry_date', 'certificate_link', 'status', 'suspension_scope', 'suspension_status', 'suspended_at', 'revoked_at', 'updated_at'];
        DB::transaction(function () use ($records, $type, $now, $columns) {
            foreach (array_chunk($records, 500) as $chunk) {
                $payload = array_map(fn ($record) => $this->fileImportPayload($record, $type, $now), $chunk);
                Lpk::upsert($payload, ['certificate_number'], $columns);
            }
        });
    }

    private function fileImportPayload(array $record, string $type, $now): array
    {
        return [
            'certificate_number' => $record['certificate_number'], 'name' => $record['name'], 'type' => $type,
            'address' => $record['address'], 'phone' => $record['phone'], 'email' => $record['email'], 'scope' => $record['scope'],
            'expiry_date' => $record['expiry_date'], 'certificate_link' => $record['certificate_link'], 'status' => $record['status'],
            'suspension_scope' => $record['suspension_scope'], 'suspension_status' => $record['suspension_status'],
            'suspended_at' => $record['suspended_at'], 'revoked_at' => $record['revoked_at'], 'created_at' => $now, 'updated_at' => $now,
        ];
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
            return ['status' => 'suspended', 'suspension_scope' => 'full', 'suspension_status' => self::FULL_SUSPENSION_STATUS];
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
            foreach ($aliases as $a) {
                $lookup[$this->norm($a)] = $field;
            }
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
        if ($v === null) {
            return null;
        }
        if (is_float($v) && floor($v) == $v) {
            $v = (int) $v;
        }
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
                if ($d && $d->year >= 1900 && $d->year <= 2200) {
                    return $d->toDateString();
                }
            } catch (\Throwable $e) {
                // coba format berikutnya
            }
        }
        return null;
    }
}
