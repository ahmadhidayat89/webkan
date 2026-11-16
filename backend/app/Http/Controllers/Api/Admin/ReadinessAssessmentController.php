<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveReadinessAssessment;
use App\Models\ReadinessAssessment;
use App\Models\ReadinessAssessmentResponse;
use App\Services\ReadinessMasterSync;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ReadinessAssessmentController extends Controller
{
    private const DISPLAY_DATE_TIME_FORMAT = 'd/m/Y H:i';

    private const DISPLAY_TIMEZONE = 'Asia/Jakarta';

    public function index()
    {
        $this->ensureDefaultTemplateSynced();

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
        $this->ensureDefaultTemplateSynced();

        return response()->json(['data' => $this->loadMasterData()]);
    }

    public function ensureDefaultTemplateSynced(): void
    {
        $this->ensureResponsesTableExists();

        $settings = DB::table('readiness_master_settings')->first();

        if (! $settings) {
            $path = resource_path('readiness/lsp-17024.json');
            $default = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $this->saveMasterData($default);
        } elseif (DB::table('readiness_master_clauses')->where('item_id', 'KAN')->exists()) {
            $path = resource_path('readiness/lsp-17024.json');
            $default = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $this->syncDefaultTemplate($default);
        }
    }

    public function updateTemplate(SaveReadinessAssessment $request)
    {
        $draft = $request->validated()['draft'];
        $synced = 0;

        DB::transaction(function () use ($draft, &$synced) {
            $old = $this->loadMasterData();
            $this->saveMasterData($draft);
            $new = $this->loadMasterData();

            // Hanya form yang belum terbit yang mengikuti perubahan data master.
            ReadinessAssessment::query()->whereNull('published_at')->lockForUpdate()->get()
                ->each(function (ReadinessAssessment $assessment) use ($old, $new, &$synced) {
                    $updated = ReadinessMasterSync::apply($old, $new, $assessment->draft);

                    if ($updated != $assessment->draft) {
                        $assessment->update(['draft' => $updated]);
                        $synced++;
                    }
                });
        });

        return response()->json(['data' => $this->loadMasterData(), 'synced' => $synced]);
    }

    public function store(SaveReadinessAssessment $request)
    {
        $assessment = ReadinessAssessment::create($request->validated());

        return response()->json(['data' => $this->editorData($assessment)], 201);
    }

    public function show(ReadinessAssessment $readinessAssessment)
    {
        $this->ensureDefaultTemplateSynced();

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
        $this->ensureDefaultTemplateSynced();

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
        $this->ensureDefaultTemplateSynced();

        $responses = $readinessAssessment->responses()
            ->orderBy('created_at', 'desc')
            ->get();

        $draft = $readinessAssessment->draft;
        $identities = $draft['identity'] ?? [];
        $questions = $draft['questions'] ?? [];

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="hasil-readiness-assessment-' . $readinessAssessment->id . '.csv"',
        ];

        $callback = fn () => $this->writeCsv($responses, $identities, $questions);

        return response()->stream($callback, 200, $headers);
    }

    private function writeCsv(iterable $responses, array $identities, array $questions): void
    {
        $file = fopen('php://output', 'w');
        fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

        fputcsv($file, array_map([$this, 'safeCsvCell'], $this->csvHeaderRow($identities, $questions)));

        foreach ($responses as $index => $response) {
            $row = $this->csvResponseRow($index, $response, $identities, $questions);
            fputcsv($file, array_map([$this, 'safeCsvCell'], $row));
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

    private function editorData(ReadinessAssessment $assessment): array
    {
        return array_merge(
            $assessment->only('id', 'draft', 'published_at', 'updated_at'),
            ['responses_count' => $assessment->responses()->count()]
        );
    }

    private function ensureResponsesTableExists(): void
    {
        if (Schema::hasTable('readiness_assessment_responses')) {
            return;
        }

        Schema::create('readiness_assessment_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('readiness_assessment_id')
                ->constrained('readiness_assessments')
                ->cascadeOnDelete();
            $table->string('submission_token', 64)->nullable()->unique();
            $table->string('scope', 250)->nullable();
            $table->json('selected_clauses')->nullable();
            $table->json('identity')->nullable();
            $table->json('responses')->nullable();
            $table->string('status', 80)->default('Belum');
            $table->unsignedSmallInteger('percentage')->default(0);
            $table->unsignedSmallInteger('yes_count')->default(0);
            $table->unsignedSmallInteger('partial_count')->default(0);
            $table->unsignedSmallInteger('no_count')->default(0);
            $table->unsignedSmallInteger('na_count')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['readiness_assessment_id', 'created_at']);
        });
    }

    private function loadMasterData(): array
    {
        $settings = DB::table('readiness_master_settings')->first();

        $clauses = DB::table('readiness_master_clauses')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->item_id,
                'code' => $row->code,
                'title' => $row->title,
                'description' => $row->description,
                'always' => (bool) $row->always,
            ])
            ->values()
            ->all();

        $documents = DB::table('readiness_master_documents')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->item_id,
                'code' => $row->code,
                'title' => $row->title,
                'sample' => $row->sample,
            ])
            ->values()
            ->all();

        $questions = DB::table('readiness_master_questions')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->item_id,
                'clauseId' => (string) $row->clause_id,
                'reference' => $row->reference,
                'text' => $row->text,
                'allowNA' => (bool) $row->allow_na,
                'documentId' => $row->document_id !== null ? (string) $row->document_id : null,
                'evidence' => $row->evidence,
            ])
            ->values()
            ->all();

        $identity = DB::table('readiness_master_identities')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->item_id,
                'label' => $row->label,
            ])
            ->values()
            ->all();

        $glossary = DB::table('readiness_master_glossaries')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => [
                'id' => (string) $row->item_id,
                'term' => $row->term,
                'definition' => $row->definition,
                'note' => $row->note,
            ])
            ->values()
            ->all();

        return [
            'title' => $settings->title ?? 'SiapKAN — Penilaian Kesiapan Akreditasi LSP',
            'standard' => $settings->standard ?? 'SNI ISO/IEC 17024:2026',
            'subtitle' => $settings->subtitle ?? null,
            'intro' => $settings->intro ?? null,
            'clauses' => $clauses,
            'questions' => $questions,
            'identity' => $identity,
            'documents' => $documents,
            'glossary' => $glossary,
        ];
    }

    private function syncDefaultTemplate(array $default): void
    {
        DB::transaction(function () use ($default) {
            $old = $this->loadMasterData();
            $this->saveMasterData($default);
            $new = $this->loadMasterData();

            ReadinessAssessment::query()->lockForUpdate()->get()
                ->each(function (ReadinessAssessment $assessment) use ($old, $new) {
                    $updatedDraft = ReadinessMasterSync::apply($old, $new, $assessment->draft);
                    $changes = [];
                    if ($updatedDraft != $assessment->draft) {
                        $changes['draft'] = $updatedDraft;
                    }
                    if ($assessment->published !== null) {
                        $updatedPublished = ReadinessMasterSync::apply($old, $new, $assessment->published);
                        if ($updatedPublished != $assessment->published) {
                            $changes['published'] = $updatedPublished;
                        }
                    }
                    if ($changes !== []) {
                        $assessment->update($changes);
                    }
                });
        });
    }

    private function saveMasterData(array $draft): void
    {
        DB::transaction(function () use ($draft) {
            $now = now();

            DB::table('readiness_master_settings')->delete();
            DB::table('readiness_master_settings')->insert([
                'title' => $draft['title'],
                'standard' => $draft['standard'],
                'subtitle' => $draft['subtitle'] ?? null,
                'intro' => $draft['intro'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('readiness_master_clauses')->delete();
            foreach ($draft['clauses'] ?? [] as $index => $clause) {
                DB::table('readiness_master_clauses')->insert([
                    'item_id' => (string) $clause['id'],
                    'code' => $clause['code'],
                    'title' => $clause['title'],
                    'description' => $clause['description'] ?? null,
                    'always' => (bool) ($clause['always'] ?? false),
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('readiness_master_documents')->delete();
            foreach ($draft['documents'] ?? [] as $index => $doc) {
                DB::table('readiness_master_documents')->insert([
                    'item_id' => (string) $doc['id'],
                    'code' => $doc['code'],
                    'title' => $doc['title'],
                    'sample' => $doc['sample'] ?? null,
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('readiness_master_questions')->delete();
            foreach ($draft['questions'] ?? [] as $index => $question) {
                DB::table('readiness_master_questions')->insert([
                    'item_id' => (string) $question['id'],
                    'clause_id' => (string) $question['clauseId'],
                    'reference' => $question['reference'] ?? null,
                    'text' => $question['text'],
                    'allow_na' => (bool) ($question['allowNA'] ?? false),
                    'document_id' => $question['documentId'] ?? null,
                    'evidence' => $question['evidence'] ?? null,
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('readiness_master_identities')->delete();
            foreach ($draft['identity'] ?? [] as $index => $identity) {
                DB::table('readiness_master_identities')->insert([
                    'item_id' => (string) $identity['id'],
                    'label' => $identity['label'],
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('readiness_master_glossaries')->delete();
            foreach ($draft['glossary'] ?? [] as $index => $glossary) {
                DB::table('readiness_master_glossaries')->insert([
                    'item_id' => (string) $glossary['id'],
                    'term' => $glossary['term'],
                    'definition' => $glossary['definition'],
                    'note' => $glossary['note'] ?? null,
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });
    }
}
