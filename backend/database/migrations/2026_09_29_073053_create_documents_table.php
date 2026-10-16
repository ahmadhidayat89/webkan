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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            // Parent untuk struktur kategori/subkategori/dokumen
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('documents')
                ->nullOnDelete();

            // Nama kategori, subkategori, atau dokumen
            $table->string('name');

            // Slug untuk URL
            $table->string('slug')->nullable();

            // Deskripsi kategori atau dokumen
            $table->text('description')->nullable();

            // category = kategori/subkategori
            // document = dokumen
            $table->enum('type', ['category', 'document'])
                ->default('category');

            // Contoh: PDF, DOCX, XLSX
            $table->string('file_type')->nullable();

            // Contoh: Bahasa Indonesia, English
            $table->string('language')->nullable();

            // Link dokumen yang nanti diinput admin
            $table->text('link')->nullable();

            // Urutan tampil
            $table->integer('sort_order')->default(0);

            // Status tampil/tidak tampil
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Index
            $table->index('parent_id');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
