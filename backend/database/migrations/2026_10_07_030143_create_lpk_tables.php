<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpk_accredited', function (Blueprint $t) {
            $t->id();
            $t->string('type', 191)->index();
            $t->string('certificate_number', 100)->unique();
            $t->string('name');
            $t->text('address')->nullable();
            $t->string('phone', 255)->nullable();
            $t->text('email')->nullable();
            $t->text('scope')->nullable();
            $t->date('expiry_date')->nullable();
            $t->string('certificate_link', 500)->nullable();
            $t->timestamps();
        });

        Schema::create('lpk_suspended', function (Blueprint $t) {
            $t->id();
            $t->string('type', 191)->index();
            $t->string('certificate_number', 100)->unique();
            $t->string('name');
            $t->text('suspension_status')->nullable();
            $t->date('suspended_at')->nullable();
            $t->timestamps();
        });

        Schema::create('lpk_revoked', function (Blueprint $t) {
            $t->id();
            $t->string('type', 191)->index();
            $t->string('certificate_number', 100)->unique();
            $t->string('name');
            $t->date('revoked_at')->nullable();
            $t->timestamps();
        });

        // Salin data lama (tabel lama TIDAK dihapus, jadi aman kalau ada fitur lain yang masih memakainya).
        if (Schema::hasTable('accredited_organizations')) {
            $now = now();
            DB::table('accredited_organizations')->orderBy('id')->chunk(200, function ($rows) use ($now) {
                foreach ($rows as $r) {
                    $base = [
                        'type' => $r->type,
                        'certificate_number' => $r->certificate_number,
                        'name' => $r->name,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    if ($r->status === 'active') {
                        DB::table('lpk_accredited')->insertOrIgnore($base + [
                            'address' => $r->address,
                            'phone' => $r->phone,
                            'email' => $r->email,
                            'expiry_date' => $r->expiry_date,
                            'certificate_link' => $r->certificate_link,
                        ]);
                    } elseif ($r->status === 'suspended') {
                        DB::table('lpk_suspended')->insertOrIgnore($base);
                    } else {
                        DB::table('lpk_revoked')->insertOrIgnore($base);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lpk_revoked');
        Schema::dropIfExists('lpk_suspended');
        Schema::dropIfExists('lpk_accredited');
    }
};