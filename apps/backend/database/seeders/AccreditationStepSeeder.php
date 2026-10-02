<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccreditationStep;

class AccreditationStepSeeder extends Seeder
{
    public function run(): void
    {
        // Skip jika sudah ada data
        if (AccreditationStep::exists()) {
            return;
        }

        $steps = [
            [
                'sort_order'  => 1,
                'icon'        => '📝',
                'title'       => 'Permohonan Akreditasi',
                'tag'         => 'Via Portal KAN',
                'description' => 'LPK melakukan registrasi online dengan mengisi data dan informasi melalui portal KAMIS menggunakan username dan password yang diperoleh, maksimal 1 bulan sejak mendapatkan akses.',
            ],
            [
                'sort_order'  => 2,
                'icon'        => '📧',
                'title'       => 'Konfirmasi Registrasi',
                'tag'         => 'Email Otomatis',
                'description' => 'LPK mendapatkan email konfirmasi berisi username dan password untuk login ke laman http://jagalan.kan.or.id/ sejak mengajukan permohonan akreditasi.',
            ],
            [
                'sort_order'  => 3,
                'icon'        => '📤',
                'title'       => 'Upload Dokumen Permohonan',
                'tag'         => 'Portal KANKAMIS',
                'description' => 'LPK mengunggah informasi dan seluruh dokumen yang diperlukan maksimal 1 (satu) bulan sejak mendapatkan username dan password login.',
            ],
            [
                'sort_order'  => 4,
                'icon'        => '🔍',
                'title'       => 'Kajian Permohonan & Sumber Daya',
                'tag'         => 'Sekretariat KAN',
                'description' => 'Sekretariat KAN melakukan pengecekan kelengkapan dokumen dalam waktu 4 (empat) bulan sejak LPK mengajukan permohonan akreditasi.',
            ],
            [
                'sort_order'  => 5,
                'icon'        => '📑',
                'title'       => 'Audit Dokumen & Rekaman LPK',
                'tag'         => 'Tim Asesmen KAN',
                'description' => 'Tim asesmen melakukan audit dokumen dan rekaman LPK. Jika belum memenuhi, LPK harus melakukan perbaikan dalam 2 (dua) bulan sejak menerima surat audit.',
            ],
            [
                'sort_order'  => 6,
                'icon'        => '💳',
                'title'       => 'Pembayaran Asesmen',
                'tag'         => 'Wajib Dilunasi',
                'description' => 'LPK melakukan pembayaran permohonan akreditasi terhadap surat tagihan biaya yang diberikan oleh Sekretariat KAN sebelum asesmen lapangan dilaksanakan.',
            ],
            [
                'sort_order'  => 7,
                'icon'        => '🏭',
                'title'       => 'Asesmen Lapangan',
                'tag'         => 'Kunjungan On-site',
                'description' => 'Tim asesmen mengunjungi LPK untuk membuktikan kesesuaian implementasi. LPK diberikan waktu untuk memperbaiki ketidaksesuaian sesuai buku TP dan VTP.',
            ],
            [
                'sort_order'  => 8,
                'icon'        => '👁️',
                'title'       => 'Asesmen Penyaksian / Witness',
                'tag'         => 'Observasi Langsung',
                'description' => 'Tim witness melakukan penyaksian unjuk kerja LPK dengan cara observasi saat LPK melakukan kegiatan penilaian sesuai lingkup akreditasi yang diajukan.',
            ],
            [
                'sort_order'  => 9,
                'icon'        => '🏛️',
                'title'       => 'Rapat Panitia Teknis',
                'tag'         => 'Internal KAN',
                'description' => 'Kajian hasil asesmen dilakukan untuk memberikan rekomendasi akreditasi kepada Anggota KAN berdasarkan temuan dan bukti objektif dari seluruh proses asesmen.',
            ],
            [
                'sort_order'  => 10,
                'icon'        => '⚖️',
                'title'       => 'Pengambilan Keputusan & Pemberian Akreditasi',
                'tag'         => 'Rapat Anggota KAN',
                'description' => 'Keputusan akreditasi ditetapkan dalam rapat Anggota KAN yang dilaksanakan sekurang-kurangnya 2 (dua) kali dalam 1 (satu) bulan.',
            ],
            [
                'sort_order'  => 11,
                'icon'        => '🏆',
                'title'       => 'Penerbitan SK, Sertifikat, dan Lampiran',
                'tag'         => 'Akreditasi Terbit 🎉',
                'description' => 'SK, sertifikat, dan lampiran disampaikan kepada LPK yang telah mendapatkan akreditasi sesuai ruang lingkup akreditasi yang dimiliki.',
            ],
        ];

        foreach ($steps as $step) {
            AccreditationStep::create($step);
        }
    }
}
