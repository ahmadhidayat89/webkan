<?php

namespace App\Services\Survey;

use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Support\Collection;

class SurveyResultsBuilder
{
    public const DISPLAY_DATE_TIME_FORMAT = 'd/m/Y H:i';

    /**
     * Ringkasan per pertanyaan + rata-rata skala (null jika tidak ada jawaban skala).
     *
     * @return array{questions: array, average_scale: float|null}
     */
    public function summarize(Collection $questions, Collection $responses): array
    {
        $scaleScores = [];
        $summaries = [];

        foreach ($questions as $question) {
            $summaries[] = $this->questionSummary($question, $responses, $scaleScores);
        }

        $averageScale = count($scaleScores) > 0
            ? round(array_sum($scaleScores) / count($scaleScores), 1)
            : null;

        return [
            'questions' => $summaries,
            'average_scale' => $averageScale,
        ];
    }

    public function formatRespondent(SurveyResponse $response): array
    {
        $answers = [];
        foreach ($response->answers as $answer) {
            $decoded = json_decode($answer->answer_value, true);
            $answers[$answer->question_id] = is_array($decoded) ? implode('; ', $decoded) : $answer->answer_value;
        }

        return [
            'id' => $response->id,
            'created_at' => $response->created_at->copy()->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'),
            'created_at_human' => $response->created_at->copy()->timezone('Asia/Jakarta')->format(self::DISPLAY_DATE_TIME_FORMAT),
            'answers' => $answers,
        ];
    }

    private function questionSummary(SurveyQuestion $question, $responses, array &$scaleScores): array
    {
        $answers = $this->answersForQuestion($question, $responses);
        $summary = [
            'id' => $question->id,
            'text' => $question->text,
            'type' => $question->type,
            'is_required' => $question->is_required,
            'options' => $question->options ?? [],
            'total_answers' => count($answers),
        ];

        if (in_array($question->type, ['choice', 'check', 'drop'], true)) {
            $summary['counts'] = $this->choiceCounts($question->options ?? [], $answers);
        } elseif ($question->type === 'scale') {
            $summary['scale_counts'] = $this->scaleCounts($answers, $scaleScores);
        } else {
            $summary['sample_answers'] = array_slice($answers, 0, 10);
        }

        return $summary;
    }

    private function answersForQuestion(SurveyQuestion $question, $responses): array
    {
        $answers = [];
        foreach ($responses as $response) {
            $answer = $response->answers->firstWhere('question_id', $question->id);
            if ($answer && $answer->answer_value !== null && $answer->answer_value !== '') {
                $answers[] = $answer->answer_value;
            }
        }
        return $answers;
    }

    private function choiceCounts(array $options, array $answers): array
    {
        $counts = array_fill_keys($options, 0);
        foreach ($answers as $answer) {
            $values = json_decode($answer, true);
            foreach (is_array($values) ? $values : [$answer] as $value) {
                $counts[$value] = ($counts[$value] ?? 0) + 1;
            }
        }
        return $counts;
    }

    private function scaleCounts(array $answers, array &$scaleScores): array
    {
        $counts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($answers as $answer) {
            $score = (int) $answer;
            if ($score >= 1 && $score <= 5) {
                $counts[$score]++;
                $scaleScores[] = $score;
            }
        }
        return $counts;
    }
}
