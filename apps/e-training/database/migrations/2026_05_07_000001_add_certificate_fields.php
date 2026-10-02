<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah verification_code ke certificates
        Schema::table('certificates', function (Blueprint $table) {
            $table->uuid('verification_code')->unique()->nullable()->after('certificate_number');
            $table->string('template_path')->nullable()->after('file_path');
        });

        // Tambah certificate_template ke courses
        Schema::table('courses', function (Blueprint $table) {
            $table->string('certificate_template')->nullable()->after('referral_code');
            $table->string('certificate_signature')->nullable()->after('certificate_template');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['verification_code', 'template_path']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['certificate_template', 'certificate_signature']);
        });
    }
};
