<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PageContent;

class PageContentSeeder extends Seeder
{
    public function run(): void
    {
        $pages = array_merge(
            $this->tentangKanPages(),
            $this->prosesAkreditasiPages(),
            $this->layananLaboratoriumDanInspeksiPages(),
            $this->layananSertifikasiPages(),
            $this->direktoriPages(),
            $this->unduhPages(),
        );

        foreach ($pages as $page) {
            PageContent::updateOrCreate(
                ['page_id' => $page['page_id']],
                [
                    'content_id' => $page['content_id'],
                    'content_en' => $page['content_en'] ?? null,
                    'image'      => null,
                ]
            );
        }

        $this->command->info('✓ ' . count($pages) . ' halaman berhasil di-seed.');
    }

    // TENTANG KAN
    private function tentangKanPages(): array
    {
        return [
            // PINDAHKAN blok ini (apa adanya, dari "[" sampai "],"):
            // sejarah-fungsi, struktur-organisasi, ketidakberpihakan,
            // pengakuan-internasional, anggota-kan, maklumat-layanan, standar-layanan
        ];
    }

    // PROSES AKREDITASI
    private function prosesAkreditasiPages(): array
    {
        return [
            // proses-akreditasi, tarif-akreditasi, penanganan-komplain,
            // penanganan-banding, survey-kepuasan-pelanggan
        ];
    }

    // LAYANAN (bagian 1)
    private function layananLaboratoriumDanInspeksiPages(): array
    {
        return [
            // layanan/laboratorium, layanan/lembaga-inspeksi,
            // layanan/lembaga-verifikasi-validasi-grk,
            // layanan/penyelenggara-uji-profisiensi, layanan/produsen-bahan-acuan
        ];
    }

    // LAYANAN (bagian 2)
    private function layananSertifikasiPages(): array
    {
        return [
            // layanan/sistem-manajemen, layanan/sertifikasi-person,
            // layanan/sertifikasi-sni-iso-iec-17065,
            // layanan/sertifikasi-pembangunan-berkelanjutan
        ];
    }

    // DIREKTORI LPK
    private function direktoriPages(): array
    {
        return [
            // direktori/terakreditasi, direktori/akreditasi-dibekukan,
            // direktori/akreditasi-dicabut
        ];
    }

    // UNDUH
    private function unduhPages(): array
    {
        return [
            // unduh/dokumen-akreditasi, unduh/materi-kegiatan,
            // unduh/artikel-penilaian-kesesuaian, unduh/dokumen-internasional
        ];
    }
}
