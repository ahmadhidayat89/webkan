<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Seed data kategori pelatihan KAN.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Laboratorium',
                'slug' => 'laboratorium',
                'description' => 'Pelatihan terkait akreditasi laboratorium pengujian dan kalibrasi',
                'icon' => 'flask-conical',
                'sort_order' => 1,
            ],
            [
                'name' => 'Lembaga Sertifikasi',
                'slug' => 'sertifikasi',
                'description' => 'Pelatihan terkait akreditasi lembaga sertifikasi',
                'icon' => 'award',
                'sort_order' => 2,
            ],
            [
                'name' => 'Lembaga Inspeksi',
                'slug' => 'inspeksi',
                'description' => 'Pelatihan terkait akreditasi lembaga inspeksi',
                'icon' => 'search',
                'sort_order' => 3,
            ],
            [
                'name' => 'Umum',
                'slug' => 'umum',
                'description' => 'Pelatihan umum tentang standar nasional dan internasional',
                'icon' => 'book-open',
                'sort_order' => 4,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
