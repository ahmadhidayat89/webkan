<?php

namespace App\Services;

use App\Models\ReadinessAssessment;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReadinessMasterData
{
    public function ensureDefaultTemplateSynced(): void
    {
        $this->ensureResponsesTableExists();
        $this->ensureMasterColumnsExist();

        $settings = DB::table('readiness_master_settings')->first();

        if (! $settings) {
            $this->saveMasterData($this->defaultTemplate());
        } elseif (
            DB::table('readiness_master_clauses')->where('item_id', 'KAN')->exists()
            || ($settings->messages ?? null) === null
        ) {
            $this->syncDefaultTemplate($this->defaultTemplate());
        }
    }

    /**
     * Simpan data master baru dan terapkan ke form yang belum terbit.
     *
     * @return int jumlah form yang ikut diperbarui
     */
    public function updateFromDraft(array $draft): int
    {
        $this->ensureMasterColumnsExist();
        $synced = 0;

        DB::transaction(function () use ($draft, &$synced) {
            $old = $this->load();
            $this->saveMasterData($draft);
            $new = $this->load();

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

        return $synced;
    }

    public function load(): array
    {
        $this->ensureMasterColumnsExist();
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
                'optHint' => $row->opt_hint ?? null,
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
                'placeholder' => $row->placeholder ?? null,
                'hint' => $row->hint ?? null,
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

        $messages = isset($settings->messages) && $settings->messages !== null
            ? json_decode($settings->messages, true)
            : ($this->defaultTemplate()['messages'] ?? null);

        return [
            'title' => $settings->title ?? 'SiapKAN — Penilaian Kesiapan Akreditasi LSP',
            'standard' => $settings->standard ?? 'SNI ISO/IEC 17024:2026',
            'subtitle' => $settings->subtitle ?? null,
            'intro' => $settings->intro ?? null,
            'messages' => $messages,
            'clauses' => $clauses,
            'questions' => $questions,
            'identity' => $identity,
            'documents' => $documents,
            'glossary' => $glossary,
        ];
    }

    private function defaultTemplate(): array
    {
        $path = resource_path('readiness/lsp-17024.json');

        return json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    }

    private function syncDefaultTemplate(array $default): void
    {
        DB::transaction(function () use ($default) {
            $old = $this->load();
            $this->saveMasterData($default);
            $new = $this->load();

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
                'messages' => isset($draft['messages']) ? json_encode($draft['messages']) : null,
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
                    'opt_hint' => $question['optHint'] ?? null,
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
                    'placeholder' => $identity['placeholder'] ?? null,
                    'hint' => $identity['hint'] ?? null,
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

    private function ensureMasterColumnsExist(): void
    {
        if (Schema::hasTable('readiness_master_settings') && ! Schema::hasColumn('readiness_master_settings', 'messages')) {
            Schema::table('readiness_master_settings', function (Blueprint $table) {
                $table->json('messages')->nullable()->after('intro');
            });
        }

        if (Schema::hasTable('readiness_master_questions') && ! Schema::hasColumn('readiness_master_questions', 'opt_hint')) {
            Schema::table('readiness_master_questions', function (Blueprint $table) {
                $table->text('opt_hint')->nullable()->after('allow_na');
            });
        }

        if (Schema::hasTable('readiness_master_identities') && ! Schema::hasColumn('readiness_master_identities', 'placeholder')) {
            Schema::table('readiness_master_identities', function (Blueprint $table) {
                $table->string('placeholder', 250)->nullable()->after('label');
                $table->string('hint', 600)->nullable()->after('placeholder');
            });
        }
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
}
