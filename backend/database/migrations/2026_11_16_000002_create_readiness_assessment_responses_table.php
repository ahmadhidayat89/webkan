<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('readiness_assessment_responses')) {
            return;
        }

        Schema::create('readiness_assessment_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('readiness_assessment_id')
                ->constrained('readiness_assessments')
                ->cascadeOnDelete();
            $table->string('submission_token', 64)->nullable()->unique();
            $table->string('scope', 250)->nullable();
            $table->json('selected_clauses')->nullable();
            $table->json('identity')->nullable();
            $table->json('responses')->nullable();
            $table->string('status', 80)->default('Belum');
            $table->unsignedSmallInteger('percentage')->default(0);
            $table->unsignedSmallInteger('yes_count')->default(0);
            $table->unsignedSmallInteger('partial_count')->default(0);
            $table->unsignedSmallInteger('no_count')->default(0);
            $table->unsignedSmallInteger('na_count')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['readiness_assessment_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readiness_assessment_responses');
    }
};
