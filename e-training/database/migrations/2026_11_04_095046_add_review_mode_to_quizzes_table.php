<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // off = hanya nilai | review = jawaban sendiri + komentar | with_answers = + kunci jawaban
            $table->string('review_mode')->default('off')->after('show_correct_answers');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('review_mode');
        });
    }
};
