<?php

namespace App\Services\Lpk;

use App\Models\Lpk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Import LPK dengan status yang dipilih manual oleh admin
 * (Terakreditasi / Pembekuan / Dicabut).
 */
class LpkManualImporter
{
    private const IMPORT_COLUMNS = [
        'active' => [
            'certificate_number' => [LpkImportSupport::COLUMN_CERTIFICATE_NUMBER, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_ALT, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_LONG, 'NO. SERTIFIKAT'],
            'name'               => [LpkImportSupport::COLUMN_LPK_NAME, LpkImportSupport::COLUMN_INSTITUTION_NAME],
            'address'            => ['ALAMAT'],
            'phone'              => ['TELEPON/FAX', 'TELEPON', 'TELP/FAX', 'TELP'],
            'email'              => ['E-MAIL', 'EMAIL'],
            'scope'              => ['LINGKUP'],
            'expiry_date'        => ['MASA BERLAKU AKREDITASI (EXPIRED)', 'MASA BERLAKU AKREDITASI', 'MASA BERLAKU', 'EXPIRED'],
            'certificate_link'   => ['LINK'],
        ],
        'suspended' => [
            'certificate_number' => [LpkImportSupport::COLUMN_CERTIFICATE_NUMBER, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_ALT, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_LONG],
            'name'               => [LpkImportSupport::COLUMN_LPK_NAME, LpkImportSupport::COLUMN_INSTITUTION_NAME],
            'suspension_status'  => ['STATUS PEMBEKUAN', 'RUANG LINGKUP', 'LINGKUP', 'STATUS'],
            'suspended_at'       => ['TANGGAL DIBEKUKAN', 'TGL DIBEKUKAN'],
        ],
        'revoked' => [
            'certificate_number' => [LpkImportSupport::COLUMN_CERTIFICATE_NUMBER, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_ALT, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_LONG],
            'name'               => [LpkImportSupport::COLUMN_LPK_NAME, LpkImportSupport::COLUMN_INSTITUTION_NAME],
            'revoked_at'         => ['TANGGAL DICABUT', 'TGL DICABUT'],
        ],
    ];

    public function __construct(private LpkImportSupport $support)
    {
    }

    public function import(Request $request): JsonResponse
    {
        $choice = $request->status_choice;
        $group = str_starts_with($choice, 'suspended') ? 'suspended' : $choice;
        $headers = self::IMPORT_COLUMNS[$group];
        $rows = Excel::toArray(new class {}, $request->file('file'))[0] ?? [];
        [$headerIdx, $map] = $this->support->detectHeader($rows, $headers);
        if ($headerIdx === null) {
            return $this->missingImportHeaderResponse($headers);
        }

        [$records, $errors] = $this->buildImportRecords($rows, $headerIdx, $map, $headers);
        $existing = $this->support->existingRecords($records);
        $records = $this->excludeRevokedRecords($records, $group, $existing, $errors);

        return $this->finishImport($request, $records, $errors, $existing, $choice, $group);
    }

    private function finishImport(Request $request, array $records, array $errors, array $existing, string $choice, string $group): JsonResponse
    {
        $new     = count(array_filter($records, fn($r) => !isset($existing[$r['certificate_number']])));
        $updated = count($records) - $new;

        if ($request->boolean('dry_run')) {
            return $this->importPreviewResponse($records, $errors, $new, $updated);
        }
        if (!$records) {
            return $this->support->emptyImportResponse($errors);
        }

        $this->persistImportRecords($records, $choice, $request->type, $group);
        return $this->support->importResultResponse($records, $errors, $new, $updated);
    }

    private function missingImportHeaderResponse(array $headers): JsonResponse
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
            $value = $this->support->cell($row[$column] ?? null);
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
        if (!$this->support->normalizeImportDates($record, $label, $errors)) {
            return null;
        }
        $record['certificate_link'] = $this->support->normalizeCertificateLink($record['certificate_link']);
        return $record;
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

    private function importPreviewResponse(array $records, array $errors, int $new, int $updated): JsonResponse
    {
        return response()->json(['success' => true, 'data' => [
            'total' => count($records), 'new' => $new, 'updated' => $updated,
            'error_count' => count($errors), 'errors' => array_slice($errors, 0, 20),
            'preview' => array_slice($records, 0, 5),
        ]]);
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
            'suspension_status'  => $choice === 'suspended_full' ? LpkImportSupport::FULL_SUSPENSION_STATUS : $r['suspension_status'],
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
}
