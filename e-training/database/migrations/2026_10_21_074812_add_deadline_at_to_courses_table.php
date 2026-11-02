<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('courses', 'deadline_at')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->timestamp('deadline_at')->nullable()->after('published_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('courses', 'deadline_at')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropColumn('deadline_at');
            });
        }
    }
};