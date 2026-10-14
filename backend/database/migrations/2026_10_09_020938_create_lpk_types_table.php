<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const KONSTRUKSI_PERSON_TYPE = 'Lembaga Sertifikasi Person Sektor dan Jasa Konstruksi';

    private array $types = [
        'Laboratorium Pengujian',
        'Laboratorium Kalibrasi',
        'Laboratorium Medis',
        'Lembaga Inspeksi',
        'Lembaga Sertifikasi Produk',
        'Lembaga Sertifikasi Person',
        self::KONSTRUKSI_PERSON_TYPE,
        'Lembaga Sertifikasi Sistem Mutu',
        'Lembaga Sertifikasi Berdasarkan SNI ISO/IEC 17065',
        'Lembaga Sertifikasi Badan Usaha Jasa Konstruksi',
        'Lembaga Sertifikasi Sistem Manajemen',
        'Penyelenggara Uji Profisiensi',
        'Produsen Bahan Acuan',
        'Lembaga Verifikasi dan Validasi',
        'Lembaga Sertifikasi Indonesian Sustainable Palm Oil (ISPO)',
        'Lembaga Sertifikasi Umrah dan Haji Khusus',
        'Lembaga Penilai dan Verifikasi Independen',
    ];

    // nama lama => nama baru (untuk data LPK yang sudah tersimpan)
    private array $renames = [
        'Lembaga Sertifikasi Personel' => 'Lembaga Sertifikasi Person',
        'Lembaga Sertifikasi Person Sektor dan Jasa' => self::KONSTRUKSI_PERSON_TYPE,
        'Lembaga Sertifikasi Person Jasa Konstruksi' => self::KONSTRUKSI_PERSON_TYPE,
        'Lembaga Verifikasi & Validasi GRK' => 'Lembaga Verifikasi dan Validasi',
    ];

    public function up(): void
    {
        Schema::create('lpk_types', function (Blueprint $t) {
            $t->id();
            $t->string('name', 191)->unique();
            $t->unsignedInteger('sort_order')->default(0);
            $t->timestamps();
        });

        $now = now();
        foreach ($this->types as $i => $name) {
            DB::table('lpk_types')->insert([
                'name' => $name,
                'sort_order' => $i + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Samakan data LPK yang sudah ada dengan nama baru
        foreach ($this->renames as $old => $new) {
            DB::table('lpks')->where('type', $old)->update(['type' => $new]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lpk_types');
    }
};