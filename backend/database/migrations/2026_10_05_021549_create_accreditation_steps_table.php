<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accreditation_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->string('icon', 20);
            $table->string('title');
            $table->string('tag', 100);
            $table->text('description');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accreditation_steps');
    }
};