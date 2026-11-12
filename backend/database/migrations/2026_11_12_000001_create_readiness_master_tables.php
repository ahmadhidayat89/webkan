<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readiness_master_settings', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('standard', 120);
            $table->string('subtitle', 250)->nullable();
            $table->text('intro')->nullable();
            $table->timestamps();
        });

        Schema::create('readiness_master_clauses', function (Blueprint $table) {
            $table->id();
            $table->string('item_id', 64)->unique();
            $table->string('code', 40);
            $table->string('title', 200);
            $table->string('description', 600)->nullable();
            $table->boolean('always')->default(false);
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('readiness_master_documents', function (Blueprint $table) {
            $table->id();
            $table->string('item_id', 64)->unique();
            $table->string('code', 40);
            $table->string('title', 350);
            $table->string('sample', 250)->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('readiness_master_questions', function (Blueprint $table) {
            $table->id();
            $table->string('item_id', 64)->unique();
            $table->string('clause_id', 64)->index();
            $table->string('reference', 120)->nullable();
            $table->text('text');
            $table->boolean('allow_na')->default(false);
            $table->string('document_id', 64)->nullable();
            $table->string('evidence', 40)->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('readiness_master_identities', function (Blueprint $table) {
            $table->id();
            $table->string('item_id', 64)->unique();
            $table->string('label', 250);
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        Schema::create('readiness_master_glossaries', function (Blueprint $table) {
            $table->id();
            $table->string('item_id', 64)->unique();
            $table->string('term', 250);
            $table->text('definition');
            $table->text('note')->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });

        $path = resource_path('readiness/lsp-17024.json');
        if (is_file($path)) {
            $data = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $now = now();

            DB::table('readiness_master_settings')->insert([
                'title' => $data['title'] ?? 'Readiness Assessment LSP',
                'standard' => $data['standard'] ?? 'ISO/IEC 17024:2026',
                'subtitle' => $data['subtitle'] ?? null,
                'intro' => $data['intro'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

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

            foreach ($data['identity'] ?? [] as $index => $identity) {
                DB::table('readiness_master_identities')->insert([
                    'item_id' => (string) $identity['id'],
                    'label' => $identity['label'],
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

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
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_master_glossaries');
        Schema::dropIfExists('readiness_master_identities');
        Schema::dropIfExists('readiness_master_questions');
        Schema::dropIfExists('readiness_master_documents');
        Schema::dropIfExists('readiness_master_clauses');
        Schema::dropIfExists('readiness_master_settings');
    }
};
