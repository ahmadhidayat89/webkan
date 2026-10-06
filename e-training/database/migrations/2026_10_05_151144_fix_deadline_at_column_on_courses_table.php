<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('courses', 'deadline_at')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dateTime('deadline_at')->nullable();
            });
        } else {
            // Kosongkan deadline yang terisi otomatis/salah
            DB::table('courses')->update(['deadline_at' => null]);
        }
    }

    public function down(): void
    {
        // tidak perlu dikembalikan
    }
};
