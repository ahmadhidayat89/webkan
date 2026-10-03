<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah deadline ke tabel quizzes
        Schema::table('quizzes', function (Blueprint $table) {
            $table->timestamp('deadline_at')->nullable()->after('show_correct_answers');
            $table->string('quiz_mode')->default('custom')->after('deadline_at'); // multiple_choice, essay, custom
        });

        // Tambah image_path ke quiz_questions (soal bisa punya gambar)
        // type sudah ada: multiple_choice → tambah 'essay'
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('explanation');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['deadline_at', 'quiz_mode']);
        });
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
