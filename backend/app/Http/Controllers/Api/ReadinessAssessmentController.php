<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use App\Services\ReadinessMasterData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReadinessAssessmentController extends Controller
{
    private const SQLI_PATTERNS = [
        '/[\'"]\s*(or|and)\s+\S+\s*=\s*\S+/i',
        '/\b(or|and)\s+(\d+)\s*=\s*\2\b/i',
        '/\bunion\s+(all\s+)?select\b/i',
        '/\b(drop|truncate|alter)\s+table\b/i',
        '/[\'"]\s*--/',
        '/\bxp_cmdshell\b/i',
        '/\bsleep\s*\(\s*\d+\s*\)/i',
        '/\bbenchmark\s*\(/i',
        '/<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta)\b/i',
        '/\b(javascript|vbscript|data)\s*:/i',
        '/\bon[a-z]+\s*=/i',
    ];

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
        $errors = [];

        foreach ($fields as $field) {
            $id = (string) $field['id'];
            $label = (string) ($field['label'] ?? $id);
            $raw = $input[$id] ?? '';

            if (! is_scalar($raw)) {
                continue;
            }

            [$sanitized, $error] = $this->sanitizeAndValidateIdentityField($id, $label, (string) $raw);
            if ($error !== null) {
                $errors["identity.$id"] = $error;
            }
            $clean[$id] = $sanitized;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $clean;
    }

    private function sanitizeAndValidateIdentityField(string $id, string $label, string $rawStr): array
    {
        if ($this->hasDangerousPattern($id, $rawStr)) {
            return ['', "Isian $label mengandung pola atau karakter yang tidak diizinkan."];
        }

        $sanitized = strip_tags($rawStr);
        $sanitized = str_replace(['<', '>', '`'], '', $sanitized);
        $sanitized = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $sanitized) ?? '';
        $sanitized = trim(preg_replace('/\s{2,}/u', ' ', $sanitized) ?? '');

        if ($sanitized === '') {
            return ['', null];
        }

        $labelLower = mb_strtolower($label);
        if ($id === 'I-04' || str_contains($labelLower, 'email')) {
            return $this->validateEmailIdentity($label, $sanitized);
        }
        if ($id === 'I-10' || str_contains($labelLower, 'tahun')) {
            return $this->validateYearIdentity($label, $sanitized);
        }

        return [mb_substr($sanitized, 0, 300), null];
    }

    private function hasDangerousPattern(string $id, string $value): bool
    {
        foreach (self::SQLI_PATTERNS as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                Log::warning('Readiness identity blocked by security filter', [
                    'field' => $id,
                    'pattern' => $pattern,
                ]);

                return true;
            }
        }

        return false;
    }

    private function validateEmailIdentity(string $label, string $value): array
    {
        $clean = mb_substr(preg_replace('/[\s"\'\\\\;()]+/u', '', $value) ?? '', 0, 254);
        $valid = filter_var($clean, FILTER_VALIDATE_EMAIL)
            && preg_match('/^[^\s?&=<>]+@[^\s?&=<>]+\.[^\s?&=<>]{2,}$/', $clean);

        return [$clean, $valid ? null : "Format $label tidak valid."];
    }

    private function validateYearIdentity(string $label, string $value): array
    {
        $digits = substr(preg_replace('/\D/', '', $value) ?? '', 0, 4);
        $year = (int) $digits;
        $currentYear = (int) date('Y');
        $valid = strlen($digits) === 4 && $year >= 1900 && $year <= $currentYear;

        return [$digits, $valid ? null : "$label harus berupa 4 digit angka antara 1900 dan $currentYear."];
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
