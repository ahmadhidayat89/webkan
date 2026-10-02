<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel pelajaran (sub-item) dalam modul.
     * Tipe: video, pdf, quiz
     */
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title');           // mis: "Video: Pengantar", "PDF: Dokumentasi"
            $table->string('type');             // video, pdf, quiz
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();     // path ke file video/pdf
            $table->string('video_url')->nullable();     // URL video eksternal (YouTube, dll)
            $table->integer('duration_minutes')->nullable(); // durasi dalam menit
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->boolean('is_preview')->default(false); // bisa dilihat tanpa enroll
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
