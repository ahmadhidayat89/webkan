<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyAnswer;
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
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner tidak ditemukan atau belum diterbitkan.',
            ], 404);
        }

        if (!$survey->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Kuesioner ini sedang ditutup dan tidak menerima jawaban baru.',
            ], 422);
        }

        $answersInput = $request->input('answers', []);

        // Validate required questions and configured response constraints.
        foreach ($survey->questions as $q) {
            $ans = $answersInput[$q->id] ?? null;
            $rules = $q->validation ?? [];
            $error = null;
            if ($q->is_required) {
                $isEmpty = false;

                if ($ans === null || $ans === '') {
                    $isEmpty = true;
                } elseif (is_array($ans) && count($ans) === 0) {
                    $isEmpty = true;
                }

                if ($isEmpty) {
                    $error = 'Pertanyaan ini wajib diisi.';
                }
            }
            if ($error === null && $ans !== null && $ans !== '') {
                if (in_array($q->type, ['short', 'para'], true) && is_string($ans)) {
                    $length = mb_strlen(trim($ans));
                    if (isset($rules['min_length']) && $length < $rules['min_length']) $error = 'Jawaban terlalu pendek (minimal ' . $rules['min_length'] . ' karakter).';
                    if ($error === null && isset($rules['max_length']) && $length > $rules['max_length']) $error = 'Jawaban terlalu panjang (maksimal ' . $rules['max_length'] . ' karakter).';
                    $answerType = $q->type === 'short' ? ($rules['answer_type'] ?? 'text') : $q->type;
                    if ($error === null && $answerType === 'email' && !filter_var($ans, FILTER_VALIDATE_EMAIL)) $error = 'Masukkan alamat email yang valid.';
                    if ($error === null && $answerType === 'phone' && (!preg_match('/^\+?[0-9() .-]{7,20}$/', $ans) || strlen(preg_replace('/\D/', '', $ans)) < 7 || strlen(preg_replace('/\D/', '', $ans)) > 15)) $error = 'Masukkan nomor telepon yang valid (7–15 digit).';
                    if ($error === null && $answerType === 'number' && !is_numeric(str_replace(',', '.', $ans))) $error = 'Masukkan angka yang valid.';
                    if ($error === null && $answerType === 'text_number' && !preg_match('/^[\p{L}\p{N}\s.,\'-]+$/u', $ans)) $error = 'Gunakan huruf dan angka saja.';
                } elseif ($q->type === 'check' && is_array($ans)) {
                    if (isset($rules['min_selections']) && count($ans) < $rules['min_selections']) $error = 'Pilih minimal ' . $rules['min_selections'] . ' opsi.';
                    if ($error === null && isset($rules['max_selections']) && count($ans) > $rules['max_selections']) $error = 'Pilih maksimal ' . $rules['max_selections'] . ' opsi.';
                    if ($error === null && array_diff($ans, $q->options ?? [])) $error = 'Pilihan jawaban tidak valid.';
                } elseif (in_array($q->type, ['choice', 'drop'], true) && !in_array($ans, $q->options ?? [], true)) {
                    $error = 'Silakan pilih opsi yang tersedia.';
                } elseif ($q->type === 'email' && (!is_string($ans) || !filter_var($ans, FILTER_VALIDATE_EMAIL))) {
                    $error = 'Masukkan alamat email yang valid.';
                } elseif ($q->type === 'phone' && (!is_string($ans) || !preg_match('/^\+?[0-9() .-]{7,20}$/', $ans) || strlen(preg_replace('/\D/', '', $ans)) < 7 || strlen(preg_replace('/\D/', '', $ans)) > 15)) {
                    $error = 'Masukkan nomor telepon yang valid (7–15 digit).';
                } elseif ($q->type === 'file' && (!is_array($ans) || empty($ans['url']) || empty($ans['name']) || !str_starts_with($ans['url'], asset('storage/surveys/' . $survey->code . '/responses/')))) {
                    $error = 'Unggah berkas yang valid.';
                } elseif ($q->type === 'scale' && (!is_numeric($ans) || (int) $ans < 1 || (int) $ans > 5)) {
                    $error = 'Pilih nilai skala antara 1 dan 5.';
                }
            }
            if ($error !== null) {
                return response()->json(['success' => false, 'message' => $error, 'errors' => [$q->id => $error]], 422);
            }
        }

        return DB::transaction(function () use ($survey, $answersInput, $request) {
            $response = SurveyResponse::create([
                'survey_id' => $survey->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            foreach ($survey->questions as $q) {
                if (isset($answersInput[$q->id])) {
                    $val = $answersInput[$q->id];
                    $storedVal = is_array($val) ? json_encode($val) : (string)$val;

                    SurveyAnswer::create([
                        'response_id' => $response->id,
                        'question_id' => $q->id,
                        'answer_value' => $storedVal,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Terima kasih! Jawaban Anda sudah kami terima.',
            ]);
        });
    }

    public function upload(Request $request, $code)
    {
        $survey = Survey::where('code', $code)->where('is_published', true)->where('is_active', true)->firstOrFail();
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:survey_questions,id',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,webp,txt,csv|max:10240',
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