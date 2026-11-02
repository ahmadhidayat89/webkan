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