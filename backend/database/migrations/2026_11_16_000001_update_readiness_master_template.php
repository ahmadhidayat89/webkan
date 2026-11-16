<?php

use App\Models\ReadinessAssessment;
use App\Services\ReadinessMasterSync;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $path = resource_path('readiness/lsp-17024.json');
        if (! is_file($path)) {
            return;
        }

        $data = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        $old = $this->loadCurrentMaster();
        $now = now();

        DB::transaction(function () use ($data, $old, $now) {
            DB::table('readiness_master_settings')->delete();
            DB::table('readiness_master_settings')->insert([
                'title' => $data['title'] ?? 'SiapKAN — Penilaian Kesiapan Akreditasi LSP',
                'standard' => $data['standard'] ?? 'SNI ISO/IEC 17024:2026',
                'subtitle' => $data['subtitle'] ?? null,
                'intro' => $data['intro'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('readiness_master_clauses')->delete();
            foreach ($data['clauses'] ?? [] as $index => $clause) {
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
            foreach ($data['documents'] ?? [] as $index => $doc) {
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
            foreach ($data['questions'] ?? [] as $index => $question) {
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
            foreach ($data['identity'] ?? [] as $index => $identity) {
                DB::table('readiness_master_identities')->insert([
                    'item_id' => (string) $identity['id'],
                    'label' => $identity['label'],
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('readiness_master_glossaries')->delete();
            foreach ($data['glossary'] ?? [] as $index => $glossary) {
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

            if ($old !== null) {
                $new = $this->loadCurrentMaster();
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
            }
        });
    }

    public function down(): void
    {
        // Irreversible template data update
    }

    private function loadCurrentMaster(): ?array
    {
        $settings = DB::table('readiness_master_settings')->first();
        if (! $settings) {
            return null;
        }

        return [
            'title' => $settings->title,
            'standard' => $settings->standard,
            'subtitle' => $settings->subtitle,
            'intro' => $settings->intro,
            'clauses' => DB::table('readiness_master_clauses')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
                'id' => (string) $r->item_id,
                'code' => $r->code,
                'title' => $r->title,
                'description' => $r->description,
                'always' => (bool) $r->always,
            ])->values()->all(),
            'documents' => DB::table('readiness_master_documents')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
                'id' => (string) $r->item_id,
                'code' => $r->code,
                'title' => $r->title,
                'sample' => $r->sample,
            ])->values()->all(),
            'questions' => DB::table('readiness_master_questions')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
                'id' => (string) $r->item_id,
                'clauseId' => (string) $r->clause_id,
                'reference' => $r->reference,
                'text' => $r->text,
                'allowNA' => (bool) $r->allow_na,
                'documentId' => $r->document_id !== null ? (string) $r->document_id : null,
                'evidence' => $r->evidence,
            ])->values()->all(),
            'identity' => DB::table('readiness_master_identities')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
                'id' => (string) $r->item_id,
                'label' => $r->label,
            ])->values()->all(),
            'glossary' => DB::table('readiness_master_glossaries')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
                'id' => (string) $r->item_id,
                'term' => $r->term,
                'definition' => $r->definition,
                'note' => $r->note,
            ])->values()->all(),
        ];
    }
};
