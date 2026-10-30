<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Services\Survey\SurveyContentSanitizer;
use App\Services\Survey\SurveyCsvExporter;
use App\Services\Survey\SurveyResultsBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    // FIX: literal regex warna sebelumnya diulang 4 kali
    private const HEX_COLOR_RULE = 'regex:/^#[0-9a-fA-F]{6}$/';

    public function __construct(
        private SurveyContentSanitizer $sanitizer,
        private SurveyResultsBuilder $results,
        private SurveyCsvExporter $csvExporter,
    ) {
    }

    /**
     * Display a listing of surveys with statistics.
     */
    public function index()
    {
        $surveys = Survey::with('questions')
            ->withCount(['questions', 'responses'])
            ->orderBy('id', 'desc')
            ->get();

        $stats = [
            'total' => $surveys->count(),
            'active' => $surveys->where('is_published', true)->where('is_active', true)->count(),
            'responses' => $surveys->sum('responses_count'),
        ];

        return response()->json([
            'success' => true,
            'data' => $surveys,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created survey in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate($this->surveyRules());

        return DB::transaction(function () use ($validated, $request) {
            $code = $this->generateUniqueCode();

            $survey = Survey::create([
                'code' => $code,
                'title' => $validated['title'],
                'description' => $this->sanitizer->sanitizeRichText($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()?->id,
                'settings' => \Illuminate\Support\Arr::except($validated['settings'] ?? [], ['collect_email', 'limit_one', 'send_receipt', 'notify_owner']),
            ]);

            if (!empty($validated['questions'])) {
                foreach ($validated['questions'] as $index => $qData) {
                    SurveyQuestion::create(
                        ['survey_id' => $survey->id] + $this->questionAttributes($qData, $index)
                    );
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Kuesioner berhasil dibuat.',
                'data' => $survey->load('questions'),
            ], 201);
        });
    }

    /**
     * Display the specified survey with full results and response analytics.
     */
    public function show($id)
    {
        $survey = Survey::with(['questions' => function ($q) {
            $q->orderBy('order', 'asc');
        }])->findOrFail($id);

        $responses = SurveyResponse::with('answers')
            ->where('survey_id', $survey->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalResponses = $responses->count();
        $lastResponse = $responses->first()?->created_at?->copy()->timezone('Asia/Jakarta');

        $summary = $this->results->summarize($survey->questions, $responses);
        $averageScale = $summary['average_scale'];

        // Prepare respondent rows for table display
        $respondentRows = $responses->map(fn ($response) => $this->results->formatRespondent($response));

        return response()->json([
            'success' => true,
            'data' => [
                'survey' => $survey,
                'stats' => [
                    'total_responses' => $totalResponses,
                    'average_scale' => $averageScale ? $averageScale . ' / 5' : '-',
                    'last_response_at' => $lastResponse ? $lastResponse->format('d/m/Y') : '-',
                    'last_response_time' => $lastResponse
                        ? $lastResponse->format(SurveyResultsBuilder::DISPLAY_DATE_TIME_FORMAT)
                        : '-',
                ],
                'summary' => $summary['questions'],
                'responses' => $respondentRows,
            ],
        ]);
    }

    /**
     * Update the specified survey in storage.
     */
    public function update(Request $request, $id)
    {
        $survey = Survey::findOrFail($id);

        // Aturan sama dengan store(), ditambah validasi id pertanyaan milik survei ini
        $rules = $this->surveyRules();
        $rules['questions.*.id'] = [
            'nullable',
            'integer',
            'distinct',
            Rule::exists('survey_questions', 'id')
                ->where(fn ($query) => $query->where('survey_id', $survey->id)),
        ];

        $validated = $request->validate($rules);

        return DB::transaction(function () use ($validated, $survey) {
            $survey->update([
                'title' => $validated['title'],
                'description' => $this->sanitizer->sanitizeRichText($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? $survey->is_published,
                'is_active' => $validated['is_active'] ?? $survey->is_active,
                'settings' => \Illuminate\Support\Arr::except($validated['settings'] ?? $survey->settings ?? [], ['collect_email', 'limit_one', 'send_receipt', 'notify_owner']),
            ]);

            if (isset($validated['questions'])) {
                $this->syncQuestions($survey, $validated['questions']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kuesioner berhasil diperbarui.',
                'data' => $survey->load('questions'),
            ]);
        });
    }

    /**
     * Remove the specified survey from storage.
     */
    public function grade(Request $request, $id, $responseId)
    {
        $survey = Survey::findOrFail($id);
        abort_unless(!empty($survey->settings['quiz']), 422, 'Kuesioner ini bukan kuis.');
        $validated = $request->validate(['score' => 'required|integer|min:0|max:1000000', 'max_score' => 'required|integer|min:0|max:1000000|gte:score']);
        $response = $survey->responses()->findOrFail($responseId);
        $response->update($validated);
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $survey = Survey::findOrFail($id);
        $survey->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kuesioner berhasil dihapus.',
        ]);
    }

    public function uploadImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:5120']);
        $path = $request->file('image')->store('surveys/questions', 'public');
        return response()->json(['success' => true, 'data' => ['url' => asset('storage/' . $path)]]);
    }

    /**
     * Publish survey.
     */
    public function publish($id)
    {
        $survey = Survey::findOrFail($id);
        if (empty($survey->code)) {
            $survey->code = $this->generateUniqueCode();
        }
        $survey->is_published = true;
        $survey->is_active = true;
        $survey->save();

        return response()->json([
            'success' => true,
            'message' => 'Kuesioner berhasil diterbitkan.',
            'data' => $survey,
        ]);
    }

    /**
     * Toggle active/closed status.
     */
    public function toggleActive($id)
    {
        $survey = Survey::findOrFail($id);
        $survey->is_active = !$survey->is_active;
        $survey->save();

        return response()->json([
            'success' => true,
            'message' => $survey->is_active ? 'Kuesioner diaktifkan kembali.' : 'Kuesioner telah ditutup.',
            'data' => $survey,
        ]);
    }

    /**
     * Export all responses to CSV.
     */
    public function exportCsv($id)
    {
        $survey = Survey::with(['questions' => function ($q) {
            $q->orderBy('order', 'asc');
        }])->findOrFail($id);

        $responses = SurveyResponse::with('answers')
            ->where('survey_id', $survey->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="hasil-kuesioner-' . $survey->code . '.csv"',
        ];

        $callback = fn () => $this->csvExporter->write($survey, $responses);

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Aturan validasi kuesioner, dipakai bersama oleh store() dan update().
     */
    private function surveyRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'settings.confirmation_message' => 'nullable|string|max:2000',
            'settings.closed_message' => 'nullable|string|max:2000',
            'settings.allow_edit' => 'boolean',
            'settings.save_draft' => 'boolean',
            'settings.show_progress' => 'boolean',
            'settings.shuffle_questions' => 'boolean',
            'settings.quiz' => 'boolean',
            'settings.show_score' => 'boolean',
            'settings.show_feedback' => 'boolean',
            'settings.show_summary' => 'boolean',
            'settings.closes_at' => 'nullable|date',
            'settings.response_limit' => 'nullable|integer|min:1|max:500000',
            'settings.theme_color' => ['nullable', self::HEX_COLOR_RULE],
            'settings.header_image' => 'nullable|url:http,https|max:2048',
            'settings.font' => 'nullable|in:system,serif',
            'settings.required_default' => 'boolean',
            'settings.submit_another' => 'boolean',
            'settings.background_color' => ['nullable', self::HEX_COLOR_RULE],
            'settings.title_size' => 'nullable|integer|min:20|max:40',
            'settings.question_size' => 'nullable|integer|min:14|max:24',
            'settings.body_size' => 'nullable|integer|min:12|max:20',
            'is_published' => 'boolean',
            'is_active' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:short,para,email,phone,file,choice,check,drop,scale,linear,rating,grid,check_grid,date,time,duration,section,heading,video,image',
            'questions.*.is_required' => 'boolean',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:255',
            'questions.*.image_url' => ['nullable', 'string', 'max:2048', function ($attribute, $value, $fail) {
                if ($value !== null && $value !== '' && !preg_match('#^(https?://|/storage/)#i', $value)) {
                    $fail('Gambar pertanyaan harus berupa unggahan lokal atau alamat HTTP/HTTPS.');
                }
            }],
            'questions.*.config' => 'nullable|array',
            'questions.*.config.key' => 'nullable|string|max:100',
            'questions.*.config.description' => 'nullable|string|max:2000',
            'questions.*.config.rows' => ['nullable', 'array', 'max:50', function ($attribute, $value, $fail) {
                if (count(array_filter($value, 'is_string')) === count($value) && count($value) !== count(array_unique($value))) {
                    $fail('Nama baris tabel tidak boleh sama dalam satu pertanyaan.');
                }
            }],
            'questions.*.config.rows.*' => 'required|string|max:255',
            'questions.*.config.min' => 'nullable|integer|min:0|max:1',
            'questions.*.config.max' => 'nullable|integer|min:2|max:10',
            'questions.*.config.min_label' => 'nullable|string|max:255',
            'questions.*.config.max_label' => 'nullable|string|max:255',
            'questions.*.config.icon' => 'nullable|in:star,heart,thumb',
            'questions.*.config.require_rows' => 'boolean',
            'questions.*.config.unique_columns' => 'boolean',
            'questions.*.config.shuffle_options' => 'boolean',
            'questions.*.config.shuffle_rows' => 'boolean',
            'questions.*.config.show_description' => 'boolean',
            'questions.*.config.show_validation' => 'boolean',
            'questions.*.config.show_branches' => 'boolean',
            'questions.*.config.branches' => 'nullable|array',
            'questions.*.config.branches.*' => 'nullable|string|max:100',
            'questions.*.config.video_url' => ['nullable', 'string', 'regex:~^https://(?:www\.)?(?:youtube\.com/watch\?|youtu\.be/)[a-zA-Z0-9_?=&-]+$~'],
            'questions.*.config.file_max_files' => 'nullable|integer|min:1|max:10',
            'questions.*.config.allow_other' => 'boolean',
            'questions.*.config.option_images' => 'nullable|array',
            'questions.*.config.option_images.*' => 'nullable|url:http,https|max:2048',
            'questions.*.config.file_max_mb' => 'nullable|integer|min:1|max:50',
            'questions.*.config.file_types' => 'nullable|string|max:255|regex:/^[a-z0-9,. ]+$/',
            'questions.*.config.points' => 'nullable|integer|min:0|max:1000',
            'questions.*.config.correct_answers' => 'nullable|array|max:100',
            'questions.*.config.correct_answers.*' => 'string|max:2000',
            'questions.*.config.feedback' => 'nullable|string|max:2000',
            'questions.*.validation' => 'nullable|array',
            'questions.*.validation.min_value' => 'nullable|numeric',
            'questions.*.validation.max_value' => 'nullable|numeric',
            'questions.*.validation.contains' => 'nullable|string|max:255',
            'questions.*.validation.pattern' => ['nullable', 'string', 'max:255', function ($attribute, $value, $fail) {
                if ($value && @preg_match('~' . str_replace('~', '\\~', $value) . '~u', '') === false) {
                    $fail('Pola validasi tidak valid.');
                }
            }],
            'questions.*.validation.error_message' => 'nullable|string|max:500',
            'questions.*.validation.answer_type' => 'nullable|in:text,email,phone,number,text_number',
            'questions.*.validation.min_length' => 'nullable|integer|min:0|max:10000',
            'questions.*.validation.max_length' => 'nullable|integer|min:1|max:10000',
            'questions.*.validation.min_selections' => 'nullable|integer|min:0|max:100',
            'questions.*.validation.max_selections' => 'nullable|integer|min:1|max:100',
        ];
    }

    /**
     * Atribut satu pertanyaan yang sudah dibersihkan, siap disimpan.
     */
    private function questionAttributes(array $qData, int $index): array
    {
        return [
            'order' => $index + 1,
            'text' => $this->sanitizer->cleanQuestionText($qData['text'], $index),
            'type' => $qData['type'],
            'is_required' => $qData['is_required'] ?? false,
            'options' => $this->sanitizer->cleanOptions($qData['type'], $qData['options'] ?? []),
            'image_url' => $qData['image_url'] ?? null,
            'validation' => $qData['validation'] ?? null,
            'config' => $qData['config'] ?? [],
        ];
    }

    /**
     * Simpan pertanyaan (buat baru / perbarui), lalu hapus yang tidak lagi dikirim.
     */
    private function syncQuestions(Survey $survey, array $questions): void
    {
        $retainedQuestionIds = [];

        foreach ($questions as $index => $qData) {
            $question = isset($qData['id'])
                ? $survey->questions()->findOrFail($qData['id'])
                : new SurveyQuestion(['survey_id' => $survey->id]);

            $question->fill($this->questionAttributes($qData, $index));
            $question->save();
            $retainedQuestionIds[] = $question->id;
        }

        $questionsToDelete = $survey->questions();
        if ($retainedQuestionIds) {
            $questionsToDelete->whereNotIn('id', $retainedQuestionIds);
        }
        $questionsToDelete->delete();
    }

    /**
     * Helper to generate unique 6-character random code.
     */
    private function generateUniqueCode()
    {
        do {
            $code = strtolower(Str::random(6));
        } while (Survey::where('code', $code)->exists());

        return $code;
    }
}
