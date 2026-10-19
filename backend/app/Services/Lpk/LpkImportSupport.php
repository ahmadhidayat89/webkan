<?php

namespace App\Services\Lpk;

use App\Models\Lpk;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class LpkImportSupport
{
    public const FULL_SUSPENSION_STATUS = 'Pembekuan Seluruh RL';
    public const COLUMN_CERTIFICATE_NUMBER = 'NO. AKREDITASI';
    public const COLUMN_CERTIFICATE_NUMBER_ALT = 'NO AKREDITASI';
    public const COLUMN_CERTIFICATE_NUMBER_LONG = 'NOMOR AKREDITASI';
    public const COLUMN_LPK_NAME = 'NAMA LPK';
    public const COLUMN_INSTITUTION_NAME = 'NAMA LEMBAGA';

    private const DATE_FIELDS = ['expiry_date', 'suspended_at', 'revoked_at'];

    public function norm(string $s): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($s)));
    }

    /** Cari baris judul (maks. 15 baris pertama) dan petakan kolom ke field. */
    public function detectHeader(array $rows, array $headers): array
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

    public function cell(mixed $v): ?string
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

    public function parseDate(string $v): ?string
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

    public function normalizeCertificateLink(?string $link): ?string
    {
        if ($link && !preg_match('#^https?://#i', $link)) {
            return 'https://' . $link;
        }
        return $link;
    }

    public function normalizeImportDates(array &$record, string $label, array &$errors): bool
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

    public function existingRecords(array $records): array
    {
        $existing = [];
        foreach (array_chunk(array_column($records, 'certificate_number'), 500) as $chunk) {
            $existing += Lpk::whereIn('certificate_number', $chunk)->pluck('status', 'certificate_number')->all();
        }
        return $existing;
    }

    public function emptyImportResponse(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Tidak ada baris valid untuk diimpor.',
            'errors' => array_slice($errors, 0, 20),
        ], 422);
    }

    public function importResultResponse(array $records, array $errors, int $new, int $updated): JsonResponse
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
}
