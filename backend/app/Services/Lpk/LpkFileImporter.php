<?php

namespace App\Services\Lpk;

use App\Models\Lpk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Import LPK dengan status dibaca dari kolom "STATUS" di dalam file.
 */
class LpkFileImporter
{
    private const FILE_COLUMNS = [
        'certificate_number' => [LpkImportSupport::COLUMN_CERTIFICATE_NUMBER, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_ALT, LpkImportSupport::COLUMN_CERTIFICATE_NUMBER_LONG, 'NO. SERTIFIKAT'],
        'name'               => [LpkImportSupport::COLUMN_LPK_NAME, LpkImportSupport::COLUMN_INSTITUTION_NAME],
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

    public function __construct(private LpkImportSupport $support)
    {
    }

    public function import(Request $request): JsonResponse
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
        $existing = $this->support->existingRecords($records);
        $records = $this->excludeLockedRevokedRecords($records, $existing, $errors);
        $new = count(array_filter($records, fn ($record) => !isset($existing[$record['certificate_number']])));
        $updated = count($records) - $new;

        if ($request->boolean('dry_run')) {
            return $this->fileImportPreview($records, $errors, $warnings, $scopeLabel, $new, $updated);
        }
        if (!$records) {
            return $this->support->emptyImportResponse($errors);
        }

        $this->persistFileImportRecords($records, $request->type);
        return $this->support->importResultResponse($records, $errors, $new, $updated);
    }

    private function mapFileImportHeaders(array $rows): array
    {
        [$headerIndex, $map] = $this->support->detectHeader($rows, self::FILE_COLUMNS);
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
        $fallback = array_map(fn ($value) => $this->support->norm($value), self::SCOPE_FALLBACK);
        foreach ($headerRow as $column => $cell) {
            if (!isset($map[$column]) && in_array($this->support->norm((string) $cell), $fallback, true)) {
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
            $value = $this->support->cell($row[$column] ?? null);
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
            $valid = $this->support->normalizeImportDates($record, $label, $errors);
        }
        if ($valid) {
            $record['certificate_link'] = $this->support->normalizeCertificateLink($record['certificate_link']);
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

    private function fileImportPreview(array $records, array $errors, array $warnings, ?string $scopeLabel, int $new, int $updated): JsonResponse
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
            return ['status' => 'suspended', 'suspension_scope' => 'full', 'suspension_status' => LpkImportSupport::FULL_SUSPENSION_STATUS];
        }
        return ['status' => 'suspended', 'suspension_scope' => 'partial', 'suspension_status' => $text];
    }
}
