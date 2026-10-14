<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveyController extends Controller
{
    /**
     * Display the specified public survey by code.
     */
    public function show($code)
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

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $survey->code,
                'title' => $survey->title,
                'description' => $survey->description,
                'is_active' => $survey->is_active,
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
                    ];
                }),
            ],
        ]);
    }

    /**
     * Submit responses to the public survey.
     */
    public function submit(Request $request, $code)
    {
        $survey = Survey::with('questions')
            ->where('code', $code)
            ->where('is_published', true)
            ->first();
        if (!$survey) {
            return response()->json(['success' => false, 'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.'], 404);
        }
        if (!$survey->is_active) {
            return response()->json(['success' => false, 'message' => 'Kuesioner ini sedang ditutup dan tidak menerima jawaban baru.'], 422);
        }

        $answers = $request->input('answers', []);
        $validationResponse = $this->validateAnswers($survey, $answers);
        if ($validationResponse) {
            return $validationResponse;
        }

        return $this->storeAnswers($survey, $answers, $request);
    }

    private function validateAnswers(Survey $survey, array $answers)
    {
        foreach ($survey->questions as $question) {
            $answer = $answers[$question->id] ?? null;
            $error = $this->validateAnswer($question, $answer, $survey);
            if ($error !== null) {
                return response()->json(['success' => false, 'message' => $error, 'errors' => [$question->id => $error]], 422);
            }
        }

        return null;
    }

    private function validateAnswer(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        $error = null;
        if ($this->isEmptyAnswer($answer)) {
            $error = $question->is_required ? 'Pertanyaan ini wajib diisi.' : null;
        } else {
            $rules = $question->validation ?? [];
            if (in_array($question->type, ['short', 'para'], true) && is_string($answer)) {
                $error = $this->validateTextAnswer($question, $answer, $rules);
            } elseif ($question->type === 'check' && is_array($answer)) {
                $error = $this->validateCheckAnswer($question, $answer, $rules);
            } else {
                $error = $this->validateOtherAnswer($question, $answer, $survey);
            }
        }

        return $error;
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

        return array_diff($answer, $question->options ?? []) ? 'Pilihan jawaban tidak valid.' : null;
    }

    private function validateOtherAnswer(SurveyQuestion $question, $answer, Survey $survey): ?string
    {
        return match (true) {
            in_array($question->type, ['choice', 'drop'], true) && !in_array($answer, $question->options ?? [], true) => 'Silakan pilih opsi yang tersedia.',
            $question->type === 'email' && (!is_string($answer) || !filter_var($answer, FILTER_VALIDATE_EMAIL)) => 'Masukkan alamat email yang valid.',
            $question->type === 'phone' && (!is_string($answer) || !$this->isValidPhone($answer)) => 'Masukkan nomor telepon yang valid (7–15 digit).',
            $question->type === 'file' && !$this->isSurveyUpload($answer, $survey) => 'Unggah berkas yang valid.',
            $question->type === 'scale' && (!is_numeric($answer) || (int) $answer < 1 || (int) $answer > 5) => 'Pilih nilai skala antara 1 dan 5.',
            default => null,
        };
    }

    private function isValidPhone(string $answer): bool
    {
        $digits = preg_replace('/\D/', '', $answer);
        return preg_match('/^\+?[0-9() .-]{7,20}$/', $answer) === 1 && strlen($digits) >= 7 && strlen($digits) <= 15;
    }

    private function isSurveyUpload($answer, Survey $survey): bool
    {
        return is_array($answer) && !empty($answer['url']) && !empty($answer['name'])
            && str_starts_with($answer['url'], asset('storage/surveys/' . $survey->code . '/responses/'));
    }

    private function storeAnswers(Survey $survey, array $answers, Request $request)
    {
        return DB::transaction(function () use ($survey, $answers, $request) {
            $response = SurveyResponse::create([
                'survey_id' => $survey->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            foreach ($survey->questions as $question) {
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

            return response()->json(['success' => true, 'message' => 'Terima kasih! Jawaban Anda sudah kami terima.']);
        });
    }

    public function upload(Request $request, $code)
    {
        $survey = Survey::where('code', $code)->where('is_published', true)->where('is_active', true)->firstOrFail();
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:survey_questions,id',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv|max:1024',
        ]);
        $question = $survey->questions()->where('id', $validated['question_id'])->where('type', 'file')->firstOrFail();
        $file = $request->file('file');
        $path = $file->store('surveys/' . $code . '/responses', 'public');
        return response()->json(['success' => true, 'data' => [
            'name' => $file->getClientOriginalName(),
            'url' => asset('storage/' . $path),
            'size' => $file->getSize(),
        ]]);
    }
}
