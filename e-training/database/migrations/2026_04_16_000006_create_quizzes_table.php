<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel kuis, pertanyaan, dan opsi jawaban.
     */
    public function up(): void
    {
        // Tabel kuis - terhubung ke lesson bertipe 'quiz'
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained('lessons')->onDelete('cascade');
            $table->integer('duration_minutes')->nullable(); // batas waktu kuis
            $table->integer('passing_score')->default(70);   // skor minimum lulus (%)
            $table->integer('max_attempts')->default(3);     // maks percobaan
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('show_correct_answers')->default(true); // tampilkan jawaban setelah submit
            $table->timestamps();
        });

        // Tabel pertanyaan kuis
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->text('question');
            $table->string('type')->default('multiple_choice'); // multiple_choice, true_false
            $table->integer('points')->default(1);
            $table->integer('sort_order')->default(0);
            $table->text('explanation')->nullable(); // penjelasan jawaban benar
            $table->timestamps();
        });

        // Tabel opsi jawaban
        Schema::create('quiz_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('quiz_questions')->onDelete('cascade');
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_options');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
    }
};
