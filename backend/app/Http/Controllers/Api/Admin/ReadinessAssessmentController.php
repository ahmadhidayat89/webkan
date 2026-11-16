<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveReadinessAssessment;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use App\Services\ReadinessCsvExporter;
use App\Services\ReadinessMasterData;
use Illuminate\Validation\ValidationException;

class ReadinessAssessmentController extends Controller
{
    private const DISPLAY_DATE_TIME_FORMAT = 'd/m/Y H:i';

    private const DISPLAY_TIMEZONE = 'Asia/Jakarta';

    public function __construct(
        private readonly ReadinessMasterData $masterData,
        private readonly ReadinessCsvExporter $csvExporter,
    ) {}

    public function index()
    {
        $this->masterData->ensureDefaultTemplateSynced();

        $assessments = ReadinessAssessment::query()
            ->withCount('responses')
            ->latest('id')
            ->get()
            ->map(fn ($assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->draft['title'],
                'standard' => $assessment->draft['standard'],
                'subtitle' => $assessment->draft['subtitle'],
                'question_count' => count($assessment->draft['questions']),
                'clause_count' => count($assessment->draft['clauses']),
                'responses_count' => (int) $assessment->responses_count,
                'published_at' => $assessment->published_at,
            ]);

        return response()->json(['data' => $assessments]);
    }

    public function template()
    {
        $this->masterData->ensureDefaultTemplateSynced();

        return response()->json(['data' => $this->masterData->load()]);
    }

    public function updateTemplate(SaveReadinessAssessment $request)
    {
        $synced = $this->masterData->updateFromDraft($request->validated()['draft']);

        return response()->json(['data' => $this->masterData->load(), 'synced' => $synced]);
    }

    public function store(SaveReadinessAssessment $request)
    {
        $assessment = ReadinessAssessment::create($request->validated());

        return response()->json(['data' => $this->editorData($assessment)], 201);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        $this->masterData->ensureDefaultTemplateSynced();

        return response()->json(['data' => $this->editorData($readinessAssessment)]);
    }

    public function update(SaveReadinessAssessment $request, ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->update($request->validated());

        return $this->show($readinessAssessment);
    }

    public function destroy(ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->delete();

        return response()->noContent();
    }

    public function publish(ReadinessAssessment $readinessAssessment)
    {
        $draft = $readinessAssessment->draft;

        if ($draft['questions'] === []) {
            throw ValidationException::withMessages([
                'draft.questions' => 'Tambahkan minimal satu butir penilaian sebelum menerbitkan asesmen.',
            ]);
        }

        $readinessAssessment->update(['published' => $draft, 'published_at' => now()]);

        return $this->show($readinessAssessment);
    }

    public function unpublish(ReadinessAssessment $readinessAssessment)
    {
        $readinessAssessment->update(['published' => null, 'published_at' => null]);

        return $this->show($readinessAssessment);
    }

    public function responses(ReadinessAssessment $readinessAssessment)
    {
        $this->masterData->ensureDefaultTemplateSynced();

        $responses = $readinessAssessment->responses()
            ->orderBy('created_at', 'desc')
            ->get();

        $total = $responses->count();
        $last = $responses->first()?->created_at?->copy()->timezone(self::DISPLAY_TIMEZONE);
        $avgPct = $total > 0 ? round($responses->avg('percentage'), 1) : 0;

        $statusCounts = [
            'Siap' => $responses->where('status', 'Siap')->count(),
            'Cukup' => $responses->where('status', 'Cukup')->count(),
            'Kurang' => $responses->where('status', 'Kurang')->count(),
            'Belum' => $responses->where('status', 'Belum')->count(),
            'Belum Lengkap' => $responses->where('status', 'Belum Lengkap')->count(),
        ];

        $questions = $readinessAssessment->draft['questions'] ?? [];
        $questionSummary = [];

        foreach ($questions as $index => $question) {
            $qId = (string) $question['id'];
            $isOpt = ! empty($question['allowNA']);
            $counts = ['yes' => 0, 'partial' => 0, 'no' => 0, 'na' => 0];

            foreach ($responses as $resp) {
                $ans = $resp->responses[$qId]['answer'] ?? null;
                if ($ans === 'yes' || $ans === 'partial' || $ans === 'no') {
                    $counts[$ans]++;
                } elseif ($isOpt) {
                    $counts['na']++;
                }
            }

            $questionSummary[] = [
                'id' => $qId,
                'number' => $index + 1,
                'clauseId' => (string) $question['clauseId'],
                'reference' => $question['reference'] ?? null,
                'text' => $question['text'],
                'allowNA' => $isOpt,
                'documentId' => $question['documentId'] ?? null,
                'total_answers' => $counts['yes'] + $counts['partial'] + $counts['no'],
                'counts' => $counts,
            ];
        }

        $formattedResponses = $responses->map(fn (ReadinessAssessmentResponse $r) => [
            'id' => $r->id,
            'scope' => $r->scope,
            'selected_clauses' => $r->selected_clauses ?? [],
            'identity' => $r->identity ?? [],
            'responses' => $r->responses ?? [],
            'status' => $r->status,
            'percentage' => $r->percentage,
            'yes_count' => $r->yes_count,
            'partial_count' => $r->partial_count,
            'no_count' => $r->no_count,
            'na_count' => $r->na_count,
            'created_at' => $r->created_at?->copy()->timezone(self::DISPLAY_TIMEZONE)->format('Y-m-d H:i:s'),
            'created_at_human' => $r->created_at?->copy()->timezone(self::DISPLAY_TIMEZONE)->format(self::DISPLAY_DATE_TIME_FORMAT),
            'updated_at_human' => $r->updated_at?->copy()->timezone(self::DISPLAY_TIMEZONE)->format(self::DISPLAY_DATE_TIME_FORMAT),
        ])->values()->all();

        return response()->json([
            'data' => [
                'stats' => [
                    'total_responses' => $total,
                    'average_percentage' => $avgPct,
                    'ready_count' => $statusCounts['Siap'],
                    'status_counts' => $statusCounts,
                    'last_response_at' => $last ? $last->format('d/m/Y') : '-',
                    'last_response_time' => $last ? $last->format(self::DISPLAY_DATE_TIME_FORMAT) : '-',
                ],
                'question_summary' => $questionSummary,
                'responses' => $formattedResponses,
            ],
        ]);
    }

    public function destroyResponse(ReadinessAssessment $readinessAssessment, ReadinessAssessmentResponse $response)
    {
        abort_unless((int) $response->readiness_assessment_id === (int) $readinessAssessment->id, 404);
        $response->delete();

        return response()->noContent();
    }

    public function exportCsv(ReadinessAssessment $readinessAssessment)
    {
        $this->masterData->ensureDefaultTemplateSynced();

        return $this->csvExporter->download($readinessAssessment);
    }

    private function editorData(ReadinessAssessment $assessment): array
    {
        return array_merge(
            $assessment->only('id', 'draft', 'published_at', 'updated_at'),
            ['responses_count' => $assessment->responses()->count()]
        );
    }
}
