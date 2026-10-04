<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => 'contact_inbox_email'],
            [
                'value_id' => env('MAIL_TO_ADDRESS', 'info@kan.go.id'),
                'value_en' => env('MAIL_TO_ADDRESS', 'info@kan.go.id'),
                'type' => 'text',
                'group' => 'contact',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'contact_inbox_email')->delete();
    }
};
