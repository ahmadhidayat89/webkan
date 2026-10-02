<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            // Hero
            ['key' => 'about_hero_desc',    'value_id' => 'Lembaga non-struktural yang bertanggung jawab langsung kepada Presiden Republik Indonesia dalam bidang akreditasi.', 'type' => 'textarea', 'group' => 'about'],

            // Stats
            ['key' => 'about_stat_1_value', 'value_id' => '1997',  'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_1_label', 'value_id' => 'Tahun Berdiri', 'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_2_value', 'value_id' => '500+',  'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_2_label', 'value_id' => 'LPK Terakreditasi', 'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_3_value', 'value_id' => '10+',   'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_3_label', 'value_id' => 'Pengakuan Internasional', 'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_4_value', 'value_id' => '25+',   'type' => 'text', 'group' => 'about'],
            ['key' => 'about_stat_4_label', 'value_id' => 'Tahun Pengalaman', 'type' => 'text', 'group' => 'about'],

            // Core values
            ['key' => 'about_value_1_label', 'value_id' => 'Integritas',       'type' => 'text',     'group' => 'about'],
            ['key' => 'about_value_1_desc',  'value_id' => 'Menjunjung tinggi kejujuran dan transparansi dalam setiap tindakan', 'type' => 'textarea', 'group' => 'about'],
            ['key' => 'about_value_2_label', 'value_id' => 'Profesionalisme',  'type' => 'text',     'group' => 'about'],
            ['key' => 'about_value_2_desc',  'value_id' => 'Berkomitmen pada standar kompetensi tertinggi', 'type' => 'textarea', 'group' => 'about'],
            ['key' => 'about_value_3_label', 'value_id' => 'Kolaborasi',       'type' => 'text',     'group' => 'about'],
            ['key' => 'about_value_3_desc',  'value_id' => 'Bekerja sama untuk kemajuan akreditasi nasional', 'type' => 'textarea', 'group' => 'about'],
            ['key' => 'about_value_4_label', 'value_id' => 'Internasional',    'type' => 'text',     'group' => 'about'],
            ['key' => 'about_value_4_desc',  'value_id' => 'Diakui dan dipercaya di tingkat global', 'type' => 'textarea', 'group' => 'about'],
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
        $keys = [
            'about_hero_desc',
            'about_stat_1_value','about_stat_1_label','about_stat_2_value','about_stat_2_label',
            'about_stat_3_value','about_stat_3_label','about_stat_4_value','about_stat_4_label',
            'about_value_1_label','about_value_1_desc','about_value_2_label','about_value_2_desc',
            'about_value_3_label','about_value_3_desc','about_value_4_label','about_value_4_desc',
        ];
        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};
