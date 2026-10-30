<?php

namespace App\Services\Survey;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SurveyAnswerValidator
{
    /**
     * Pola SQL injection (lapisan tambahan; perlindungan utama tetap query
     * berparameter Eloquent).
     */
    private const SQLI_PATTERNS = [
        '/[\'"]\s*(or|and)\s+\S+\s*=\s*\S+/i',
        '/\b(or|and)\s+(\d+)\s*=\s*\2\b/i',
        '/\bunion\s+(all\s+)?select\b/i',
        '/\b(drop|truncate|alter)\s+table\b/i',
        '/[\'"]\s*--/',
        '/\bxp_cmdshell\b/i',
        '/\bsleep\s*\(\s*\d+\s*\)/i',
        '/\bbenchmark\s*\(/i',
    ];

    public function validate(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        if ($this->isEmptyAnswer($answer)) {
            if (in_array($question->type, ['grid', 'check_grid'], true) && ! empty($question->config['require_rows'])) {
                return 'Isi setiap baris tabel.';
            }

            return $question->is_required ? 'Pertanyaan ini wajib diisi.' : null;
        }

        // Urutan pemeriksaan: bentuk data -> pola SQL injection -> aturan per tipe
        return app(SurveyFlow::class)->validateExtended($question, $answer)
            ?? $this->validateShape($question, $answer)
            ?? $this->validateInjection($question, $answer)
            ?? $this->validateByType($question, $answer, $survey);
    }

    private function validateByType(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        $rules = $question->validation ?? [];

        return match (true) {
            $question->type === 'file' => $this->validateFileAnswer($question, $answer, $survey),
            in_array($question->type, ['short', 'para'], true) => $this->validateTextAnswer($question, $answer, $rules),
            $question->type === 'check' => $this->validateCheckAnswer($question, $answer, $rules),
            default => $this->validateOtherAnswer($question, $answer),
        };
    }

    private function validateFileAnswer(SurveyQuestion $question, array $answer, Survey $survey): ?string
    {
        $files = array_is_list($answer) ? $answer : [$answer];
        if (count($files) > ($question->config['file_max_files'] ?? 1)) {
            return 'Jumlah file melebihi batas.';
        }
        foreach ($files as $file) {
            $error = $this->validateStoredFile($question, $file, $survey);
            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    private function validateStoredFile(SurveyQuestion $question, $file, Survey $survey): ?string
    {
        if (! $this->isSurveyUpload($file, $survey)) {
            return 'Unggah berkas yang valid.';
        }
        $path = substr($file['url'], strlen(asset('storage/').'/'));
        $storage = Storage::disk('public');
        if (! $storage->exists($path)) {
            return 'Berkas tidak ditemukan.';
        }

        return $storage->size($path) > ($question->config['file_max_mb'] ?? 10) * 1024 * 1024
            ? 'Ukuran berkas melebihi batas.'
            : null;
    }

    /**
     * Pastikan bentuk jawaban sesuai tipe. Sebelumnya jawaban teks berbentuk array
     * bisa lolos tanpa pemeriksaan apa pun, lalu disimpan sebagai JSON.
     */
    private function validateShape(SurveyQuestion $question, $answer): ?string
    {
        $expectsArray = in_array($question->type, ['check', 'file', 'grid', 'check_grid'], true);
        if ($expectsArray !== is_array($answer)) {
            return 'Format jawaban tidak valid.';
        }

        if ($question->type === 'check' && array_filter($answer, fn ($item) => ! is_string($item))) {
            return 'Pilihan jawaban tidak valid.';
        }

        return null;
    }

    /**
     * Tolak jawaban teks (dan nama file) yang cocok dengan pola SQL injection.
     * Pilihan ganda, dropdown, kotak centang, dan skala sudah dibatasi whitelist/angka.
     */
    private function validateInjection(SurveyQuestion $question, $answer): ?string
    {
        $value = match ($question->type) {
            'short', 'para', 'email', 'phone' => $answer,
            'file' => $answer['name'] ?? '',
            default => null,
        };

        if (! is_string($value)) {
            return null;
        }

        foreach (self::SQLI_PATTERNS as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                // Isi jawaban sengaja tidak dicatat di log
                Log::warning('Survey answer blocked by SQLi pattern filter', [
                    'question_id' => $question->id,
                    'pattern' => $pattern,
                ]);

                return 'Jawaban mengandung pola yang tidak diizinkan.';
            }
        }

        return null;
    }

    private function isEmptyAnswer($answer): bool
    {
        return $answer === null || $answer === '' || (is_array($answer) && count($answer) === 0);
    }

    private function validateTextAnswer(SurveyQuestion $question, string $answer, array $rules): ?string
    {
        $length = mb_strlen(trim($answer));
        if (isset($rules['min_length']) && $length < $rules['min_length']) {
            return 'Jawaban terlalu pendek (minimal '.$rules['min_length'].' karakter).';
        }
        if (isset($rules['max_length']) && $length > $rules['max_length']) {
            return 'Jawaban terlalu panjang (maksimal '.$rules['max_length'].' karakter).';
        }

        $type = $question->type === 'short' ? ($rules['answer_type'] ?? 'text') : $question->type;

        return match ($type) {
            'email' => filter_var($answer, FILTER_VALIDATE_EMAIL) ? null : 'Masukkan alamat email yang valid.',
            'phone' => $this->isValidPhone($answer) ? null : 'Masukkan nomor telepon yang valid (7–15 digit).',
            'number' => is_numeric(str_replace(',', '.', $answer)) ? null : 'Masukkan angka yang valid.',
            'text_number' => preg_match('/^[\p{L}\p{N}\s.,\'-]+$/u', $answer) ? null : 'Gunakan huruf dan angka saja.',
            default => null,
        };
    }

    private function validateCheckAnswer(SurveyQuestion $question, array $answer, array $rules): ?string
    {
        if (isset($rules['min_selections']) && count($answer) < $rules['min_selections']) {
            return 'Pilih minimal '.$rules['min_selections'].' opsi.';
        }
        if (isset($rules['max_selections']) && count($answer) > $rules['max_selections']) {
            return 'Pilih maksimal '.$rules['max_selections'].' opsi.';
        }

        $invalidChoice = array_filter($answer, fn ($value) => ! $this->allowedChoice($question, $value));
        $choiceError = $invalidChoice ? 'Pilihan jawaban tidak valid.' : null;

        return count($answer) !== count(array_unique($answer)) ? 'Pilihan tidak boleh berulang.' : $choiceError;
    }

    private function validateOtherAnswer(SurveyQuestion $question, $answer): ?string
    {
        return match (true) {
            in_array($question->type, ['choice', 'drop'], true) && ! $this->allowedChoice($question, $answer) => 'Silakan pilih opsi yang tersedia.',
            $question->type === 'email' && (! is_string($answer) || ! filter_var($answer, FILTER_VALIDATE_EMAIL)) => 'Masukkan alamat email yang valid.',
            $question->type === 'phone' && (! is_string($answer) || ! $this->isValidPhone($answer)) => 'Masukkan nomor telepon yang valid (7–15 digit).',
            $question->type === 'scale' && (filter_var($answer, FILTER_VALIDATE_INT) === false || (int) $answer < 1 || (int) $answer > 5) => 'Pilih nilai skala antara 1 dan 5.',
            default => null,
        };
    }

    private function allowedChoice(SurveyQuestion $q, mixed $answer): bool
    {
        return is_string($answer) && (in_array($answer, $q->options ?? [], true) || (! empty($q->config['allow_other']) && str_starts_with($answer, 'Lainnya: ') && mb_strlen(trim(substr($answer, 9))) > 0 && mb_strlen($answer) <= 2000));
    }

    private function isValidPhone(string $answer): bool
    {
        $digits = preg_replace('/\D/', '', $answer);

        return preg_match('/^\+?[0-9() .-]{7,20}$/', $answer) === 1 && strlen($digits) >= 7 && strlen($digits) <= 15;
    }

    private function isSurveyUpload($answer, Survey $survey): bool
    {
        if (is_array($answer) && array_is_list($answer)) {
            return count($answer) > 0 && count($answer) <= 10 && count(array_filter($answer, fn ($file) => $this->isSurveyUpload($file, $survey))) === count($answer);
        }

        // url dan name harus string (sebelumnya bisa array dan memicu error)
        return is_array($answer)
            && ! empty($answer['url']) && is_string($answer['url'])
            && ! empty($answer['name']) && is_string($answer['name'])
            && ! str_contains($answer['url'], '..') && ! str_contains($answer['url'], '%')
            && str_starts_with($answer['url'], asset('storage/surveys/'.$survey->code.'/responses/'));
    }
}
