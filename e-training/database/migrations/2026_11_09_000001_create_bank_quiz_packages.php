<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_quiz_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_quiz_id')->nullable()->constrained('quizzes')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('snapshot');
            $table->unsignedInteger('questions_count');
            $table->unsignedInteger('effective_questions_count');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('bank_quiz_package_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', fn (Blueprint $table) => $table->dropConstrainedForeignId('bank_quiz_package_id'));
        Schema::dropIfExists('bank_quiz_packages');
    }
};
