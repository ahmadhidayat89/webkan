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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'is_active' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:short,para,email,phone,file,choice,check,drop,scale',
            'questions.*.is_required' => 'boolean',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:255',
            'questions.*.image_url' => ['nullable', 'string', 'max:2048', function ($attribute, $value, $fail) {
                if ($value !== null && $value !== '' && !preg_match('#^(https?://|/storage/)#i', $value)) {
                    $fail('Gambar pertanyaan harus berupa unggahan lokal atau alamat HTTP/HTTPS.');
                }
            }],
            'questions.*.validation' => 'nullable|array',
            'questions.*.validation.answer_type' => 'nullable|in:text,email,phone,number,text_number',
            'questions.*.validation.min_length' => 'nullable|integer|min:0|max:10000',
            'questions.*.validation.max_length' => 'nullable|integer|min:1|max:10000',
            'questions.*.validation.min_selections' => 'nullable|integer|min:0|max:100',
            'questions.*.validation.max_selections' => 'nullable|integer|min:1|max:100',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $code = $this->generateUniqueCode();

            $survey = Survey::create([
                'code' => $code,
                'title' => $validated['title'],
                'description' => $this->sanitizer->sanitizeRichText($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()?->id,
            ]);

            if (!empty($validated['questions'])) {
                foreach ($validated['questions'] as $index => $qData) {
                    SurveyQuestion::create([
                        'survey_id' => $survey->id,
                        'order' => $index + 1,
                        'text' => $this->sanitizer->cleanQuestionText($qData['text'], $index),
                        'type' => $qData['type'],
                        'is_required' => $qData['is_required'] ?? false,
                        'options' => $this->sanitizer->cleanOptions($qData['type'], $qData['options'] ?? []),
                        'image_url' => $qData['image_url'] ?? null,
                        'validation' => $qData['validation'] ?? null,
                    ]);
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
        $lastResponse = $responses->first()?->created_at;

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

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'is_active' => 'boolean',
            'questions' => 'nullable|array',
            'questions.*.id' => [
                'nullable',
                'integer',
                'distinct',
                Rule::exists('survey_questions', 'id')
                    ->where(fn ($query) => $query->where('survey_id', $survey->id)),
            ],
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:short,para,email,phone,file,choice,check,drop,scale',
            'questions.*.is_required' => 'boolean',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:255',
            'questions.*.image_url' => ['nullable', 'string', 'max:2048', function ($attribute, $value, $fail) {
                if ($value !== null && $value !== '' && !preg_match('#^(https?://|/storage/)#i', $value)) {
                    $fail('Gambar pertanyaan harus berupa unggahan lokal atau alamat HTTP/HTTPS.');
                }
            }],
            'questions.*.validation' => 'nullable|array',
            'questions.*.validation.answer_type' => 'nullable|in:text,email,phone,number,text_number',
            'questions.*.validation.min_length' => 'nullable|integer|min:0|max:10000',
            'questions.*.validation.max_length' => 'nullable|integer|min:1|max:10000',
            'questions.*.validation.min_selections' => 'nullable|integer|min:0|max:100',
            'questions.*.validation.max_selections' => 'nullable|integer|min:1|max:100',
        ]);

        return DB::transaction(function () use ($validated, $survey) {
            $survey->update([
                'title' => $validated['title'],
                'description' => $this->sanitizer->sanitizeRichText($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? $survey->is_published,
                'is_active' => $validated['is_active'] ?? $survey->is_active,
            ]);

            if (isset($validated['questions'])) {
                $retainedQuestionIds = [];

                foreach ($validated['questions'] as $index => $qData) {
                    $question = isset($qData['id'])
                        ? $survey->questions()->findOrFail($qData['id'])
                        : new SurveyQuestion(['survey_id' => $survey->id]);

                    $question->fill([
                        'order' => $index + 1,
                        'text' => $this->sanitizer->cleanQuestionText($qData['text'], $index),
                        'type' => $qData['type'],
                        'is_required' => $qData['is_required'] ?? false,
                        'options' => $this->sanitizer->cleanOptions($qData['type'], $qData['options'] ?? []),
                        'image_url' => $qData['image_url'] ?? null,
                        'validation' => $qData['validation'] ?? null,
                    ]);
                    $question->save();
                    $retainedQuestionIds[] = $question->id;
                }

                $questionsToDelete = $survey->questions();
                if ($retainedQuestionIds) {
                    $questionsToDelete->whereNotIn('id', $retainedQuestionIds);
                }
                $questionsToDelete->delete();
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
