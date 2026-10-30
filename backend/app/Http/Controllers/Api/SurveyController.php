<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Services\Survey\SurveyFlow;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SurveyController extends Controller
{
    /**
     * Pola SQL injection (lapisan tambahan; perlindungan utama tetap query
     * berparameter Eloquent).
     */
    private const SQLI_PATTERNS = [
        '/[\'"]\s*(or|and)\s+\S+\s*=\s*\S+/i',
        '/\b(or|and)\s+(\d+)\s*=\s*\2\b/i',
        '/\bunion\s+(all\s+)?select\b/i',
        '/\b(drop|truncate|alter)\s+table\b/i',
        '/[\'"]\s*--/',
        '/\bxp_cmdshell\b/i',
        '/\bsleep\s*\(\s*\d+\s*\)/i',
        '/\bbenchmark\s*\(/i',
    ];

    /**
     * Display the specified public survey by code.
     */
    public function show(Request $request, $code)
    {
        $survey = Survey::with(['questions' => function ($q) {
            $q->orderBy('order', 'asc');
        }])
        ->where('code', $code)
        ->where('is_published', true)
        ->first();

        if (!$survey) {
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.',
            ], 404);
        }

        $editResponse = null;
        if ($request->filled('edit')) {
            if (empty($survey->settings['allow_edit'])) return response()->json(['message' => 'Perubahan jawaban tidak diizinkan.'], 403);
            $request->validate(['edit' => 'required|string|size:64']);
            $editResponse = $survey->responses()->with('answers')->where('edit_token', $request->query('edit'))->first();
            if (!$editResponse) return response()->json(['message' => 'Tautan edit tidak valid.'], 403);
        }
        return response()->json([
            'success' => true,
            'data' => [
                'edit_response' => $editResponse ? ['answers' => $editResponse->answers->mapWithKeys(fn ($a) => [$a->question_id => (is_array(json_decode($a->answer_value, true)) ? json_decode($a->answer_value, true) : $a->answer_value)])] : null,
                'code' => $survey->code,
                'title' => $survey->title,
                'description' => $survey->description,
                'is_active' => app(SurveyFlow::class)->isOpen($survey),
                'settings' => \Illuminate\Support\Arr::except($survey->settings ?? [], ['collect_email', 'limit_one', 'send_receipt', 'notify_owner']),
                'questions' => $survey->questions->map(function ($q) {
                    $validation = $q->validation ?? [];
                    $type = $q->type;
                    if (in_array($type, ['email', 'phone'], true)) {
                        $validation['answer_type'] = $type;
                        $type = 'short';
                    }
                    return [
                        'id' => $q->id,
                        'order' => $q->order,
                        'text' => $q->text,
                        'type' => $type,
                        'is_required' => $q->is_required,
                        'options' => $q->options ?? [],
                        'image_url' => $q->image_url,
                        'validation' => $validation,
                        'config' => array_diff_key($q->config ?? [], array_flip(['correct_answers', 'feedback'])),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Submit responses to the public survey.
     */
    // FIX: submit hanya punya 2 return; pemeriksaan awal dipindah ke preflightResponse
    public function submit(Request $request, $code)
    {
        $survey = Survey::with('questions')
            ->where('code', $code)
            ->where('is_published', true)
            ->first();

        $answers = $request->input('answers', []);

        $error = $this->preflightResponse($survey, $answers);
        if ($error) {
            return $error;
        }

        $request->validate(['edit_token' => 'nullable|string|size:64']);
        return $this->storeAnswers($survey, $answers, $request);
    }

    /**
     * Semua pemeriksaan sebelum menyimpan: kuesioner tersedia, bentuk "answers" benar,
     * dan setiap jawaban valid. Mengembalikan respons error, atau null kalau lolos.
     */
    private function preflightResponse(?Survey $survey, $answers)
    {
        $unavailable = $this->unavailableResponse($survey);
        if ($unavailable) {
            return $unavailable;
        }

        // "answers" harus array, kalau tidak, type hint array di bawah melempar error 500
        if (!is_array($answers)) {
            return response()->json(['success' => false, 'message' => 'Format jawaban tidak valid.'], 422);
        }

        return $this->validateAnswers($survey, $answers);
    }

    /**
     * Respons error kalau kuesioner tidak ada atau sedang ditutup, null kalau boleh diisi.
     */
    private function unavailableResponse(?Survey $survey)
    {
        if (!$survey) {
            return response()->json(['success' => false, 'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.'], 404);
        }
        if (!app(SurveyFlow::class)->isOpen($survey)) {
            return response()->json(['success' => false, 'message' => 'Kuesioner ini sedang ditutup dan tidak menerima jawaban baru.'], 422);
        }

        return null;
    }

    private function validateAnswers(Survey $survey, array $answers)
    {
        foreach (app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers) as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) continue;
            $answer = $answers[$question->id] ?? null;
            $error = $this->validateAnswer($question, $answer, $survey);
            if ($error !== null) {
                return response()->json(['success' => false, 'message' => $question->validation['error_message'] ?? $error, 'errors' => [$question->id => $question->validation['error_message'] ?? $error]], 422);
            }
        }

        return null;
    }

    private function validateAnswer(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        if ($this->isEmptyAnswer($answer)) {
            if (in_array($question->type, ['grid', 'check_grid'], true) && !empty($question->config['require_rows'])) return 'Isi setiap baris tabel.';
            return $question->is_required ? 'Pertanyaan ini wajib diisi.' : null;
        }

        // Urutan pemeriksaan: bentuk data -> pola SQL injection -> aturan per tipe
        return app(SurveyFlow::class)->validateExtended($question, $answer)
            ?? $this->validateShape($question, $answer)
            ?? $this->validateInjection($question, $answer)
            ?? $this->validateByType($question, $answer, $survey);
    }

    private function validateByType(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        $rules = $question->validation ?? [];

        if ($question->type === 'file') {
            $files = array_is_list($answer) ? $answer : [$answer];
            if (count($files) > ($question->config['file_max_files'] ?? 1)) return 'Jumlah file melebihi batas.';
            foreach ($files as $file) {
                if (!$this->isSurveyUpload($file, $survey)) return 'Unggah berkas yang valid.';
                $prefix = asset('storage/') . '/';
                $path = substr($file['url'], strlen($prefix));
                if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) return 'Berkas tidak ditemukan.';
                if (\Illuminate\Support\Facades\Storage::disk('public')->size($path) > ($question->config['file_max_mb'] ?? 10) * 1024 * 1024) return 'Ukuran berkas melebihi batas.';
            }
        }
        if (in_array($question->type, ['short', 'para'], true)) {
            return $this->validateTextAnswer($question, $answer, $rules);
        }
        if ($question->type === 'check') {
            return $this->validateCheckAnswer($question, $answer, $rules);
        }

        return $this->validateOtherAnswer($question, $answer, $survey);
    }

    /**
     * Pastikan bentuk jawaban sesuai tipe. Sebelumnya jawaban teks berbentuk array
     * bisa lolos tanpa pemeriksaan apa pun, lalu disimpan sebagai JSON.
     */
    private function validateShape(SurveyQuestion $question, $answer): ?string
    {
        $expectsArray = in_array($question->type, ['check', 'file', 'grid', 'check_grid'], true);
        if ($expectsArray !== is_array($answer)) {
            return 'Format jawaban tidak valid.';
        }

        if ($question->type === 'check' && array_filter($answer, fn ($item) => !is_string($item))) {
            return 'Pilihan jawaban tidak valid.';
        }

        return null;
    }

    /**
     * Tolak jawaban teks (dan nama file) yang cocok dengan pola SQL injection.
     * Pilihan ganda, dropdown, kotak centang, dan skala sudah dibatasi whitelist/angka.
     */
    private function validateInjection(SurveyQuestion $question, $answer): ?string
    {
        $value = match ($question->type) {
            'short', 'para', 'email', 'phone' => $answer,
            'file' => $answer['name'] ?? '',
            default => null,
        };

        if (!is_string($value)) {
            return null;
        }

        foreach (self::SQLI_PATTERNS as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                // Isi jawaban sengaja tidak dicatat di log
                Log::warning('Survey answer blocked by SQLi pattern filter', [
                    'question_id' => $question->id,
                    'pattern' => $pattern,
                ]);

                return 'Jawaban mengandung pola yang tidak diizinkan.';
            }
        }

        return null;
    }

    private function isEmptyAnswer($answer): bool
    {
        return $answer === null || $answer === '' || (is_array($answer) && count($answer) === 0);
    }

    private function validateTextAnswer(SurveyQuestion $question, string $answer, array $rules): ?string
    {
        $length = mb_strlen(trim($answer));
        if (isset($rules['min_length']) && $length < $rules['min_length']) {
            return 'Jawaban terlalu pendek (minimal ' . $rules['min_length'] . ' karakter).';
        }
        if (isset($rules['max_length']) && $length > $rules['max_length']) {
            return 'Jawaban terlalu panjang (maksimal ' . $rules['max_length'] . ' karakter).';
        }

        $type = $question->type === 'short' ? ($rules['answer_type'] ?? 'text') : $question->type;
        return match ($type) {
            'email' => filter_var($answer, FILTER_VALIDATE_EMAIL) ? null : 'Masukkan alamat email yang valid.',
            'phone' => $this->isValidPhone($answer) ? null : 'Masukkan nomor telepon yang valid (7–15 digit).',
            'number' => is_numeric(str_replace(',', '.', $answer)) ? null : 'Masukkan angka yang valid.',
            'text_number' => preg_match('/^[\p{L}\p{N}\s.,\'-]+$/u', $answer) ? null : 'Gunakan huruf dan angka saja.',
            default => null,
        };
    }

    private function validateCheckAnswer(SurveyQuestion $question, array $answer, array $rules): ?string
    {
        if (isset($rules['min_selections']) && count($answer) < $rules['min_selections']) {
            return 'Pilih minimal ' . $rules['min_selections'] . ' opsi.';
        }
        if (isset($rules['max_selections']) && count($answer) > $rules['max_selections']) {
            return 'Pilih maksimal ' . $rules['max_selections'] . ' opsi.';
        }

        if (count($answer) !== count(array_unique($answer))) return 'Pilihan tidak boleh berulang.';
        return array_filter($answer, fn ($value) => !$this->allowedChoice($question, $value)) ? 'Pilihan jawaban tidak valid.' : null;
    }

    private function validateOtherAnswer(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        return match (true) {
            in_array($question->type, ['choice', 'drop'], true) && !$this->allowedChoice($question, $answer) => 'Silakan pilih opsi yang tersedia.',
            $question->type === 'email' && (!is_string($answer) || !filter_var($answer, FILTER_VALIDATE_EMAIL)) => 'Masukkan alamat email yang valid.',
            $question->type === 'phone' && (!is_string($answer) || !$this->isValidPhone($answer)) => 'Masukkan nomor telepon yang valid (7–15 digit).',
            $question->type === 'file' && !$this->isSurveyUpload($answer, $survey) => 'Unggah berkas yang valid.',
            $question->type === 'scale' && (filter_var($answer, FILTER_VALIDATE_INT) === false || (int) $answer < 1 || (int) $answer > 5) => 'Pilih nilai skala antara 1 dan 5.',
            default => null,
        };
    }

    private function allowedChoice(SurveyQuestion $q, mixed $answer): bool
    {
        return is_string($answer) && (in_array($answer, $q->options ?? [], true) || (!empty($q->config['allow_other']) && str_starts_with($answer, 'Lainnya: ') && mb_strlen(trim(substr($answer, 9))) > 0 && mb_strlen($answer) <= 2000));
    }

    private function isValidPhone(string $answer): bool
    {
        $digits = preg_replace('/\D/', '', $answer);
        return preg_match('/^\+?[0-9() .-]{7,20}$/', $answer) === 1 && strlen($digits) >= 7 && strlen($digits) <= 15;
    }

    private function isSurveyUpload($answer, Survey $survey): bool
    {
        if (is_array($answer) && array_is_list($answer)) {
            return count($answer) > 0 && count($answer) <= 10 && count(array_filter($answer, fn ($file) => $this->isSurveyUpload($file, $survey))) === count($answer);
        }
        // url dan name harus string (sebelumnya bisa array dan memicu error)
        return is_array($answer)
            && !empty($answer['url']) && is_string($answer['url'])
            && !empty($answer['name']) && is_string($answer['name'])
            && !str_contains($answer['url'], '..') && !str_contains($answer['url'], '%')
            && str_starts_with($answer['url'], asset('storage/surveys/' . $survey->code . '/responses/'));
    }

    private function storeAnswers(Survey $survey, array $answers, Request $request)
    {
        return DB::transaction(function () use ($survey, $answers, $request) {
            // Serialize submissions per survey to enforce the capacity even under concurrent requests.
            $survey = Survey::whereKey($survey->id)->lockForUpdate()->firstOrFail();
            if (!app(SurveyFlow::class)->isOpen($survey)) return response()->json(['message' => 'Kuesioner sudah ditutup.'], 422);
            $response = null;
            if ($request->filled('edit_token')) {
                if (empty($survey->settings['allow_edit'])) return response()->json(['message' => 'Perubahan jawaban tidak diizinkan.'], 403);
                $response = $survey->responses()->where('edit_token', $request->input('edit_token'))->first();
                if (!$response) return response()->json(['message' => 'Tautan edit tidak valid.'], 403);
            }
            if ($response) $response->answers()->delete();
            [$score, $maxScore] = app(SurveyFlow::class)->grade(app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers), $answers);
            $response ??= new SurveyResponse(['survey_id' => $survey->id, 'edit_token' => Str::random(64)]);
            $response->fill([
                'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
                'dedup_key' => null,
                'score' => !empty($survey->settings['quiz']) ? $score : null,
                'max_score' => !empty($survey->settings['quiz']) ? $maxScore : null,
            ])->save();

            foreach (app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers) as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) continue;
                if (!isset($answers[$question->id])) {
                    continue;
                }
                $value = $answers[$question->id];
                SurveyAnswer::create([
                    'response_id' => $response->id,
                    'question_id' => $question->id,
                    'answer_value' => is_array($value) ? json_encode($value) : (string) $value,
                ]);
            }

            $feedback = [];
            if (!empty($survey->settings['quiz']) && !empty($survey->settings['show_feedback'])) {
                foreach (app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers) as $q) {
                    if (!empty($q->config['correct_answers'])) $feedback[] = ['question' => strip_tags($q->text), 'correct_answers' => $q->config['correct_answers'], 'feedback' => $q->config['feedback'] ?? ''];
                }
            }
            $summary = [];
            if (!empty($survey->settings['show_summary'])) {
                // Read only this saved response; public receipts never contain other respondents' results.
                $stored = $response->answers()->get()->keyBy('question_id');
                $summary = app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers)
                    ->reject(fn ($q) => in_array($q->type, SurveyFlow::CONTENT_TYPES, true))
                    ->map(function ($q) use ($stored) {
                        $value = $stored->get($q->id)?->answer_value;
                        if ($value !== null && in_array($q->type, ['check', 'grid', 'check_grid', 'file'], true)) $value = json_decode($value, true);
                        return ['question_id' => $q->id, 'text' => $q->text, 'type' => $q->type, 'answer' => $value, 'options' => $q->type === 'scale' ? $q->options : []];
                    })->values();
            }
            return response()->json(['success' => true, 'message' => $survey->settings['confirmation_message'] ?? 'Terima kasih! Jawaban Anda sudah kami terima.', 'data' => [
                'feedback' => $feedback, 'summary' => $summary,
                'edit_token' => !empty($survey->settings['allow_edit']) ? $response->edit_token : null,
                'score' => !empty($survey->settings['show_score']) && !empty($survey->settings['quiz']) ? $response->score : null,
                'max_score' => !empty($survey->settings['show_score']) && !empty($survey->settings['quiz']) ? $response->max_score : null,
            ]]);
        });
    }

    public function upload(Request $request, $code)
    {
        $survey = Survey::where('code', $code)->where('is_published', true)->where('is_active', true)->firstOrFail();
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:survey_questions,id',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv|max:51200',
        ]);

        // Pastikan pertanyaan milik survei ini dan bertipe file (404 kalau tidak cocok)
        $question = $survey->questions()->where('id', $validated['question_id'])->where('type', 'file')->firstOrFail();
        if (!app(SurveyFlow::class)->isOpen($survey)) return response()->json(['message' => 'Kuesioner sudah ditutup.'], 422);
        $maxKb = ($question->config['file_max_mb'] ?? 10) * 1024;
        $types = $question->config['file_types'] ?? 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv';
        $types = str_replace(['.', ' '], '', $types);
        $request->validate(['file' => 'required|file|max:' . $maxKb . '|mimes:' . $types]);

        $file = $request->file('file');
        $path = $file->store('surveys/' . $code . '/responses', 'public');
        return response()->json(['success' => true, 'data' => [
            'name' => $file->getClientOriginalName(),
            'url' => asset('storage/' . $path),
            'size' => $file->getSize(),
        ]]);
    }
}
