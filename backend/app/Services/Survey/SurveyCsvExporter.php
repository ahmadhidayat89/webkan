<?php

namespace App\Services\Survey;

use App\Models\Survey;
use App\Models\SurveyResponse;

class SurveyCsvExporter
{
    public function write(Survey $survey, $responses): void
    {
        $file = fopen('php://output', 'w');
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($file, $this->headers($survey));
        foreach ($responses as $index => $response) {
            fputcsv($file, $this->responseRow($response, $survey->questions, $index));
        }
        fclose($file);
    }

    private function headers(Survey $survey): array
    {
        $headers = ['#', 'Waktu Pengisian'];
        foreach ($survey->questions as $question) {
            $headers[] = trim(html_entity_decode(strip_tags($question->text)));
        }
        return $headers;
    }

    private function responseRow(SurveyResponse $response, $questions, int $index): array
    {
        $row = [
            $index + 1,
            $response->created_at->format(SurveyResultsBuilder::DISPLAY_DATE_TIME_FORMAT),
        ];
        foreach ($questions as $question) {
            $value = $response->answers->firstWhere('question_id', $question->id)?->answer_value;
            $decoded = $value !== null ? json_decode($value, true) : null;
            $row[] = is_array($decoded) ? implode('; ', $decoded) : ($value ?? '');
        }
        return $row;
    }
}