<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tiga tabel lama berisi data tes saja, diganti satu tabel ini
        Schema::dropIfExists('lpk_revoked');
        Schema::dropIfExists('lpk_suspended');
        Schema::dropIfExists('lpk_accredited');

        Schema::create('lpks', function (Blueprint $t) {
            $t->id();
            $t->string('type', 191)->index();                   // tipe LPK (dipilih saat import)
            $t->string('certificate_number', 100)->unique();    // No. Akreditasi
            $t->string('name');                                 // Nama LPK
            $t->text('address')->nullable();
            $t->string('phone', 255)->nullable();               // Telepon/Fax
            $t->text('email')->nullable();
            $t->text('scope')->nullable();                      // Lingkup
            $t->date('expiry_date')->nullable();                // Masa berlaku (expired)
            $t->string('certificate_link', 500)->nullable();

            $t->string('status', 20)->default('active')->index(); // active | suspended | revoked
            $t->string('suspension_scope', 10)->nullable();       // full | partial (khusus suspended)
            $t->text('suspension_status')->nullable();            // teks status pembekuan / daftar RL yang dibekukan
            $t->date('suspended_at')->nullable();                 // Tanggal dibekukan
            $t->date('revoked_at')->nullable();                   // Tanggal dicabut

            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpks');
    }
};