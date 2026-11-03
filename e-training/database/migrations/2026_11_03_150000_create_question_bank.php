<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_bank_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('question_bank_categories')->nullOnDelete();
            $table->string('name');
            $table->timestamps();
        });
        Schema::create('bank_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('question_bank_categories')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->string('title');
            $table->text('question');
            $table->string('type');
            $table->unsignedInteger('points')->default(1);
            $table->string('status')->default('draft');
            $table->json('tags')->nullable();
            $table->json('options')->nullable();
            $table->text('explanation')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->index(['course_id', 'status']);
        });
        Schema::create('bank_question_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_question_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('snapshot');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->unique(['bank_question_id', 'version']);
        });
        Schema::create('quiz_random_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->unsignedInteger('draw_count');
            $table->timestamps();
        });
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->foreignId('bank_question_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('bank_version')->nullable();
            $table->foreignId('random_group_id')->nullable()->constrained('quiz_random_groups')->nullOnDelete();
        });
        Schema::create('quiz_bank_draws', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->json('question_ids');
            $table->timestamps();
            $table->unique(['quiz_id', 'user_id', 'attempt_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_bank_draws');
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bank_question_id');
            $table->dropConstrainedForeignId('random_group_id');
            $table->dropColumn('bank_version');
        });
        Schema::dropIfExists('quiz_random_groups');
        Schema::dropIfExists('bank_question_versions');
        Schema::dropIfExists('bank_questions');
        Schema::dropIfExists('question_bank_categories');
    }
};
