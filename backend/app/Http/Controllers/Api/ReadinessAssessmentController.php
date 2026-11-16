<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use App\Services\ReadinessMasterData;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReadinessAssessmentController extends Controller
{
    public function __construct(private readonly ReadinessMasterData $masterData) {}

    public function index()
    {
        $this->masterData->ensureDefaultTemplateSynced();

        $assessments = ReadinessAssessment::query()->whereNotNull('published_at')
            ->latest('published_at')->get(['id', 'published'])->map(fn($assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->published['title'],
                'standard' => $assessment->published['standard'],
                'subtitle' => $assessment->published['subtitle'],
            ]);

        return response()->json(['data' => $assessments]);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        $this->masterData->ensureDefaultTemplateSynced();
        $readinessAssessment->refresh();
        abort_unless($readinessAssessment->published_at, 404);

        return response()->json(['data' => $readinessAssessment->published]);
    }

    public function submit(Request $request, ReadinessAssessment $readinessAssessment)
    {
        $this->masterData->ensureDefaultTemplateSynced();
        $readinessAssessment->refresh();
        abort_unless($readinessAssessment->published_at, 404);

        $validated = $request->validate([
            'submission_token' => 'nullable|string|max:64',
            'scope' => 'nullable|string|max:250',
            'selected_clauses' => 'nullable|array|max:100',
            'selected_clauses.*' => 'string|max:64',
            'identity' => 'nullable|array|max:50',
            'responses' => 'required|array|max:500',
        ]);

        $published = $readinessAssessment->published;
        $activeClauseIds = $this->resolveActiveClauseIds($published, $validated['selected_clauses'] ?? null);
        $activeQuestions = $this->resolveActiveQuestions($published, $activeClauseIds);
        $cleanIdentity = $this->cleanIdentity($published['identity'] ?? [], $validated['identity'] ?? []);
        $tally = $this->tallyResponses($activeQuestions, $validated['responses']);

        $applicable = $tally['yes'] + $tally['partial'] + $tally['no'];
        $pct = $applicable > 0 ? (int) round((($tally['yes'] + 0.5 * $tally['partial']) / $applicable) * 100) : 0;
        $status = $this->determineStatus($tally['unansweredMand'], $applicable, $tally['na'], $pct, $tally['no']);

        $existing = null;
        if (! empty($validated['submission_token'])) {
            $existing = ReadinessAssessmentResponse::query()
                ->where('readiness_assessment_id', $readinessAssessment->id)
                ->where('submission_token', $validated['submission_token'])
                ->first();
        }

        $token = $existing?->submission_token ?: Str::random(64);
        $attributes = [
            'readiness_assessment_id' => $readinessAssessment->id,
            'submission_token' => $token,
            'scope' => $validated['scope'] ?? 'Cakupan lengkap',
            'selected_clauses' => $activeClauseIds,
            'identity' => $cleanIdentity,
            'responses' => $tally['clean'],
            'status' => $status,
            'percentage' => $pct,
            'yes_count' => $tally['yes'],
            'partial_count' => $tally['partial'],
            'no_count' => $tally['no'],
            'na_count' => $tally['na'],
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
        ];

        if ($existing) {
            $existing->update($attributes);
            $record = $existing;
        } else {
            $record = ReadinessAssessmentResponse::create($attributes);
        }

        return response()->json([
            'data' => [
                'id' => $record->id,
                'submission_token' => $record->submission_token,
                'status' => $record->status,
                'percentage' => $record->percentage,
            ],
        ]);
    }

    private function resolveActiveClauseIds(array $published, ?array $selectedClauses): array
    {
        $clauses = $published['clauses'] ?? [];
        $selected = $selectedClauses ?? array_column($clauses, 'id');
        $always = array_column(array_filter($clauses, fn($c) => ! empty($c['always'])), 'id');

        return array_values(array_unique(array_merge($selected, $always)));
    }

    private function resolveActiveQuestions(array $published, array $activeClauseIds): array
    {
        $questions = $published['questions'] ?? [];
        $active = array_values(array_filter(
            $questions,
            fn($q) => in_array((string) $q['clauseId'], $activeClauseIds, true)
        ));

        return $active === [] ? $questions : $active;
    }

    private function cleanIdentity(array $fields, array $input): array
    {
        $clean = [];

        foreach ($fields as $field) {
            $id = (string) $field['id'];
            $value = $input[$id] ?? '';
            if (is_scalar($value)) {
                $clean[$id] = mb_substr(trim((string) $value), 0, 500);
            }
        }

        return $clean;
    }

    private function tallyResponses(array $questions, array $responses): array
    {
        $tally = ['clean' => [], 'yes' => 0, 'partial' => 0, 'no' => 0, 'na' => 0, 'unansweredMand' => 0];

        foreach ($questions as $question) {
            $qId = (string) $question['id'];
            $raw = $responses[$qId]['answer'] ?? $responses[$qId] ?? null;
            $norm = $this->normalizeAnswer($raw);

            if ($norm !== null) {
                $tally['clean'][$qId] = ['answer' => $norm];
                $tally[$norm]++;
            } elseif (! empty($question['allowNA'])) {
                $tally['na']++;
            } else {
                $tally['unansweredMand']++;
            }
        }

        return $tally;
    }

    private function normalizeAnswer(mixed $raw): ?string
    {
        return match ($raw) {
            'yes', 'Ya' => 'yes',
            'partial', 'Sebagian' => 'partial',
            'no', 'Tidak' => 'no',
            default => null,
        };
    }

    private function determineStatus(int $unansweredMand, int $applicable, int $na, int $pct, int $no): string
    {
        return match (true) {
            $unansweredMand > 0 => 'Belum Lengkap',
            $applicable === 0 && $na > 0 => 'Tidak Diperlukan (Dilewati)',
            $pct >= 80 && $no === 0 => 'Siap',
            $pct >= 60 => 'Cukup',
            $pct >= 40 => 'Kurang',
            default => 'Belum',
        };
    }
}
