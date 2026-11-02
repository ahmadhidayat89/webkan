<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // Kuis bisa dimulai mulai waktu ini (kosong = langsung dibuka)
            $table->timestamp('start_at')->nullable()->after('show_correct_answers');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('start_at');
        });
    }
};