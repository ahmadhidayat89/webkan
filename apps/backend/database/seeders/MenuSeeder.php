<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Hapus data lama
        Menu::query()->delete();

        $structure = [
            ['title_id' => 'Beranda', 'url' => '/', 'order' => 1, 'is_active' => true, 'children' => []],
            [
                'title_id' => 'Tentang KAN', 'url' => '/tentang-kan', 'order' => 2, 'is_active' => true,
                'children' => [
                    ['title_id' => 'Sejarah dan Fungsi KAN', 'url' => '/sejarah-fungsi', 'order' => 1, 'is_active' => true],
                    ['title_id' => 'Struktur Organisasi', 'url' => '/struktur-organisasi', 'order' => 2, 'is_active' => true],
                    ['title_id' => 'Ketidakberpihakan', 'url' => '/ketidakberpihakan', 'order' => 3, 'is_active' => true],
                    ['title_id' => 'Pengakuan Internasional', 'url' => '/pengakuan-internasional', 'order' => 4, 'is_active' => true],
                    ['title_id' => 'Anggota KAN', 'url' => '/anggota-kan', 'order' => 5, 'is_active' => true],
                    ['title_id' => 'Maklumat Layanan', 'url' => '/maklumat-layanan', 'order' => 6, 'is_active' => true],
                    ['title_id' => 'Standar Layanan Akreditasi', 'url' => '/standar-layanan', 'order' => 7, 'is_active' => true],
                ],
            ],
            [
                'title_id' => 'Proses Akreditasi', 'url' => '/proses-akreditasi', 'order' => 3, 'is_active' => true,
                'children' => [
                    ['title_id' => 'Proses Akreditasi', 'url' => '/proses-akreditasi', 'order' => 1, 'is_active' => true],
                    ['title_id' => 'Tarif Akreditasi', 'url' => '/tarif-akreditasi', 'order' => 2, 'is_active' => true],
                    ['title_id' => 'Penanganan Komplain', 'url' => '/penanganan-komplain', 'order' => 3, 'is_active' => true],
                    ['title_id' => 'Penanganan Banding', 'url' => '/penanganan-banding', 'order' => 4, 'is_active' => true],
                    ['title_id' => 'Survey Kepuasan Pelanggan', 'url' => '/survey-kepuasan-pelanggan', 'order' => 5, 'is_active' => true],
                ],
            ],
            [
                'title_id' => 'Layanan Akreditasi', 'url' => '/layanan', 'order' => 4, 'is_active' => true,
                'children' => [
                    ['title_id' => 'Laboratorium', 'url' => '/layanan/laboratorium', 'order' => 1, 'is_active' => true],
                    ['title_id' => 'Lembaga Inspeksi', 'url' => '/layanan/lembaga-inspeksi', 'order' => 2, 'is_active' => true],
                    ['title_id' => 'Lembaga Verifikasi dan/atau Validasi Gas Rumah Kaca', 'url' => '/layanan/lembaga-verifikasi-validasi-grk', 'order' => 3, 'is_active' => true],
                    ['title_id' => 'Penyelenggara Uji Profisiensi', 'url' => '/layanan/penyelenggara-uji-profisiensi', 'order' => 4, 'is_active' => true],
                    ['title_id' => 'Produsen Bahan Acuan', 'url' => '/layanan/produsen-bahan-acuan', 'order' => 5, 'is_active' => true],
                    ['title_id' => 'Sistem Manajemen', 'url' => '/layanan/sistem-manajemen', 'order' => 6, 'is_active' => true],
                    ['title_id' => 'Sertifikasi Person', 'url' => '/layanan/sertifikasi-person', 'order' => 7, 'is_active' => true],
                    ['title_id' => 'Sertifikasi Berdasarkan SNI ISO/IEC 17065', 'url' => '/layanan/sertifikasi-sni-iso-iec-17065', 'order' => 8, 'is_active' => true],
                    ['title_id' => 'Sertifikasi Pembangunan Berkelanjutan', 'url' => '/layanan/sertifikasi-pembangunan-berkelanjutan', 'order' => 9, 'is_active' => true],
                ],
            ],
            [
                'title_id' => 'Direktori LPK', 'url' => '/direktori', 'order' => 5, 'is_active' => true,
                'children' => [
                    ['title_id' => 'Terakreditasi', 'url' => '/direktori/terakreditasi', 'order' => 1, 'is_active' => true],
                    ['title_id' => 'Akreditasi Dibekukan', 'url' => '/direktori/akreditasi-dibekukan', 'order' => 2, 'is_active' => true],
                    ['title_id' => 'Akreditasi Dicabut', 'url' => '/direktori/akreditasi-dicabut', 'order' => 3, 'is_active' => true],
                ],
            ],
            [
                'title_id' => 'Unduh', 'url' => '/unduh', 'order' => 6, 'is_active' => true,
                'children' => [
                    ['title_id' => 'Dokumen Akreditasi', 'url' => '/unduh/dokumen-akreditasi', 'order' => 1, 'is_active' => true],
                    ['title_id' => 'Materi Kegiatan', 'url' => '/unduh/materi-kegiatan', 'order' => 2, 'is_active' => true],
                    ['title_id' => 'Artikel Penilaian Kesesuaian', 'url' => '/unduh/artikel-penilaian-kesesuaian', 'order' => 3, 'is_active' => true],
                    ['title_id' => 'Dokumen Internasional', 'url' => '/unduh/dokumen-internasional', 'order' => 4, 'is_active' => true],
                ],
            ],
            ['title_id' => 'FAQ', 'url' => '/faq', 'order' => 7, 'is_active' => true, 'children' => []],
        ];

        foreach ($structure as $item) {
            $children = $item['children'];
            unset($item['children']);
            $parent = Menu::create($item);
            foreach ($children as $child) {
                $child['parent_id'] = $parent->id;
                Menu::create($child);
            }
        }
    }
}
