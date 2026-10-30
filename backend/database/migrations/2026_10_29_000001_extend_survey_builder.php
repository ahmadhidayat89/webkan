<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->json('settings')->nullable();
        });
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->json('config')->nullable();
        });
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->string('respondent_email')->nullable();
            $table->string('edit_token', 64)->nullable()->unique();
            $table->string('dedup_key', 64)->nullable();
            $table->unsignedInteger('score')->nullable();
            $table->unsignedInteger('max_score')->nullable();
            $table->unique(['survey_id', 'dedup_key']);
        });
    }

    public function down(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropUnique(['survey_id', 'dedup_key']);
            $table->dropColumn(['respondent_email', 'edit_token', 'dedup_key', 'score', 'max_score']);
        });
        Schema::table('survey_questions', fn (Blueprint $table) => $table->dropColumn('config'));
        Schema::table('surveys', fn (Blueprint $table) => $table->dropColumn('settings'));
    }
};
