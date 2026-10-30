<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyResponse;
use App\Services\Survey\SurveyAnswerValidator;
use App\Services\Survey\SurveyFlow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SurveyController extends Controller
{
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

        if (! $survey) {
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.',
            ], 404);
        }

        $editResponse = $this->publicEditResponse($survey, $request);
        if ($editResponse instanceof JsonResponse) {
            return $editResponse;
        }
        $editData = null;
        if ($editResponse) {
            $editData = ['answers' => $editResponse->answers->mapWithKeys(function ($answer) {
                $decoded = json_decode($answer->answer_value, true);
                $value = is_array($decoded) ? $decoded : $answer->answer_value;

                return [$answer->question_id => $value];
            })];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'edit_response' => $editData,
                'code' => $survey->code,
                'title' => $survey->title,
                'description' => $survey->description,
                'is_active' => app(SurveyFlow::class)->isOpen($survey),
                'settings' => Arr::except($survey->settings ?? [], ['collect_email', 'limit_one', 'send_receipt', 'notify_owner']),
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

    private function publicEditResponse(Survey $survey, Request $request): SurveyResponse|JsonResponse|null
    {
        if (! $request->filled('edit')) {
            return null;
        }
        if (empty($survey->settings['allow_edit'])) {
            return response()->json(['message' => 'Perubahan jawaban tidak diizinkan.'], 403);
        }
        $request->validate(['edit' => 'required|string|size:64']);
        $response = $survey->responses()->with('answers')->where('edit_token', $request->query('edit'))->first();

        return $response ?? response()->json(['message' => 'Tautan edit tidak valid.'], 403);
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
        if (! is_array($answers)) {
            return response()->json(['success' => false, 'message' => 'Format jawaban tidak valid.'], 422);
        }

        return $this->validateAnswers($survey, $answers);
    }

    /**
     * Respons error kalau kuesioner tidak ada atau sedang ditutup, null kalau boleh diisi.
     */
    private function unavailableResponse(?Survey $survey)
    {
        if (! $survey) {
            return response()->json(['success' => false, 'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.'], 404);
        }
        if (! app(SurveyFlow::class)->isOpen($survey)) {
            return response()->json(['success' => false, 'message' => 'Kuesioner ini sedang ditutup dan tidak menerima jawaban baru.'], 422);
        }

        return null;
    }

    private function validateAnswers(Survey $survey, array $answers)
    {
        foreach (app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers) as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true)) {
                continue;
            }
            $answer = $answers[$question->id] ?? null;
            $error = app(SurveyAnswerValidator::class)->validate($question, $answer, $survey);
            if ($error !== null) {
                return response()->json(['success' => false, 'message' => $question->validation['error_message'] ?? $error, 'errors' => [$question->id => $question->validation['error_message'] ?? $error]], 422);
            }
        }

        return null;
    }

    private function storeAnswers(Survey $survey, array $answers, Request $request)
    {
        return DB::transaction(function () use ($survey, $answers, $request) {
            // Serialize submissions per survey to enforce capacity under concurrent requests.
            $survey = Survey::whereKey($survey->id)->lockForUpdate()->firstOrFail();
            if (! app(SurveyFlow::class)->isOpen($survey)) {
                return response()->json(['message' => 'Kuesioner sudah ditutup.'], 422);
            }
            $response = $this->editableResponse($survey, $request);
            if ($response instanceof JsonResponse) {
                return $response;
            }
            $questions = app(SurveyFlow::class)->visibleQuestions($survey->questions, $answers);
            $response = $this->persistResponse($survey, $response, $questions, $answers, $request);
            $this->persistQuestionAnswers($response, $questions, $answers);

            return $this->submissionReceipt($survey, $response, $questions);
        });
    }

    private function editableResponse(Survey $survey, Request $request): SurveyResponse|JsonResponse|null
    {
        if (! $request->filled('edit_token')) {
            return null;
        }
        if (empty($survey->settings['allow_edit'])) {
            return response()->json(['message' => 'Perubahan jawaban tidak diizinkan.'], 403);
        }
        $response = $survey->responses()->where('edit_token', $request->input('edit_token'))->first();

        return $response ?? response()->json(['message' => 'Tautan edit tidak valid.'], 403);
    }

    private function persistResponse(Survey $survey, ?SurveyResponse $response, Collection $questions, array $answers, Request $request): SurveyResponse
    {
        if ($response) {
            $response->answers()->delete();
        }
        [$score, $maxScore] = app(SurveyFlow::class)->grade($questions, $answers);
        $response ??= new SurveyResponse(['survey_id' => $survey->id, 'edit_token' => Str::random(64)]);
        $response->fill([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'dedup_key' => null,
            'score' => ! empty($survey->settings['quiz']) ? $score : null,
            'max_score' => ! empty($survey->settings['quiz']) ? $maxScore : null,
        ])->save();

        return $response;
    }

    private function persistQuestionAnswers(SurveyResponse $response, Collection $questions, array $answers): void
    {
        foreach ($questions as $question) {
            if (in_array($question->type, SurveyFlow::CONTENT_TYPES, true) || ! isset($answers[$question->id])) {
                continue;
            }
            $value = $answers[$question->id];
            SurveyAnswer::create([
                'response_id' => $response->id,
                'question_id' => $question->id,
                'answer_value' => is_array($value) ? json_encode($value) : (string) $value,
            ]);
        }
    }

    private function submissionFeedback(Survey $survey, Collection $questions): array
    {
        if (empty($survey->settings['quiz']) || empty($survey->settings['show_feedback'])) {
            return [];
        }
        $feedback = [];
        foreach ($questions as $question) {
            if (! empty($question->config['correct_answers'])) {
                $feedback[] = [
                    'question' => strip_tags($question->text),
                    'correct_answers' => $question->config['correct_answers'],
                    'feedback' => $question->config['feedback'] ?? '',
                ];
            }
        }

        return $feedback;
    }

    private function submissionSummary(Survey $survey, SurveyResponse $response, Collection $questions): Collection|array
    {
        if (empty($survey->settings['show_summary'])) {
            return [];
        }
        // Only this response is read; public receipts never contain other respondents' results.
        $stored = $response->answers()->get()->keyBy('question_id');

        return $questions
            ->reject(fn ($q) => in_array($q->type, SurveyFlow::CONTENT_TYPES, true))
            ->map(function ($q) use ($stored) {
                $value = $stored->get($q->id)?->answer_value;
                if ($value !== null && in_array($q->type, ['check', 'grid', 'check_grid', 'file'], true)) {
                    $value = json_decode($value, true);
                }

                return ['question_id' => $q->id, 'text' => $q->text, 'type' => $q->type, 'answer' => $value, 'options' => $q->type === 'scale' ? $q->options : []];
            })->values();
    }

    private function submissionReceipt(Survey $survey, SurveyResponse $response, Collection $questions): JsonResponse
    {
        $showScore = ! empty($survey->settings['show_score']) && ! empty($survey->settings['quiz']);

        return response()->json([
            'success' => true,
            'message' => $survey->settings['confirmation_message'] ?? 'Terima kasih! Jawaban Anda sudah kami terima.',
            'data' => [
                'feedback' => $this->submissionFeedback($survey, $questions),
                'summary' => $this->submissionSummary($survey, $response, $questions),
                'edit_token' => ! empty($survey->settings['allow_edit']) ? $response->edit_token : null,
                'score' => $showScore ? $response->score : null,
                'max_score' => $showScore ? $response->max_score : null,
            ],
        ]);
    }

    public function upload(Request $request, $code)
    {
        $survey = Survey::where('code', $code)->where('is_published', true)->where('is_active', true)->firstOrFail();
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:survey_questions,id',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv|max:8000',
        ]);

        // Pastikan pertanyaan milik survei ini dan bertipe file (404 kalau tidak cocok)
        $question = $survey->questions()->where('id', $validated['question_id'])->where('type', 'file')->firstOrFail();
        if (! app(SurveyFlow::class)->isOpen($survey)) {
            return response()->json(['message' => 'Kuesioner sudah ditutup.'], 422);
        }
        $maxKb = ($question->config['file_max_mb'] ?? 10) * 1024;
        $types = $question->config['file_types'] ?? 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv';
        $types = str_replace(['.', ' '], '', $types);
        $request->validate(['file' => 'required|file|max:'.$maxKb.'|mimes:'.$types]);

        $file = $request->file('file');
        $path = $file->store('surveys/'.$code.'/responses', 'public');

        return response()->json(['success' => true, 'data' => [
            'name' => $file->getClientOriginalName(),
            'url' => asset('storage/'.$path),
            'size' => $file->getSize(),
        ]]);
    }
}
