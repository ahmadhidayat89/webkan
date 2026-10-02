<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            // Hero
            ['key' => 'services_hero_desc', 'value_id' => 'KAN menyediakan berbagai layanan akreditasi untuk lembaga penilaian kesesuaian sesuai standar internasional ISO/IEC 17000 series.', 'type' => 'textarea', 'group' => 'services'],

            // Service cards (title + desc)
            ['key' => 'services_card_1_title', 'value_id' => 'Laboratorium',                          'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_1_desc',  'value_id' => 'Akreditasi untuk laboratorium pengujian dan kalibrasi sesuai ISO/IEC 17025.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_2_title', 'value_id' => 'Lembaga Inspeksi',                      'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_2_desc',  'value_id' => 'Akreditasi lembaga inspeksi berdasarkan ISO/IEC 17020.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_3_title', 'value_id' => 'Verifikasi & Validasi GRK',             'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_3_desc',  'value_id' => 'Akreditasi lembaga verifikasi dan validasi gas rumah kaca (ISO 14065).', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_4_title', 'value_id' => 'Penyelenggara Uji Profisiensi',         'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_4_desc',  'value_id' => 'Akreditasi penyelenggara uji profisiensi sesuai ISO/IEC 17043.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_5_title', 'value_id' => 'Produsen Bahan Acuan',                  'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_5_desc',  'value_id' => 'Akreditasi produsen bahan acuan berdasarkan ISO 17034.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_6_title', 'value_id' => 'Sistem Manajemen',                      'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_6_desc',  'value_id' => 'Akreditasi lembaga sertifikasi sistem manajemen (ISO/IEC 17021).', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_7_title', 'value_id' => 'Sertifikasi Person',                    'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_7_desc',  'value_id' => 'Akreditasi lembaga sertifikasi personel sesuai ISO/IEC 17024.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_8_title', 'value_id' => 'Sertifikasi Produk (SNI ISO/IEC 17065)','type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_8_desc',  'value_id' => 'Akreditasi lembaga sertifikasi produk berdasarkan ISO/IEC 17065.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_card_9_title', 'value_id' => 'Sertifikasi Pembangunan Berkelanjutan', 'type' => 'text',     'group' => 'services'],
            ['key' => 'services_card_9_desc',  'value_id' => 'Akreditasi lembaga sertifikasi untuk skema pembangunan berkelanjutan.', 'type' => 'textarea', 'group' => 'services'],

            // Process steps
            ['key' => 'services_step_1_title', 'value_id' => 'Pengajuan',  'type' => 'text',     'group' => 'services'],
            ['key' => 'services_step_1_desc',  'value_id' => 'Mengisi formulir permohonan dan melengkapi dokumen persyaratan akreditasi.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_step_2_title', 'value_id' => 'Evaluasi',   'type' => 'text',     'group' => 'services'],
            ['key' => 'services_step_2_desc',  'value_id' => 'Tinjauan dokumen dan asesmen lapangan oleh asesor KAN yang kompeten.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_step_3_title', 'value_id' => 'Keputusan',  'type' => 'text',     'group' => 'services'],
            ['key' => 'services_step_3_desc',  'value_id' => 'Komite akreditasi melakukan kajian dan membuat keputusan akreditasi.', 'type' => 'textarea', 'group' => 'services'],
            ['key' => 'services_step_4_title', 'value_id' => 'Sertifikat', 'type' => 'text',     'group' => 'services'],
            ['key' => 'services_step_4_desc',  'value_id' => 'Penerbitan sertifikat akreditasi beserta lampiran ruang lingkup.', 'type' => 'textarea', 'group' => 'services'],

            // Benefits
            ['key' => 'services_benefit_1', 'value_id' => 'Pengakuan Internasional',    'type' => 'text', 'group' => 'services'],
            ['key' => 'services_benefit_2', 'value_id' => 'Meningkatkan Kredibilitas',  'type' => 'text', 'group' => 'services'],
            ['key' => 'services_benefit_3', 'value_id' => 'Akses Pasar Global',         'type' => 'text', 'group' => 'services'],
            ['key' => 'services_benefit_4', 'value_id' => 'Peningkatan Kompetensi',     'type' => 'text', 'group' => 'services'],
            ['key' => 'services_benefit_5', 'value_id' => 'Jaminan Kualitas',           'type' => 'text', 'group' => 'services'],
            ['key' => 'services_benefit_6', 'value_id' => 'Kepercayaan Stakeholder',    'type' => 'text', 'group' => 'services'],

            // CTA
            ['key' => 'services_cta_title', 'value_id' => 'Siap Mendapatkan Akreditasi?',                                                          'type' => 'text',     'group' => 'services'],
            ['key' => 'services_cta_desc',  'value_id' => 'Hubungi kami untuk informasi lebih lanjut tentang proses dan persyaratan akreditasi.',  'type' => 'textarea', 'group' => 'services'],
        ];

        foreach ($settings as $s) {
            DB::table('settings')->updateOrInsert(
                ['key' => $s['key']],
                array_merge($s, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('group', 'services')->delete();
    }
};
