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
        // ← pindahkan persis dari controller
    }

    private function csvHeaderRow(array $identities, array $questions): array
    {
        // ← pindahkan persis dari controller
    }

    private function csvResponseRow(int $index, ReadinessAssessmentResponse $response, array $identities, array $questions): array
    {
        // ← pindahkan persis dari controller
    }

    private function csvAnswerLabel(mixed $answer, bool $optional): string
    {
        // ← pindahkan persis dari controller
    }

    private function safeCsvCell(mixed $value): string
    {
        // ← pindahkan persis dari controller
    }
}
