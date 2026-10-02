<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            ['key' => 'contact_phone',      'value_id' => '081388636959',          'type' => 'text', 'group' => 'contact'],
            ['key' => 'contact_email',      'value_id' => 'laboratorium@bsn.go.id','type' => 'text', 'group' => 'contact'],
            ['key' => 'whatsapp_number',    'value_id' => '081388636959',          'type' => 'text', 'group' => 'contact'],
            ['key' => 'social_facebook',    'value_id' => 'https://facebook.com',             'type' => 'text', 'group' => 'contact'],
            ['key' => 'social_twitter',     'value_id' => 'https://twitter.com',            'type' => 'text', 'group' => 'contact'],
            ['key' => 'social_instagram',   'value_id' => 'https://instagram.com/kan_akreditasi', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'social_youtube',     'value_id' => 'https://youtube.com',            'type' => 'text', 'group' => 'contact'],
        ];

        foreach ($defaults as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'contact_phone', 'contact_email', 'whatsapp_number',
            'social_facebook', 'social_twitter', 'social_instagram', 'social_youtube',
        ])->delete();
    }
};
