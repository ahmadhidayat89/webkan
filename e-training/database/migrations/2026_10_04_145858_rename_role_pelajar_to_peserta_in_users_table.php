<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'pelajar')->update(['role' => 'peserta']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('peserta')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('pelajar')->change();
        });

        DB::table('users')->where('role', 'peserta')->update(['role' => 'pelajar']);
    }
};