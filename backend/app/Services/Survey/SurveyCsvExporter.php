<?php

namespace App\Services\Survey;

use App\Models\Survey;
use App\Models\SurveyResponse;

class SurveyCsvExporter
{
    public function write(Survey $survey, $responses): void
    {
        $file = fopen('php://output', 'w');
        fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($file, array_map([$this, 'safeCell'], $this->headers($survey)));
        foreach ($responses as $index => $response) {
            fputcsv($file, array_map([$this, 'safeCell'], $this->responseRow($response, $survey, $index)));
        }
        fclose($file);
    }

    private function safeCell($value): string
    {
        $text = (string) $value;
        return preg_match('/^[=+@\\-\\t\\r]/', $text) ? "'" . $text : $text;
    }

    private function headers(Survey $survey): array
    {
        $headers = ['#', 'Waktu Pengisian'];
        if (!empty($survey->settings['quiz'])) {
            $headers = array_merge($headers, ['Nilai', 'Nilai maksimum']);
        }
        foreach ($survey->questions as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) {
                continue;
            }
            $headers[] = trim(html_entity_decode(strip_tags($question->text)));
        }
        return $headers;
    }

    private function responseRow(SurveyResponse $response, Survey $survey, int $index): array
    {
        $row = [
            $index + 1,
            $response->created_at->copy()->timezone('Asia/Jakarta')->format(SurveyResultsBuilder::DISPLAY_DATE_TIME_FORMAT),
        ];
        if (!empty($survey->settings['quiz'])) {
            $row = array_merge($row, [$response->score, $response->max_score]);
        }
        foreach ($survey->questions as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) {
                continue;
            }
            $value = $response->answers->firstWhere('question_id', $question->id)?->answer_value;
            $decoded = $value !== null ? json_decode($value, true) : null;
            $row[] = is_array($decoded) ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : ($value ?? '');
        }
        return $row;
    }
}
