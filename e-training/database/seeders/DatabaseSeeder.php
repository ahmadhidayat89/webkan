<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Buat akun Admin (ID: 1) — pengelola platform dan pembuat kursus
        User::factory()->create([
            'name' => 'Admin KAN',
            'username' => 'admin',
            'email' => 'admin@kan.or.id',
            'role' => 'admin',
            'organization' => 'Komite Akreditasi Nasional',
        ]);

        // Buat beberapa akun Peserta demo
        User::factory()->create([
            'name' => 'Siti Nurhaliza',
            'username' => 'pelajar',
            'email' => 'pelajar@kan.or.id',
            'role' => 'peserta',
            'organization' => 'PT Laboratorium Nusantara',
        ]);

        User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'role' => 'peserta',
            'organization' => 'CV Inspeksi Mandiri',
        ]);

        User::factory()->create([
            'name' => 'Dewi Kartini',
            'email' => 'dewi@example.com',
            'role' => 'peserta',
            'organization' => 'PT Sertifikasi Indonesia',
        ]);

        // Seed kategori, kursus, dan event
        $this->call([
            CategorySeeder::class,
            CourseSeeder::class,
            CourseEventSeeder::class,
        ]);
    }
}
