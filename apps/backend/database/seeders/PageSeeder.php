<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Page;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [

            // =============================================
            // TENTANG KAN
            // =============================================
            [
                'title_id'            => 'Sejarah dan Fungsi KAN',
                'slug'                => 'sejarah-fungsi',
                'content_id'          => '<p>Komite Akreditasi Nasional (KAN) dibentuk berdasarkan Keputusan Presiden Nomor 13 Tahun 1997 sebagai lembaga non-struktural yang independen. KAN bertugas memberikan akreditasi kepada lembaga penilaian kesesuaian yang memenuhi persyaratan kompetensi internasional.</p>',
                'meta_title_id'       => 'Sejarah dan Fungsi KAN',
                'meta_description_id' => 'Sejarah pembentukan dan fungsi utama Komite Akreditasi Nasional (KAN) sebagai lembaga akreditasi independen di Indonesia.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Struktur Organisasi',
                'slug'                => 'struktur-organisasi',
                'content_id'          => '<p>KAN dipimpin oleh seorang Ketua yang dibantu oleh Wakil Ketua dan Sekretaris. Dalam menjalankan tugasnya, KAN dibantu oleh beberapa komite teknis.</p>',
                'meta_title_id'       => 'Struktur Organisasi KAN',
                'meta_description_id' => 'Struktur organisasi Komite Akreditasi Nasional (KAN) meliputi dewan pengurus dan komite teknis akreditasi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Ketidakberpihakan',
                'slug'                => 'ketidakberpihakan',
                'content_id'          => '<p>KAN berkomitmen penuh untuk menjaga ketidakberpihakan dalam seluruh kegiatan akreditasinya demi kepercayaan publik terhadap sistem akreditasi Indonesia.</p>',
                'meta_title_id'       => 'Ketidakberpihakan KAN',
                'meta_description_id' => 'Komitmen dan prinsip ketidakberpihakan KAN dalam proses akreditasi untuk menjaga kepercayaan publik.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Pengakuan Internasional',
                'slug'                => 'pengakuan-internasional',
                'content_id'          => '<p>KAN telah mendapatkan pengakuan internasional dari berbagai organisasi akreditasi internasional seperti ILAC, IAF, APLAC, dan PAC.</p>',
                'meta_title_id'       => 'Pengakuan Internasional KAN',
                'meta_description_id' => 'KAN diakui secara internasional oleh ILAC, IAF, APLAC, dan PAC sehingga sertifikat LPK terakreditasi KAN diterima di lebih dari 100 negara.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Anggota KAN',
                'slug'                => 'anggota-kan',
                'content_id'          => '<p>KAN memiliki anggota yang terdiri dari berbagai pemangku kepentingan di bidang akreditasi dan penilaian kesesuaian di Indonesia, termasuk kementerian, lembaga pemerintah, dan asosiasi industri.</p>',
                'meta_title_id'       => 'Anggota KAN',
                'meta_description_id' => 'Daftar anggota Komite Akreditasi Nasional (KAN) dari berbagai kementerian, lembaga pemerintah, dan asosiasi industri.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Maklumat Layanan',
                'slug'                => 'maklumat-layanan',
                'content_id'          => '<p>KAN berkomitmen memberikan layanan akreditasi yang profesional, transparan, dan akuntabel kepada seluruh pemohon akreditasi.</p>',
                'meta_title_id'       => 'Maklumat Layanan KAN',
                'meta_description_id' => 'Maklumat layanan KAN sebagai komitmen memberikan layanan akreditasi yang profesional dan transparan.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Standar Layanan Akreditasi',
                'slug'                => 'standar-layanan',
                'content_id'          => '<p>Standar layanan akreditasi KAN mengacu pada persyaratan internasional SNI ISO/IEC 17011 untuk memastikan konsistensi dan kualitas layanan akreditasi.</p>',
                'meta_title_id'       => 'Standar Layanan Akreditasi KAN',
                'meta_description_id' => 'Standar layanan akreditasi KAN yang mengacu pada SNI ISO/IEC 17011 untuk menjamin kualitas dan konsistensi layanan.',
                'is_published'        => true,
            ],

            // =============================================
            // PROSES AKREDITASI
            // =============================================
            [
                'title_id'            => 'Proses Akreditasi',
                'slug'                => 'proses-akreditasi',
                'content_id'          => '<p>Proses akreditasi KAN meliputi beberapa tahapan mulai dari pengajuan permohonan, review dokumen, asesmen lapangan, hingga keputusan akreditasi.</p>',
                'meta_title_id'       => 'Proses Akreditasi KAN',
                'meta_description_id' => 'Tahapan proses akreditasi KAN mulai dari pengajuan permohonan, review dokumen, asesmen lapangan, hingga keputusan akreditasi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Tarif Akreditasi',
                'slug'                => 'tarif-akreditasi',
                'content_id'          => '<p>Tarif akreditasi KAN ditetapkan berdasarkan jenis skema akreditasi, ruang lingkup, dan jumlah lokasi yang diakreditasi sesuai peraturan yang berlaku.</p>',
                'meta_title_id'       => 'Tarif Akreditasi KAN',
                'meta_description_id' => 'Informasi tarif akreditasi KAN berdasarkan jenis skema, ruang lingkup, dan jumlah lokasi akreditasi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Penanganan Komplain',
                'slug'                => 'penanganan-komplain',
                'content_id'          => '<p>KAN menyediakan mekanisme penanganan komplain yang transparan dan efektif bagi semua pihak yang terkait dengan proses akreditasi.</p>',
                'meta_title_id'       => 'Penanganan Komplain KAN',
                'meta_description_id' => 'Mekanisme dan prosedur penanganan komplain KAN yang transparan untuk semua pihak terkait proses akreditasi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Penanganan Banding',
                'slug'                => 'penanganan-banding',
                'content_id'          => '<p>KAN menyediakan prosedur banding bagi lembaga yang tidak puas dengan keputusan akreditasi, diproses secara independen dan tidak memihak.</p>',
                'meta_title_id'       => 'Penanganan Banding KAN',
                'meta_description_id' => 'Prosedur penanganan banding KAN bagi lembaga yang tidak puas dengan keputusan akreditasi, diproses secara independen.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Survey Kepuasan Pelanggan',
                'slug'                => 'survey-kepuasan-pelanggan',
                'content_id'          => '<p>KAN secara berkala melakukan survey kepuasan pelanggan untuk mengukur kualitas layanan akreditasi dan meningkatkan kinerja secara berkelanjutan.</p>',
                'meta_title_id'       => 'Survey Kepuasan Pelanggan KAN',
                'meta_description_id' => 'Survey kepuasan pelanggan KAN untuk mengukur dan meningkatkan kualitas layanan akreditasi secara berkala.',
                'is_published'        => true,
            ],

            // =============================================
            // LAYANAN AKREDITASI
            // =============================================
            [
                'title_id'            => 'Akreditasi Laboratorium',
                'slug'                => 'layanan/laboratorium',
                'content_id'          => '<p>KAN memberikan akreditasi kepada laboratorium pengujian dan kalibrasi berdasarkan SNI ISO/IEC 17025 untuk memastikan kompetensi teknis dan keandalan hasil pengujian.</p>',
                'meta_title_id'       => 'Akreditasi Laboratorium KAN',
                'meta_description_id' => 'Layanan akreditasi laboratorium pengujian dan kalibrasi oleh KAN berdasarkan SNI ISO/IEC 17025.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Lembaga Inspeksi',
                'slug'                => 'layanan/lembaga-inspeksi',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga inspeksi berdasarkan SNI ISO/IEC 17020 untuk memastikan kompetensi dalam kegiatan inspeksi.</p>',
                'meta_title_id'       => 'Akreditasi Lembaga Inspeksi KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga inspeksi oleh KAN berdasarkan SNI ISO/IEC 17020 untuk menjamin kompetensi inspeksi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Lembaga Verifikasi dan Validasi Gas Rumah Kaca',
                'slug'                => 'layanan/lembaga-verifikasi-validasi-grk',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga verifikasi dan validasi Gas Rumah Kaca (GRK) berdasarkan SNI ISO 14065 untuk mendukung program mitigasi perubahan iklim.</p>',
                'meta_title_id'       => 'Akreditasi Lembaga Verifikasi Validasi GRK KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga verifikasi dan validasi Gas Rumah Kaca (GRK) oleh KAN berdasarkan SNI ISO 14065.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Penyelenggara Uji Profisiensi',
                'slug'                => 'layanan/penyelenggara-uji-profisiensi',
                'content_id'          => '<p>KAN memberikan akreditasi kepada penyelenggara uji profisiensi berdasarkan SNI ISO/IEC 17043 untuk memastikan kompetensi penyelenggaraan uji banding antar laboratorium.</p>',
                'meta_title_id'       => 'Akreditasi Penyelenggara Uji Profisiensi KAN',
                'meta_description_id' => 'Layanan akreditasi penyelenggara uji profisiensi oleh KAN berdasarkan SNI ISO/IEC 17043.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Produsen Bahan Acuan',
                'slug'                => 'layanan/produsen-bahan-acuan',
                'content_id'          => '<p>KAN memberikan akreditasi kepada produsen bahan acuan berdasarkan SNI ISO 17034 untuk memastikan kompetensi dalam memproduksi bahan acuan yang andal.</p>',
                'meta_title_id'       => 'Akreditasi Produsen Bahan Acuan KAN',
                'meta_description_id' => 'Layanan akreditasi produsen bahan acuan oleh KAN berdasarkan SNI ISO 17034.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Sistem Manajemen',
                'slug'                => 'layanan/sistem-manajemen',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga sertifikasi sistem manajemen berdasarkan SNI ISO/IEC 17021 untuk berbagai standar seperti ISO 9001, ISO 14001, dan lainnya.</p>',
                'meta_title_id'       => 'Akreditasi Sistem Manajemen KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga sertifikasi sistem manajemen oleh KAN berdasarkan SNI ISO/IEC 17021.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Sertifikasi Person',
                'slug'                => 'layanan/sertifikasi-person',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga sertifikasi person berdasarkan SNI ISO/IEC 17024 untuk memastikan kompetensi individu dalam bidang tertentu.</p>',
                'meta_title_id'       => 'Akreditasi Sertifikasi Person KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga sertifikasi person oleh KAN berdasarkan SNI ISO/IEC 17024.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Sertifikasi Berdasarkan SNI ISO/IEC 17065',
                'slug'                => 'layanan/sertifikasi-sni-iso-iec-17065',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga sertifikasi produk, proses, dan jasa berdasarkan SNI ISO/IEC 17065.</p>',
                'meta_title_id'       => 'Akreditasi Sertifikasi SNI ISO/IEC 17065 KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga sertifikasi produk, proses, dan jasa oleh KAN berdasarkan SNI ISO/IEC 17065.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Akreditasi Sertifikasi Pembangunan Berkelanjutan',
                'slug'                => 'layanan/sertifikasi-pembangunan-berkelanjutan',
                'content_id'          => '<p>KAN memberikan akreditasi kepada lembaga sertifikasi pembangunan berkelanjutan untuk mendukung komitmen Indonesia terhadap tujuan pembangunan berkelanjutan (SDGs).</p>',
                'meta_title_id'       => 'Akreditasi Sertifikasi Pembangunan Berkelanjutan KAN',
                'meta_description_id' => 'Layanan akreditasi lembaga sertifikasi pembangunan berkelanjutan oleh KAN untuk mendukung SDGs.',
                'is_published'        => true,
            ],

            // =============================================
            // UNDUH
            // =============================================
            [
                'title_id'            => 'Dokumen Akreditasi',
                'slug'                => 'unduh/dokumen-akreditasi',
                'content_id'          => '<p>Unduh dokumen-dokumen akreditasi KAN seperti panduan, persyaratan teknis, dan formulir permohonan akreditasi.</p>',
                'meta_title_id'       => 'Unduh Dokumen Akreditasi KAN',
                'meta_description_id' => 'Unduh dokumen akreditasi KAN meliputi panduan, persyaratan teknis, dan formulir permohonan.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Materi Kegiatan',
                'slug'                => 'unduh/materi-kegiatan',
                'content_id'          => '<p>Unduh materi kegiatan KAN seperti presentasi seminar, workshop, dan pelatihan yang telah diselenggarakan.</p>',
                'meta_title_id'       => 'Unduh Materi Kegiatan KAN',
                'meta_description_id' => 'Unduh materi kegiatan KAN termasuk presentasi seminar, workshop, dan pelatihan akreditasi.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Artikel Penilaian Kesesuaian',
                'slug'                => 'unduh/artikel-penilaian-kesesuaian',
                'content_id'          => '<p>Unduh artikel dan publikasi ilmiah terkait penilaian kesesuaian dan akreditasi yang diterbitkan oleh KAN.</p>',
                'meta_title_id'       => 'Unduh Artikel Penilaian Kesesuaian KAN',
                'meta_description_id' => 'Unduh artikel dan publikasi ilmiah terkait penilaian kesesuaian dan akreditasi dari KAN.',
                'is_published'        => true,
            ],
            [
                'title_id'            => 'Dokumen Internasional',
                'slug'                => 'unduh/dokumen-internasional',
                'content_id'          => '<p>Unduh dokumen internasional terkait akreditasi dari organisasi seperti ILAC, IAF, APLAC, dan PAC yang menjadi acuan KAN.</p>',
                'meta_title_id'       => 'Unduh Dokumen Internasional KAN',
                'meta_description_id' => 'Unduh dokumen internasional dari ILAC, IAF, APLAC, dan PAC yang menjadi acuan akreditasi KAN.',
                'is_published'        => true,
            ],
        ];

        foreach ($pages as $page) {
            Page::updateOrCreate(
                ['slug' => $page['slug']],
                $page
            );
        }

        $this->command->info('PageSeeder: ' . count($pages) . ' halaman berhasil di-seed.');
    }
}
