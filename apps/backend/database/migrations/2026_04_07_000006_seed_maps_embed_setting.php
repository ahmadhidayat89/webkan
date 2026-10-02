<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => 'maps_embed'],
            [
                'key'        => 'maps_embed',
                'value_id'   => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6664849803897!2d106.82288931476895!3d-6.176104995527208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f42b33e1b4c3%3A0x7a6e6f7a6f7a6f7a!2sGedung%20BPPT%20I!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid',
                'type'       => 'textarea',
                'group'      => 'contact',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'maps_embed')->delete();
    }
};
