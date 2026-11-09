<?php

namespace App\Services\Survey;

use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class SurveyScoring
{
    private const WEIGHTED_TYPES = ['choice', 'drop', 'scale', 'rating', 'linear'];

    private function values(string $type, array $options, array $config): array
    {
        if (in_array($type, ['choice', 'drop'], true)) {
            return array_map('strval', $options);
        }
        $min = $type === 'linear' ? (int) ($config['min'] ?? 1) : 1;
        $max = $type === 'scale' ? 5 : (int) ($config['max'] ?? 5);

        return array_map('strval', range($min, $max));
    }

    public function validateConfig(array $question, int $index): array
    {
        $config = $question['config'] ?? [];
        if (($config['score_mode'] ?? 'exact') !== 'weighted') {
            unset($config['answer_scores']);

            return $config;
        }
        $scores = $config['answer_scores'] ?? [];
        $values = array_column($scores, 'value');
        $allowed = $this->values($question['type'], $question['options'] ?? [], $config);
        if (! in_array($question['type'], self::WEIGHTED_TYPES, true)
            || ! $allowed || count($values) !== count(array_unique($values))
            || array_diff($allowed, $values) || array_diff($values, $allowed)) {
            throw ValidationException::withMessages(["questions.$index.config.answer_scores" => 'Isi satu skor untuk setiap pilihan atau angka skala yang tersedia.']);
        }
        $config['answer_scores'] = array_map(fn ($entry) => ['value' => (string) $entry['value'], 'points' => (int) $entry['points']], $scores);
        $config['points'] = max(array_column($config['answer_scores'], 'points'));
        unset($config['correct_answers']);

        return $config;
    }

    public function grade(Collection $questions, array $answers): array
    {
        $score = 0;
        $max = 0;
        foreach ($questions as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) {
                continue;
            }
            [$earned, $possible] = $this->gradeQuestion($question, $answers[$question->id] ?? null);
            $score += $earned;
            $max += $possible;
        }

        return [$score, $max];
    }

    /** @return array{0: int|float, 1: int|float} [skor didapat, skor maksimum] */
    private function gradeQuestion(object $question, mixed $answer): array
    {
        $config = $question->config ?? [];
        if (($config['score_mode'] ?? 'exact') === 'weighted' && in_array($question->type, self::WEIGHTED_TYPES, true)) {
            return $this->gradeWeighted($question, $config, $answer);
        }

        return $this->gradeExact($config, $answer);
    }

    /** @return array{0: int|float, 1: int|float} */
    private function gradeWeighted(object $question, array $config, mixed $answer): array
    {
        $allowed = $this->values($question->type, $question->options ?? [], $config);
        $weights = collect($config['answer_scores'] ?? [])->whereIn('value', $allowed)->pluck('points', 'value')->all();

        return [
            is_scalar($answer) ? ($weights[(string) $answer] ?? 0) : 0,
            $weights ? max($weights) : 0,
        ];
    }

    /** @return array{0: int|float, 1: int|float} */
    private function gradeExact(array $config, mixed $answer): array
    {
        $keys = $config['correct_answers'] ?? [];
        $points = $config['points'] ?? ($keys ? 1 : 0);
        if (! $keys) {
            return [0, $points];
        }
        $given = is_array($answer) ? $answer : [(string) $answer];
        sort($given);
        sort($keys);

        return [$given === $keys ? $points : 0, $points];
    }
}
