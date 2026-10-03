<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discussions', function (Blueprint $table) {
            // Hapus foreign key & kolom module_id
            $table->dropForeign(['module_id']);
            $table->dropColumn('module_id');
            // Tambah lesson_id nullable dulu (ada data lama)
            $table->foreignId('lesson_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discussions', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropColumn('lesson_id');
            $table->foreignId('module_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });
    }
};
