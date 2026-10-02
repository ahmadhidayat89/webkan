<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class MailSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key'      => 'mail_username',
                'value_id' => '',
                'group'    => 'mail',
                'type'     => 'text',
            ],
            [
                'key'      => 'mail_password',
                'value_id' => '',
                'group'    => 'mail',
                'type'     => 'text',
            ],
            [
                'key'      => 'mail_from_name',
                'value_id' => 'Komite Akreditasi Nasional',
                'group'    => 'mail',
                'type'     => 'text',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
