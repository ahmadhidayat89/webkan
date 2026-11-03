<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_user_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('extra_attempts')->default(0);
            $table->dateTime('open_until')->nullable();
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->unique(['quiz_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_user_overrides');
    }
};
