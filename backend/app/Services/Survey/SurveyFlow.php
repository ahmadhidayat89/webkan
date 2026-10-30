<?php

namespace App\Services\Survey;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Support\Collection;

class SurveyFlow
{
    public const CONTENT_TYPES = ['section', 'heading', 'video', 'image'];

    public function isOpen(Survey $survey): bool
    {
        $settings = $survey->settings ?? [];
        return $survey->is_active
            && (empty($settings['closes_at']) || now()->lt($settings['closes_at']))
            && (empty($settings['response_limit']) || $survey->responses()->count() < $settings['response_limit']);
    }

    /** Only forward jumps are allowed, so a malformed route can never loop. */
    public function visibleQuestions(Collection $questions, array $answers): Collection
    {
        $visible = collect();
        $target = null;
        foreach ($questions as $question) {
            if ($target !== null && !$this->isJumpTarget($question, $target)) {
                continue;
            }
            $target = null;
            $visible->push($question);
            $next = $this->branchDestination($question, $answers);
            if ($next === '__submit') {
                break;
            }
            if ($next && $this->hasSectionAfter($questions, $question, $next)) {
                $target = $next;
            }
        }
        return $visible;
    }

    private function isJumpTarget(object $question, mixed $target): bool
    {
        $config = $question->config ?? [];
        return $question->type === 'section' && ($config['key'] ?? null) === $target;
    }

    private function branchDestination(object $question, array $answers): mixed
    {
        if (!in_array($question->type, ['choice', 'drop'], true)) {
            return null;
        }
        $config = $question->config ?? [];
        $answer = $answers[$question->id] ?? null;
        return is_string($answer) ? ($config['branches'][$answer] ?? null) : null;
    }

    private function hasSectionAfter(Collection $questions, object $question, mixed $key): bool
    {
        return $questions->contains(fn ($q) => $q->order > $question->order && $q->type === 'section' && ($q->config['key'] ?? null) === $key);
    }

    // FIX: dipecah per tipe pertanyaan supaya Cognitive Complexity turun
    public function validateExtended(SurveyQuestion $question, mixed $answer): ?string
    {
        return match (true) {
            in_array($question->type, ['rating', 'linear'], true) => $this->validateRatingRange($question, $answer),
            $question->type === 'date' => $this->validateDate($answer),
            $question->type === 'time' => $this->validateTime($answer),
            $question->type === 'duration' => $this->validateDuration($answer),
            in_array($question->type, ['grid', 'check_grid'], true) => $this->validateGrid($question, $answer),
            in_array($question->type, ['short', 'para'], true) && is_string($answer) => $this->validateTextRules($question, $answer),
            default => null,
        };
    }

    private function validateRatingRange(SurveyQuestion $question, mixed $answer): ?string
    {
        $c = $question->config ?? [];
        $min = $question->type === 'rating' ? 1 : ($c['min'] ?? 1);
        $max = $c['max'] ?? 5;
        return filter_var($answer, FILTER_VALIDATE_INT) !== false && $answer >= $min && $answer <= $max ? null : "Pilih nilai antara $min dan $max.";
    }

    private function validateDate(mixed $answer): ?string
    {
        if (!is_string($answer) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $answer)) {
            return 'Masukkan tanggal yang valid.';
        }
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $answer);
        return $date && $date->format('Y-m-d') === $answer ? null : 'Masukkan tanggal yang valid.';
    }

    private function validateTime(mixed $answer): ?string
    {
        return is_string($answer) && preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $answer) ? null : 'Masukkan waktu yang valid.';
    }

    private function validateDuration(mixed $answer): ?string
    {
        return is_string($answer) && preg_match('/^\d{1,5}:[0-5]\d:[0-5]\d$/', $answer) ? null : 'Gunakan durasi jam:menit:detik.';
    }

    private function validateGrid(SurveyQuestion $question, mixed $answer): ?string
    {
        if (!is_array($answer)) {
            return 'Format jawaban tabel tidak valid.';
        }
        $c = $question->config ?? [];
        $rows = $c['rows'] ?? [];
        if (array_diff(array_keys($answer), $rows)) {
            return 'Baris tabel tidak valid.';
        }

        [$error, $selected] = $this->validateGridRows($question, $answer, $rows);
        return $error ?? $this->validateUniqueColumns($c, $selected);
    }

    /** @return array{0: ?string, 1: array} [pesan error, semua nilai terpilih] */
    private function validateGridRows(SurveyQuestion $question, array $answer, array $rows): array
    {
        $selected = [];
        foreach ($rows as $row) {
            $values = $this->gridRowValues($question, $answer[$row] ?? null);
            $error = $this->validateGridRow($question, $values);
            if ($error !== null) {
                return [$error, []];
            }
            $selected = array_merge($selected, $values);
        }
        return [null, $selected];
    }

    private function validateUniqueColumns(array $config, array $selected): ?string
    {
        $mustBeUnique = !empty($config['unique_columns']);
        return $mustBeUnique && count($selected) !== count(array_unique($selected))
            ? 'Setiap kolom hanya boleh dipilih sekali.'
            : null;
    }

    /** Nilai satu baris tabel dalam bentuk array (check_grid sudah array, grid satu nilai). */
    private function gridRowValues(SurveyQuestion $question, mixed $value): mixed
    {
        if ($question->type === 'check_grid') {
            return $value ?? [];
        }
        return $value === null || $value === '' ? [] : [$value];
    }

    private function validateGridRow(SurveyQuestion $question, mixed $values): ?string
    {
        $columns = $question->options ?? [];
        if (!is_array($values) || array_filter($values, fn ($v) => !is_string($v)) || array_diff($values, $columns)) {
            return 'Pilihan tabel tidak valid.';
        }
        $c = $question->config ?? [];
        $required = $question->is_required || !empty($c['require_rows']);
        if ($required && !$values) {
            return 'Isi setiap baris tabel.';
        }
        return count($values) !== count(array_unique($values)) ? 'Pilihan tabel tidak boleh berulang.' : null;
    }

    private function validateTextRules(SurveyQuestion $question, string $answer): ?string
    {
        $rules = $question->validation ?? [];
        $error = $this->validateNumericRange($rules, $answer);
        if ($error !== null) {
            return $error;
        }
        if (!empty($rules['contains']) && !str_contains($answer, $rules['contains'])) {
            return 'Jawaban harus memuat: ' . $rules['contains'];
        }
        return $this->validatePattern($rules, $answer);
    }

    private function validateNumericRange(array $rules, string $answer): ?string
    {
        if (isset($rules['min_value']) && (!is_numeric($answer) || $answer < $rules['min_value'])) {
            return 'Angka di bawah batas minimum.';
        }
        if (isset($rules['max_value']) && (!is_numeric($answer) || $answer > $rules['max_value'])) {
            return 'Angka di atas batas maksimum.';
        }
        return null;
    }

    private function validatePattern(array $rules, string $answer): ?string
    {
        if (empty($rules['pattern'])) {
            return null;
        }
        $regex = '~' . str_replace('~', '\\~', $rules['pattern']) . '~u';
        return @preg_match($regex, $answer) === 1 ? null : 'Format jawaban tidak sesuai pola.';
    }

    public function grade(Collection $questions, array $answers): array
    {
        $score = 0;
        $max = 0;
        foreach ($questions as $q) {
            $config = $q->config ?? [];
            $keys = $config['correct_answers'] ?? [];
            if (in_array($q->type, self::CONTENT_TYPES, true)) {
                continue;
            }
            $points = $config['points'] ?? ($keys ? 1 : 0);
            $max += $points;
            if (!$keys) {
                continue;
            }
            $answer = $answers[$q->id] ?? null;
            $given = is_array($answer) ? $answer : [(string) $answer];
            sort($given);
            sort($keys);
            if ($given === $keys) {
                $score += $points;
            }
        }
        return [$score, $max];
    }
}
