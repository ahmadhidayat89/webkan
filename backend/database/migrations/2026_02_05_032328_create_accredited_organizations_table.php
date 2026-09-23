<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accredited_organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type', 100); // laboratorium, lembaga_inspeksi, lembaga_sertifikasi, dll
            $table->string('certificate_number', 100)->unique();
            $table->date('accreditation_date');
            $table->date('expiry_date');
            $table->string('status', 50)->default('active'); // active, expired, suspended
            $table->text('address')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->timestamps();
            
            $table->index(['status']);
            $table->index(['type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accredited_organizations');
    }
};