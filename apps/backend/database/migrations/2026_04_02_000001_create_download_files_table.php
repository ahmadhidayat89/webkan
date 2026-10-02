<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('download_files', function (Blueprint $table) {
            $table->id();
            $table->string('page_id');          // e.g. unduh/dokumen-akreditasi
            $table->string('title');            // nama tampil file
            $table->string('file_path');        // path di storage/public
            $table->unsignedBigInteger('file_size')->default(0); // bytes
            $table->string('file_ext', 10)->nullable(); // pdf, docx, xlsx, dll
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('page_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('download_files');
    }
};
