<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            if (! Schema::hasColumn('faqs', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('answer');
            }

            if (! Schema::hasColumn('faqs', 'show_on_home')) {
                $table->boolean('show_on_home')->default(true)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'show_on_home']);
        });
    }
};