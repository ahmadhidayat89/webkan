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

    public function validateExtended(SurveyQuestion $question, mixed $answer): ?string
    {
        $c = $question->config ?? [];
        $rules = $question->validation ?? [];
        if (in_array($question->type, ['rating', 'linear'], true)) {
            $min = $question->type === 'rating' ? 1 : ($c['min'] ?? 1);
            $max = $c['max'] ?? 5;
            return filter_var($answer, FILTER_VALIDATE_INT) !== false && $answer >= $min && $answer <= $max ? null : "Pilih nilai antara $min dan $max.";
        }
        if ($question->type === 'date') {
            if (!is_string($answer) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $answer)) return 'Masukkan tanggal yang valid.';
            $date = is_string($answer) ? \DateTimeImmutable::createFromFormat('!Y-m-d', $answer) : false;
            return $date && $date->format('Y-m-d') === $answer ? null : 'Masukkan tanggal yang valid.';
        }
        if ($question->type === 'time') {
            return is_string($answer) && preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $answer) ? null : 'Masukkan waktu yang valid.';
        }
        if ($question->type === 'duration') {
            return is_string($answer) && preg_match('/^\d{1,5}:[0-5]\d:[0-5]\d$/', $answer) ? null : 'Gunakan durasi jam:menit:detik.';
        }
        if (in_array($question->type, ['grid', 'check_grid'], true)) {
            if (!is_array($answer)) return 'Format jawaban tabel tidak valid.';
            $rows = $c['rows'] ?? [];
            $columns = $question->options ?? [];
            if (array_diff(array_keys($answer), $rows)) return 'Baris tabel tidak valid.';
            $selected = [];
            foreach ($rows as $row) {
                $value = $answer[$row] ?? null;
                $values = $question->type === 'check_grid' ? ($value ?? []) : ($value === null || $value === '' ? [] : [$value]);
                if (!is_array($values) || array_filter($values, fn ($v) => !is_string($v)) || array_diff($values, $columns)) return 'Pilihan tabel tidak valid.';
                if (($question->is_required || !empty($c['require_rows'])) && !$values) return 'Isi setiap baris tabel.';
                if (count($values) !== count(array_unique($values))) return 'Pilihan tabel tidak boleh berulang.';
                $selected = array_merge($selected, $values);
            }
            if (!empty($c['unique_columns']) && count($selected) !== count(array_unique($selected))) return 'Setiap kolom hanya boleh dipilih sekali.';
        }
        if (in_array($question->type, ['short', 'para'], true) && is_string($answer)) {
            if (isset($rules['min_value']) && (!is_numeric($answer) || $answer < $rules['min_value'])) return 'Angka di bawah batas minimum.';
            if (isset($rules['max_value']) && (!is_numeric($answer) || $answer > $rules['max_value'])) return 'Angka di atas batas maksimum.';
            if (!empty($rules['contains']) && !str_contains($answer, $rules['contains'])) return 'Jawaban harus memuat: ' . $rules['contains'];
            if (!empty($rules['pattern']) && @preg_match('~' . str_replace('~', '\\~', $rules['pattern']) . '~u', $answer) !== 1) return 'Format jawaban tidak sesuai pola.';
        }
        return null;
    }

    public function grade(Collection $questions, array $answers): array
    {
        $score = 0;
        $max = 0;
        foreach ($questions as $q) {
            $config = $q->config ?? [];
            $keys = $config['correct_answers'] ?? [];
            if (in_array($q->type, self::CONTENT_TYPES, true)) continue;
            $points = $config['points'] ?? ($keys ? 1 : 0);
            $max += $points;
            if (!$keys) continue;
            $answer = $answers[$q->id] ?? null;
            $given = is_array($answer) ? $answer : [(string) $answer];
            sort($given);
            sort($keys);
            if ($given === $keys) $score += $points;
        }
        return [$score, $max];
    }
}
