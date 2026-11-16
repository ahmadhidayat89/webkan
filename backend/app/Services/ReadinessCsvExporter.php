<?php

namespace App\Services;

use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReadinessCsvExporter
{
    private const DISPLAY_DATE_TIME_FORMAT = 'd/m/Y H:i';

    private const DISPLAY_TIMEZONE = 'Asia/Jakarta';

    public function download(ReadinessAssessment $assessment): StreamedResponse
    {
        $responses = $assessment->responses()
            ->orderBy('created_at', 'desc')
            ->get();

        $draft = $assessment->draft;
        $identities = $draft['identity'] ?? [];
        $questions = $draft['questions'] ?? [];

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="hasil-readiness-assessment-' . $assessment->id . '.csv"',
        ];

        return response()->stream(
            fn () => $this->writeCsv($responses, $identities, $questions),
            200,
            $headers
        );
    }

    private function writeCsv(iterable $responses, array $identities, array $questions): void
    {
        $file = fopen('php://output', 'w');
        fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

        fputcsv($file, array_map([$this, 'safeCsvCell'], $this->csvHeaderRow($identities, $questions)), escape: '\\');

        foreach ($responses as $index => $response) {
            $row = $this->csvResponseRow($index, $response, $identities, $questions);
            fputcsv($file, array_map([$this, 'safeCsvCell'], $row), escape: '\\');
        }

        fclose($file);
    }

    private function csvHeaderRow(array $identities, array $questions): array
    {
        $headers = [
            '#',
            'Waktu Pengisian',
            'Cakupan',
            'Status Kesiapan',
            'Kesiapan (%)',
            'Ya',
            'Sebagian',
            'Tidak',
            'Opsional Dilewati',
        ];

        foreach ($identities as $identity) {
            $headers[] = $identity['label'];
        }

        foreach ($questions as $index => $question) {
            $reference = ! empty($question['reference']) ? ' (' . $question['reference'] . ')' : '';
            $headers[] = 'P' . ($index + 1) . $reference . ': ' . $question['text'];
        }

        return $headers;
    }

    private function csvResponseRow(int $index, ReadinessAssessmentResponse $response, array $identities, array $questions): array
    {
        $row = [
            $index + 1,
            $response->created_at?->copy()->timezone(self::DISPLAY_TIMEZONE)->format(self::DISPLAY_DATE_TIME_FORMAT) ?? '',
            $response->scope ?? 'Cakupan lengkap',
            $response->status,
            $response->percentage . '%',
            $response->yes_count,
            $response->partial_count,
            $response->no_count,
            $response->na_count,
        ];

        foreach ($identities as $identity) {
            $row[] = $response->identity[(string) $identity['id']] ?? '';
        }

        foreach ($questions as $question) {
            $answer = $response->responses[(string) $question['id']]['answer'] ?? null;
            $row[] = $this->csvAnswerLabel($answer, ! empty($question['allowNA']));
        }

        return $row;
    }

    private function csvAnswerLabel(mixed $answer, bool $optional): string
    {
        $labels = ['yes' => 'Ya', 'partial' => 'Sebagian', 'no' => 'Tidak'];

        if (is_string($answer) && isset($labels[$answer])) {
            return $labels[$answer];
        }

        return $optional ? 'Dilewati (Opsional)' : 'Belum Dijawab';
    }

    private function safeCsvCell(mixed $value): string
    {
        $text = (string) $value;

        return preg_match('/^[=+@\\-\\t\\r]/', $text) ? "'" . $text : $text;
    }
}
