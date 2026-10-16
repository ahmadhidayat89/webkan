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
         Schema::table('certificates', function (Blueprint $table) {
        $table->string('recipient_name')->nullable();
        $table->string('status')->default('lulus');
        $table->text('event_text')->nullable();
        $table->string('signer_name')->nullable();
        $table->string('signer_title')->nullable();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
        $table->dropColumn(['recipient_name', 'status', 'event_text', 'signer_name', 'signer_title']);
    });
    }
};
