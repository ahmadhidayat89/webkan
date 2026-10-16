<?php

namespace Database\Seeders;

use App\Models\Document;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Dokumen Akreditasi',
            'Materi Kegiatan',
            'Artikel Penilaian Kesesuaian',
            'Dokumen Internasional',
        ];

        foreach ($categories as $index => $name) {
            Document::firstOrCreate(
                [
                    'name' => $name,
                    'parent_id' => null,
                ],
                [
                    'slug' => Str::slug($name),
                    'description' => null,
                    'type' => 'category',
                    'file_type' => null,
                    'language' => null,
                    'link' => null,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }
}
