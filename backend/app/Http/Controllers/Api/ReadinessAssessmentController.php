<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Admin\ReadinessAssessmentController as AdminReadinessAssessmentController;
use App\Http\Controllers\Controller;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReadinessAssessmentController extends Controller
{
    public function index()
    {
        app(AdminReadinessAssessmentController::class)->ensureDefaultTemplateSynced();

        $assessments = ReadinessAssessment::query()->whereNotNull('published_at')
            ->latest('published_at')->get(['id', 'published'])->map(fn ($assessment) => [
                'id' => $assessment->id,
                'title' => $assessment->published['title'],
                'standard' => $assessment->published['standard'],
                'subtitle' => $assessment->published['subtitle'],
            ]);

        return response()->json(['data' => $assessments]);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        app(AdminReadinessAssessmentController::class)->ensureDefaultTemplateSynced();
        $readinessAssessment->refresh();
        abort_unless($readinessAssessment->published_at, 404);

        return response()->json(['data' => $readinessAssessment->published]);
    }

    public function submit(Request $request, ReadinessAssessment $readinessAssessment)
    {
        app(AdminReadinessAssessmentController::class)->ensureDefaultTemplateSynced();
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
        $selectedClauses = $validated['selected_clauses'] ?? array_column($published['clauses'] ?? [], 'id');
        $alwaysClauses = array_column(
            array_filter($published['clauses'] ?? [], fn ($c) => ! empty($c['always'])),
            'id'
        );
        $activeClauseIds = array_values(array_unique(array_merge($selectedClauses, $alwaysClauses)));

        $activeQuestions = array_values(array_filter(
            $published['questions'] ?? [],
            fn ($q) => in_array((string) $q['clauseId'], $activeClauseIds, true)
        ));

        if ($activeQuestions === []) {
            $activeQuestions = $published['questions'] ?? [];
        }

        $cleanIdentity = [];
        foreach ($published['identity'] ?? [] as $field) {
            $id = (string) $field['id'];
            $val = $validated['identity'][$id] ?? '';
            if (is_scalar($val)) {
                $cleanIdentity[$id] = mb_substr(trim((string) $val), 0, 500);
            }
        }

        $cleanResponses = [];
        $yes = 0;
        $partial = 0;
        $no = 0;
        $na = 0;
        $unansweredMand = 0;

        foreach ($activeQuestions as $question) {
            $qId = (string) $question['id'];
            $isOptional = ! empty($question['allowNA']);
            $raw = $validated['responses'][$qId]['answer'] ?? $validated['responses'][$qId] ?? null;
            $norm = $this->normalizeAnswer($raw);

            if ($norm !== null) {
                $cleanResponses[$qId] = ['answer' => $norm];
                if ($norm === 'yes') {
                    $yes++;
                } elseif ($norm === 'partial') {
                    $partial++;
                } elseif ($norm === 'no') {
                    $no++;
                }
            } elseif ($isOptional) {
                $na++;
            } else {
                $unansweredMand++;
            }
        }

        $applicable = $yes + $partial + $no;
        $pct = $applicable > 0 ? (int) round((($yes + 0.5 * $partial) / $applicable) * 100) : 0;
        $status = $this->determineStatus($unansweredMand, $applicable, $na, $pct, $no);

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
            'responses' => $cleanResponses,
            'status' => $status,
            'percentage' => $pct,
            'yes_count' => $yes,
            'partial_count' => $partial,
            'no_count' => $no,
            'na_count' => $na,
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

    private function normalizeAnswer(mixed $raw): ?string
    {
        if ($raw === 'yes' || $raw === 'Ya') {
            return 'yes';
        }
        if ($raw === 'partial' || $raw === 'Sebagian') {
            return 'partial';
        }
        if ($raw === 'no' || $raw === 'Tidak') {
            return 'no';
        }

        return null;
    }

    private function determineStatus(int $unansweredMand, int $applicable, int $na, int $pct, int $no): string
    {
        if ($unansweredMand > 0) {
            return 'Belum Lengkap';
        }
        if ($applicable === 0 && $na > 0) {
            return 'Tidak Diperlukan (Dilewati)';
        }
        if ($pct >= 80 && $no === 0) {
            return 'Siap';
        }
        if ($pct >= 60) {
            return 'Cukup';
        }
        if ($pct >= 40) {
            return 'Kurang';
        }

        return 'Belum';
    }
}
