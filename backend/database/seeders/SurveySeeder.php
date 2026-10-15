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
        $this->seedSatisfactionSurvey();
        $this->seedTrainingEvaluation();
        $this->seedWebsiteFeedback();
    }

    // ------------------------------------------------------------------
    // 1. Survei Kepuasan Layanan Akreditasi
    // ------------------------------------------------------------------
    private function seedSatisfactionSurvey(): void
    {
        $s1 = Survey::create([
            'code' => 'k7x2m9',
            'title' => 'Survei Kepuasan Layanan Akreditasi',
            'description' => 'Pendapat Anda membantu KAN meningkatkan mutu layanan akreditasi. Mengisi hanya butuh sekitar 3 menit.',
            'is_published' => true,
            'is_active' => true,
            'created_by' => 1,
        ]);

        $q1 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 1,
            'text' => 'Anda mewakili jenis lembaga apa?',
            'type' => 'choice',
            'is_required' => true,
            'options' => ['Laboratorium penguji', 'Laboratorium kalibrasi', 'Lembaga inspeksi', 'Lembaga sertifikasi', 'Lainnya'],
        ]);

        $q2 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 2,
            'text' => 'Seberapa mudah proses pendaftaran akreditasi menurut Anda?',
            'type' => 'scale',
            'is_required' => true,
            'options' => [],
        ]);

        $q3 = SurveyQuestion::create([
            'survey_id' => $s1->id,
            'order' => 3,
            'text' => 'Layanan KAN mana yang pernah Anda gunakan?',
            'type' => 'check',
            'is_required' => false,
            'options' => ['Pendaftaran akreditasi', 'Asesmen', 'Surveilen', 'Pelatihan e-Training', 'Layanan informasi'],
        ]);

        $q4 = SurveyQuestion::create([
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

        // 48 responden contoh
        for ($i = 0; $i < 48; $i++) {
            $created = Carbon::now()->subHours(fake()->numberBetween(1, 300));
            $resp = $this->createResponse($s1, $created);

            $this->createAnswer($resp, $q1, $created, fake()->randomElement($q1->options));

            // Skala condong ke 4-5
            $scaleVal = fake()->randomElement([3, 4, 4, 4, 5, 5, 5, 2]);
            $this->createAnswer($resp, $q2, $created, (string) $scaleVal);

            // Checkbox: 1 sampai 3 pilihan
            $shuffled = fake()->shuffleArray($q3->options);
            $chosen = array_slice($shuffled, 0, fake()->numberBetween(1, 3));
            $this->createAnswer($resp, $q3, $created, json_encode($chosen));

            // Paragraf: terisi secara acak
            if (fake()->numberBetween(0, 10) > 4) {
                $this->createAnswer($resp, $q4, $created, fake()->randomElement($suggestions));
            }
        }
    }

    // ------------------------------------------------------------------
    // 2. Evaluasi Pelatihan e-Training
    // ------------------------------------------------------------------
    private function seedTrainingEvaluation(): void
    {
        $s2 = Survey::create([
            'code' => 'p3q8wd',
            'title' => 'Evaluasi Pelatihan e-Training',
            'description' => 'Penilaian peserta terhadap materi dan pengajar pelatihan e-Training KAN.',
            'is_published' => true,
            'is_active' => false,
            'created_by' => 1,
        ]);

        $q1 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 1,
            'text' => 'Materi pelatihan mana yang Anda ikuti?',
            'type' => 'drop',
            'is_required' => true,
            'options' => ['Persyaratan umum', 'Audit internal', 'Ketidakpastian pengukuran'],
        ]);

        $q2 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 2,
            'text' => 'Seberapa jelas penyampaian materi oleh pengajar?',
            'type' => 'scale',
            'is_required' => true,
            'options' => [],
        ]);

        $q3 = SurveyQuestion::create([
            'survey_id' => $s2->id,
            'order' => 3,
            'text' => 'Apa yang perlu ditingkatkan dari pelatihan ini?',
            'type' => 'para',
            'is_required' => false,
            'options' => [],
        ]);

        // 126 responden contoh
        for ($i = 0; $i < 126; $i++) {
            $created = Carbon::now()->subDays(fake()->numberBetween(5, 45));
            $resp = $this->createResponse($s2, $created);

            $this->createAnswer($resp, $q1, $created, fake()->randomElement($q1->options));

            $scaleVal = fake()->randomElement([4, 5, 5, 4, 3, 5]);
            $this->createAnswer($resp, $q2, $created, (string) $scaleVal);

            if (fake()->numberBetween(0, 10) > 4) {
                $this->createAnswer($resp, $q3, $created, 'Waktu latihan studi kasus diperbanyak.');
            }
        }
    }

    // ------------------------------------------------------------------
    // 3. Umpan Balik Website KAN (Draf)
    // ------------------------------------------------------------------
    private function seedWebsiteFeedback(): void
    {
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

    // ------------------------------------------------------------------
    // Fungsi bantu
    // ------------------------------------------------------------------
    private function createResponse(Survey $survey, Carbon $created): SurveyResponse
    {
        return SurveyResponse::create([
            'survey_id' => $survey->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 Sample Browser',
            'created_at' => $created,
            'updated_at' => $created,
        ]);
    }

    private function createAnswer(SurveyResponse $resp, SurveyQuestion $question, Carbon $created, string $value): void
    {
        SurveyAnswer::create([
            'response_id' => $resp->id,
            'question_id' => $question->id,
            'answer_value' => $value,
            'created_at' => $created,
            'updated_at' => $created,
        ]);
    }
}
