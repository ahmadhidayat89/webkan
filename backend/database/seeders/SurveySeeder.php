<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\SurveyAnswer;
use Carbon\Carbon;

class SurveySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Survei Kepuasan Layanan Akreditasi
        $s1 = Survey::create([
            'code' => 'k7x2m9',
            'title' => 'Survei Kepuasan Layanan Akreditasi',
            'description' => 'Pendapat Anda membantu KAN meningkatkan mutu layanan akreditasi. Mengisi hanya butuh sekitar 3 menit.',
            'is_published' => true,
            'is_active' => true,
            'created_by' => 1,
        ]);

        $q1_1 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 1,
            'text' => 'Anda mewakili jenis lembaga apa?',
            'type' => 'choice',
            'is_required' => true,
            'options' => ['Laboratorium penguji', 'Laboratorium kalibrasi', 'Lembaga inspeksi', 'Lembaga sertifikasi', 'Lainnya'],
        ]);

        $q1_2 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 2,
            'text' => 'Seberapa mudah proses pendaftaran akreditasi menurut Anda?',
            'type' => 'scale',
            'is_required' => true,
            'options' => [],
        ]);

        $q1_3 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 3,
            'text' => 'Layanan KAN mana yang pernah Anda gunakan?',
            'type' => 'check',
            'is_required' => false,
            'options' => ['Pendaftaran akreditasi', 'Asesmen', 'Surveilen', 'Pelatihan e-Training', 'Layanan informasi'],
        ]);

        $q1_4 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 4,
            'text' => 'Apa saran Anda untuk meningkatkan layanan KAN?',
            'type' => 'para',
            'is_required' => false,
            'options' => [],
        ]);

        $suggestions = [
            'Proses sudah baik, hanya perlu respons yang lebih cepat.',
            'Informasi persyaratan di situs sudah jelas.',
            'Mohon ditambah panduan video untuk mengisi dokumen.',
            'Jadwal asesmen sebaiknya diinformasikan lebih awal.',
            'Layanan ramah dan sangat membantu.',
            'Sistem pendaftaran kadang lambat saat jam sibuk.',
        ];

        // Seed 48 realistic respondents for s1
        for ($i = 0; $i < 48; $i++) {
            $created = Carbon::now()->subHours(fake()->numberBetween(1, 300));
            $resp = SurveyResponse::create([
                'survey_id' => $s1->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 Sample Browser',
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            // Answer 1: choice
            $opts1 = $q1_1->options;
            $chosen1 = fake()->randomElement($opts1);
            SurveyAnswer::create([
                'response_id' => $resp->id,
                'question_id' => $q1_1->id,
                'answer_value' => $chosen1,
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            // Answer 2: scale (weighted towards 4-5)
            $scaleVal = fake()->randomElement([3, 4, 4, 4, 5, 5, 5, 2]);
            SurveyAnswer::create([
                'response_id' => $resp->id,
                'question_id' => $q1_2->id,
                'answer_value' => (string)$scaleVal,
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            // Answer 3: check (1 to 3 items)
            $opts3 = $q1_3->options;
            $opts3 = fake()->shuffleArray($opts3);
            $chosen3 = array_slice($opts3, 0, fake()->numberBetween(1, 3));
            SurveyAnswer::create([
                'response_id' => $resp->id,
                'question_id' => $q1_3->id,
                'answer_value' => json_encode($chosen3),
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            // Answer 4: para (randomly filled)
            if (fake()->numberBetween(0, 10) > 4) {
                SurveyAnswer::create([
                    'response_id' => $resp->id,
                    'question_id' => $q1_4->id,
                    'answer_value' => fake()->randomElement($suggestions),
                    'created_at' => $created,
                    'updated_at' => $created,
                ]);
            }
        }

        // 2. Evaluasi Pelatihan e-Training
        $s2 = Survey::create([
            'code' => 'p3q8wd',
            'title' => 'Evaluasi Pelatihan e-Training',
            'description' => 'Penilaian peserta terhadap materi dan pengajar pelatihan e-Training KAN.',
            'is_published' => true,
            'is_active' => false,
            'created_by' => 1,
        ]);

        $q2_1 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 1,
            'text' => 'Materi pelatihan mana yang Anda ikuti?',
            'type' => 'drop',
            'is_required' => true,
            'options' => ['Persyaratan umum', 'Audit internal', 'Ketidakpastian pengukuran'],
        ]);

        $q2_2 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 2,
            'text' => 'Seberapa jelas penyampaian materi oleh pengajar?',
            'type' => 'scale',
            'is_required' => true,
            'options' => [],
        ]);

        $q2_3 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 3,
            'text' => 'Apa yang perlu ditingkatkan dari pelatihan ini?',
            'type' => 'para',
            'is_required' => false,
            'options' => [],
        ]);

        // Seed 126 respondents for s2
        for ($i = 0; $i < 126; $i++) {
            $created = Carbon::now()->subDays(fake()->numberBetween(5, 45));
            $resp = SurveyResponse::create([
                'survey_id' => $s2->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 Sample Browser',
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            $opts2 = $q2_1->options;
            SurveyAnswer::create([
                'response_id' => $resp->id,
                'question_id' => $q2_1->id,
                'answer_value' => fake()->randomElement($opts2),
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            $scaleVal = fake()->randomElement([4, 5, 5, 4, 3, 5]);
            SurveyAnswer::create([
                'response_id' => $resp->id,
                'question_id' => $q2_2->id,
                'answer_value' => (string)$scaleVal,
                'created_at' => $created,
                'updated_at' => $created,
            ]);

            if (fake()->numberBetween(0, 10) > 4) {
                SurveyAnswer::create([
                    'response_id' => $resp->id,
                    'question_id' => $q2_3->id,
                    'answer_value' => 'Waktu latihan studi kasus diperbanyak.',
                    'created_at' => $created,
                    'updated_at' => $created,
                ]);
            }
        }

        // 3. Umpan Balik Website KAN (Draf)
        $s3 = Survey::create([
            'code' => 'w9b1fk',
            'title' => 'Umpan Balik Website KAN',
            'description' => 'Mengukur kemudahan menemukan informasi di website KAN.',
            'is_published' => false,
            'is_active' => true,
            'created_by' => 1,
        ]);

        SurveyQuestion::create([
            'survey_id' => $s3->id,
            'order' => 1,
            'text' => 'Seberapa mudah menemukan informasi di website KAN?',
            'type' => 'scale',
            'is_required' => true,
            'options' => [],
        ]);

        SurveyQuestion::create([
            'survey_id' => $s3->id,
            'order' => 2,
            'text' => 'Halaman mana yang Anda kunjungi?',
            'type' => 'check',
            'is_required' => false,
            'options' => ['Beranda', 'Direktori LPK', 'Unduh Dokumen', 'E-Training'],
        ]);
    }
}
