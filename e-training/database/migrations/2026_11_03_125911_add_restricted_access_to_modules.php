<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->boolean('is_restricted')->default(false);
        });

        Schema::create('module_user_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['module_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_user_access');
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn('is_restricted');
        });
    }
};
