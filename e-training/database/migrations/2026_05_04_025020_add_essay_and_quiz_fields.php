<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah kolom jawaban essay dan penilaian manual ke tabel quiz_attempt_answers
        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            $table->text('essay_answer')->nullable()->after('is_correct');        // jawaban essay pelajar
            $table->integer('manual_score')->nullable()->after('essay_answer');  // nilai manual admin (0-100)
            $table->text('admin_feedback')->nullable()->after('manual_score');   // komentar koreksi admin
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            $table->dropColumn(['essay_answer', 'manual_score', 'admin_feedback']);
        });
    }
};
