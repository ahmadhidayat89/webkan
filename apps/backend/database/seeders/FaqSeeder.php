<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question'     => 'Apa itu akreditasi KAN?',
                'answer'       => 'Akreditasi KAN adalah pengakuan formal yang diberikan oleh Komite Akreditasi Nasional (KAN) kepada lembaga penilaian kesesuaian (LPK) yang telah memenuhi persyaratan kompetensi berdasarkan standar internasional yang berlaku, seperti ISO/IEC 17025, ISO/IEC 17020, ISO/IEC 17021, dan lainnya.',
                'order'        => 1,
                'is_active'    => true,
                'show_on_home' => true,
            ],
            [
                'question'     => 'Apa saja jenis layanan akreditasi yang tersedia di KAN?',
                'answer'       => 'KAN menyediakan layanan akreditasi untuk berbagai jenis lembaga penilaian kesesuaian, antara lain: Laboratorium Pengujian dan Kalibrasi (ISO/IEC 17025), Lembaga Inspeksi (ISO/IEC 17020), Lembaga Sertifikasi Sistem Manajemen (ISO/IEC 17021), Lembaga Sertifikasi Produk (ISO/IEC 17065), Lembaga Sertifikasi Person (ISO/IEC 17024), Penyelenggara Uji Profisiensi (ISO/IEC 17043), Produsen Bahan Acuan (ISO 17034), dan Lembaga Verifikasi/Validasi GRK (ISO 14065).',
                'order'        => 2,
                'is_active'    => true,
                'show_on_home' => true,
            ],
            [
                'question'     => 'Berapa lama proses akreditasi berlangsung?',
                'answer'       => 'Durasi proses akreditasi bergantung pada beberapa faktor, antara lain kesiapan dokumen pemohon, kompleksitas ruang lingkup yang diajukan, serta hasil asesmen lapangan. Secara umum, proses akreditasi baru dapat diselesaikan dalam kurun waktu 6 hingga 12 bulan sejak permohonan dinyatakan lengkap.',
                'order'        => 3,
                'is_active'    => true,
                'show_on_home' => true,
            ],
            [
                'question'     => 'Bagaimana cara mengajukan permohonan akreditasi?',
                'answer'       => 'Permohonan akreditasi dapat diajukan melalui sistem informasi akreditasi KAN secara online. Pemohon perlu menyiapkan dokumen persyaratan yang meliputi formulir permohonan, dokumen sistem manajemen mutu, bukti kompetensi personel, dan dokumen pendukung lainnya sesuai dengan skema akreditasi yang dipilih.',
                'order'        => 4,
                'is_active'    => true,
                'show_on_home' => false,
            ],
            [
                'question'     => 'Berapa lama masa berlaku sertifikat akreditasi?',
                'answer'       => 'Sertifikat akreditasi KAN berlaku selama 4 (empat) tahun, dengan kewajiban melakukan surveilans (pemantauan berkala) setiap tahun untuk memastikan LPK tetap memenuhi persyaratan akreditasi yang ditetapkan.',
                'order'        => 5,
                'is_active'    => true,
                'show_on_home' => false,
            ],
            [
                'question'     => 'Apakah akreditasi KAN diakui secara internasional?',
                'answer'       => 'Ya. KAN merupakan anggota penandatangan Multilateral Recognition Arrangement (MLA) dari International Accreditation Forum (IAF) dan Mutual Recognition Arrangement (MRA) dari International Laboratory Accreditation Cooperation (ILAC), serta APAC MRA. Pengakuan ini berarti hasil uji, kalibrasi, inspeksi, dan sertifikasi dari LPK terakreditasi KAN diakui di negara-negara anggota perjanjian tersebut.',
                'order'        => 6,
                'is_active'    => true,
                'show_on_home' => false,
            ],
            [
                'question'     => 'Apa yang dimaksud dengan surveilans akreditasi?',
                'answer'       => 'Surveilans adalah kegiatan pemantauan yang dilakukan oleh KAN terhadap LPK terakreditasi secara berkala (biasanya setiap tahun) untuk memastikan LPK tersebut tetap konsisten memenuhi persyaratan akreditasi. Kegiatan ini dapat mencakup asesmen dokumen maupun kunjungan lapangan.',
                'order'        => 7,
                'is_active'    => true,
                'show_on_home' => false,
            ],
            [
                'question'     => 'Bagaimana prosedur pengajuan komplain terhadap LPK terakreditasi?',
                'answer'       => 'Komplain terhadap LPK terakreditasi KAN dapat disampaikan secara tertulis kepada KAN melalui email resmi atau sistem pengaduan yang tersedia. KAN akan menindaklanjuti setiap komplain sesuai prosedur penanganan komplain yang berlaku, termasuk melakukan investigasi dan tindakan korektif jika diperlukan.',
                'order'        => 8,
                'is_active'    => true,
                'show_on_home' => false,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                $faq
            );
        }

        $this->command->info('FAQ seeded: ' . count($faqs) . ' pertanyaan.');
    }
}
