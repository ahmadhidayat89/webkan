<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;

class CourseSeeder extends Seeder
{
    /**
     * Seed data kursus demo KAN.
     */
    public function run(): void
    {
        $courses = [
            [
                'instructor_id' => 1, // Dr. Ahmad Ridwan
                'category_id' => 1,   // Laboratorium
                'title' => 'SNI ISO/IEC 17025:2017 — Persyaratan Umum Kompetensi Laboratorium',
                'slug' => 'sni-iso-17025',
                'description' => 'Pelatihan komprehensif tentang persyaratan umum kompetensi laboratorium pengujian dan kalibrasi berdasarkan standar SNI ISO/IEC 17025:2017.',
                'short_description' => 'Kompetensi laboratorium pengujian dan kalibrasi',
                'level' => 'menengah',
                'duration_hours' => 24,
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'instructor_id' => 1,
                'category_id' => 2, // Sertifikasi
                'title' => 'SNI ISO/IEC 17021-1:2015 — Audit Lembaga Sertifikasi',
                'slug' => 'sni-iso-17021',
                'description' => 'Memahami persyaratan lembaga sertifikasi yang melakukan audit dan sertifikasi sistem manajemen.',
                'short_description' => 'Audit dan sertifikasi sistem manajemen',
                'level' => 'lanjutan',
                'duration_hours' => 32,
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'instructor_id' => 1,
                'category_id' => 2,
                'title' => 'SNI ISO/IEC 17065:2012 — Persyaratan Lembaga Sertifikasi Produk',
                'slug' => 'sni-iso-17065',
                'description' => 'Pelatihan tentang persyaratan lembaga sertifikasi produk, proses, dan jasa.',
                'short_description' => 'Sertifikasi produk, proses, dan jasa',
                'level' => 'menengah',
                'duration_hours' => 20,
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now(),
            ],
            [
                'instructor_id' => 1,
                'category_id' => 4, // Umum
                'title' => 'Pengenalan Standar Nasional Indonesia (SNI)',
                'slug' => 'pengenalan-sni',
                'description' => 'Pelatihan dasar tentang Standar Nasional Indonesia dan perannya dalam perdagangan.',
                'short_description' => 'Dasar-dasar Standar Nasional Indonesia',
                'level' => 'pemula',
                'duration_hours' => 12,
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now(),
            ],
            [
                'instructor_id' => 1,
                'category_id' => 3, // Inspeksi
                'title' => 'SNI ISO/IEC 17020:2012 — Persyaratan Lembaga Inspeksi',
                'slug' => 'sni-iso-17020',
                'description' => 'Pelatihan tentang persyaratan umum untuk operasi berbagai tipe lembaga inspeksi.',
                'short_description' => 'Persyaratan lembaga inspeksi',
                'level' => 'menengah',
                'duration_hours' => 18,
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now(),
            ],
            [
                'instructor_id' => 1,
                'category_id' => 1,
                'title' => 'Manajemen Mutu Laboratorium — Good Laboratory Practice',
                'slug' => 'good-laboratory-practice',
                'description' => 'Pelatihan praktik laboratorium yang baik (GLP) untuk memastikan kualitas data.',
                'short_description' => 'Praktik laboratorium yang baik',
                'level' => 'pemula',
                'duration_hours' => 16,
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now(),
            ],
        ];

        foreach ($courses as $course) {
            Course::create($course);
        }
    }
}
