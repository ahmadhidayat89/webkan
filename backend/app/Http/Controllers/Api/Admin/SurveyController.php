<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Services\Survey\RichTextSanitizer;
use App\Services\Survey\SurveyCsvExporter;
use App\Services\Survey\SurveyResultsBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public function __construct(
        private RichTextSanitizer $richText,
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
                'description' => $this->richText->sanitize($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()?->id,
            ]);

            if (!empty($validated['questions'])) {
                foreach ($validated['questions'] as $index => $qData) {
                    SurveyQuestion::create([
                        'survey_id' => $survey->id,
                        'order' => $index + 1,
                        'text' => $this->richText->cleanQuestionText($qData['text'], $index),
                        'type' => $qData['type'],
                        'is_required' => $qData['is_required'] ?? false,
                        'options' => $this->cleanOptions($qData['type'], $qData['options'] ?? []),
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

        return response()->json([
            'success' => true,
            'data' => $this->results->build($survey),
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
                'description' => $this->richText->sanitize($validated['description'] ?? null),
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
                        'text' => $this->richText->cleanQuestionText($qData['text'], $index),
                        'type' => $qData['type'],
                        'is_required' => $qData['is_required'] ?? false,
                        'options' => $this->cleanOptions($qData['type'], $qData['options'] ?? []),
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

        return $this->csvExporter->stream($survey);
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

    /**
     * Skala 1–5 selalu menyimpan tepat 5 label (boleh kosong, maks 100 karakter).
     * Jika semua kosong, pakai label bawaan. Tipe lain dikembalikan apa adanya.
     */
    private function cleanOptions(string $type, array $options): array
    {
        if ($type !== 'scale') {
            return $options;
        }

        $labels = [];
        for ($i = 0; $i < 5; $i++) {
            $label = trim(strip_tags((string) ($options[$i] ?? '')));
            $labels[] = mb_substr($label, 0, 100);
        }

        if (count(array_filter($labels, fn ($l) => $l !== '')) === 0) {
            return ['Sangat Tidak Baik', 'Tidak Baik', 'Cukup', 'Baik', 'Sangat Baik'];
        }

        return $labels;
    }
}
