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
            $this->replaceMasterData($data, $now);

            if ($old !== null) {
                $this->syncAssessments($old, $this->loadCurrentMaster());
            }
        });
    }

    public function down(): void
    {
        // Irreversible template data update
    }

    private function replaceMasterData(array $data, \DateTimeInterface $now): void
    {
        DB::table('readiness_master_settings')->delete();
        DB::table('readiness_master_settings')->insert([
            'title' => $data['title'] ?? 'SiapKAN — Penilaian Kesiapan Akreditasi LSP',
            'standard' => $data['standard'] ?? 'SNI ISO/IEC 17024:2026',
            'subtitle' => $data['subtitle'] ?? null,
            'intro' => $data['intro'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->replaceRows('readiness_master_clauses', $data['clauses'] ?? [], $now, fn ($clause) => [
            'item_id' => (string) $clause['id'],
            'code' => $clause['code'],
            'title' => $clause['title'],
            'description' => $clause['description'] ?? null,
            'always' => (bool) ($clause['always'] ?? false),
        ]);

        $this->replaceRows('readiness_master_documents', $data['documents'] ?? [], $now, fn ($doc) => [
            'item_id' => (string) $doc['id'],
            'code' => $doc['code'],
            'title' => $doc['title'],
            'sample' => $doc['sample'] ?? null,
        ]);

        $this->replaceRows('readiness_master_questions', $data['questions'] ?? [], $now, fn ($question) => [
            'item_id' => (string) $question['id'],
            'clause_id' => (string) $question['clauseId'],
            'reference' => $question['reference'] ?? null,
            'text' => $question['text'],
            'allow_na' => (bool) ($question['allowNA'] ?? false),
            'document_id' => $question['documentId'] ?? null,
            'evidence' => $question['evidence'] ?? null,
        ]);

        $this->replaceRows('readiness_master_identities', $data['identity'] ?? [], $now, fn ($identity) => [
            'item_id' => (string) $identity['id'],
            'label' => $identity['label'],
        ]);

        $this->replaceRows('readiness_master_glossaries', $data['glossary'] ?? [], $now, fn ($glossary) => [
            'item_id' => (string) $glossary['id'],
            'term' => $glossary['term'],
            'definition' => $glossary['definition'],
            'note' => $glossary['note'] ?? null,
        ]);
    }

    private function replaceRows(string $table, array $items, \DateTimeInterface $now, callable $mapper): void
    {
        DB::table($table)->delete();

        foreach ($items as $index => $item) {
            DB::table($table)->insert($mapper($item) + [
                'sort_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function syncAssessments(array $old, array $new): void
    {
        ReadinessAssessment::query()->lockForUpdate()->get()
            ->each(function (ReadinessAssessment $assessment) use ($old, $new) {
                $changes = $this->syncedChanges($old, $new, $assessment);

                if ($changes !== []) {
                    $assessment->update($changes);
                }
            });
    }

    private function syncedChanges(array $old, array $new, ReadinessAssessment $assessment): array
    {
        $changes = [];

        foreach (['draft', 'published'] as $field) {
            $current = $assessment->{$field};
            if ($current === null) {
                continue;
            }

            $updated = ReadinessMasterSync::apply($old, $new, $current);
            if ($updated != $current) {
                $changes[$field] = $updated;
            }
        }

        return $changes;
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
