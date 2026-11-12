<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveReadinessAssessment;
use App\Models\ReadinessAssessment;
use App\Services\ReadinessMasterSync;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReadinessAssessmentController extends Controller
{
    public function index()
    {
        $assessments = ReadinessAssessment::query()->latest('id')->get()->map(fn ($assessment) => [
            'id' => $assessment->id,
            'title' => $assessment->draft['title'],
            'standard' => $assessment->draft['standard'],
            'subtitle' => $assessment->draft['subtitle'],
            'question_count' => count($assessment->draft['questions']),
            'clause_count' => count($assessment->draft['clauses']),
            'published_at' => $assessment->published_at,
        ]);

        return response()->json(['data' => $assessments]);
    }

    public function template()
    {
        $settings = DB::table('readiness_master_settings')->first();

        if (! $settings) {
            $path = resource_path('readiness/lsp-17024.json');
            $default = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $this->saveMasterData($default);
        }

        return response()->json(['data' => $this->loadMasterData()]);
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

    private function editorData(ReadinessAssessment $assessment): array
    {
        return $assessment->only('id', 'draft', 'published_at', 'updated_at');
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
            'title' => $settings->title ?? 'Readiness Assessment LSP',
            'standard' => $settings->standard ?? 'ISO/IEC 17024:2026',
            'subtitle' => $settings->subtitle ?? null,
            'intro' => $settings->intro ?? null,
            'clauses' => $clauses,
            'questions' => $questions,
            'identity' => $identity,
            'documents' => $documents,
            'glossary' => $glossary,
        ];
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
