<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    private const DISPLAY_DATE_TIME_FORMAT = 'd/m/Y H:i';

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
                'description' => $this->sanitizeRichText($validated['description'] ?? null),
                'is_published' => $validated['is_published'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()?->id,
            ]);

            if (!empty($validated['questions'])) {
                foreach ($validated['questions'] as $index => $qData) {
                    SurveyQuestion::create([
                        'survey_id' => $survey->id,
                        'order' => $index + 1,
                        'text' => $this->cleanQuestionText($qData['text'], $index),
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

        $responses = SurveyResponse::with('answers')
            ->where('survey_id', $survey->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalResponses = $responses->count();
        $lastResponse = $responses->first()?->created_at;

        $scaleScores = [];
        $questionsSummary = $survey->questions
            ->map(fn ($question) => $this->questionSummary($question, $responses, $scaleScores))
            ->all();

        $averageScale = count($scaleScores) > 0 ? round(array_sum($scaleScores) / count($scaleScores), 1) : null;

        // Prepare respondent rows for table display
        $respondentRows = $responses->map(fn ($response) => $this->formatRespondent($response));

        return response()->json([
            'success' => true,
            'data' => [
                'survey' => $survey,
                'stats' => [
                    'total_responses' => $totalResponses,
                    'average_scale' => $averageScale ? $averageScale . ' / 5' : '-',
                    'last_response_at' => $lastResponse ? $lastResponse->format('d/m/Y') : '-',
                    'last_response_time' => $lastResponse ? $lastResponse->format(self::DISPLAY_DATE_TIME_FORMAT) : '-',
                ],
                'summary' => $questionsSummary,
                'responses' => $respondentRows,
            ],
        ]);
    }

    private function questionSummary(SurveyQuestion $question, $responses, array &$scaleScores): array
    {
        $answers = $this->answersForQuestion($question, $responses);
        $summary = [
            'id' => $question->id,
            'text' => $question->text,
            'type' => $question->type,
            'is_required' => $question->is_required,
            'options' => $question->options ?? [],
            'total_answers' => count($answers),
        ];

        if (in_array($question->type, ['choice', 'check', 'drop'], true)) {
            $summary['counts'] = $this->choiceCounts($question->options ?? [], $answers);
        } elseif ($question->type === 'scale') {
            $summary['scale_counts'] = $this->scaleCounts($answers, $scaleScores);
        } else {
            $summary['sample_answers'] = array_slice($answers, 0, 10);
        }

        return $summary;
    }

    private function answersForQuestion(SurveyQuestion $question, $responses): array
    {
        $answers = [];
        foreach ($responses as $response) {
            $answer = $response->answers->firstWhere('question_id', $question->id);
            if ($answer && $answer->answer_value !== null && $answer->answer_value !== '') {
                $answers[] = $answer->answer_value;
            }
        }
        return $answers;
    }

    private function choiceCounts(array $options, array $answers): array
    {
        $counts = array_fill_keys($options, 0);
        foreach ($answers as $answer) {
            $values = json_decode($answer, true);
            foreach (is_array($values) ? $values : [$answer] as $value) {
                $counts[$value] = ($counts[$value] ?? 0) + 1;
            }
        }
        return $counts;
    }

    private function scaleCounts(array $answers, array &$scaleScores): array
    {
        $counts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($answers as $answer) {
            $score = (int) $answer;
            if ($score >= 1 && $score <= 5) {
                $counts[$score]++;
                $scaleScores[] = $score;
            }
        }
        return $counts;
    }

    private function formatRespondent(SurveyResponse $response): array
    {
        $answers = [];
        foreach ($response->answers as $answer) {
            $decoded = json_decode($answer->answer_value, true);
            $answers[$answer->question_id] = is_array($decoded) ? implode('; ', $decoded) : $answer->answer_value;
        }

        return [
            'id' => $response->id,
            'created_at' => $response->created_at->format('Y-m-d H:i:s'),
            'created_at_human' => $response->created_at->format(self::DISPLAY_DATE_TIME_FORMAT),
            'answers' => $answers,
        ];
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
                'description' => $this->sanitizeRichText($validated['description'] ?? null),
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
                        'text' => $this->cleanQuestionText($qData['text'], $index),
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

        $responses = SurveyResponse::with('answers')
            ->where('survey_id', $survey->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="hasil-kuesioner-' . $survey->code . '.csv"',
        ];

        $callback = fn () => $this->writeSurveyCsv($survey, $responses);

        return response()->stream($callback, 200, $headers);
    }

    private function writeSurveyCsv(Survey $survey, $responses): void
    {
        $file = fopen('php://output', 'w');
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($file, $this->surveyCsvHeaders($survey));
        foreach ($responses as $index => $response) {
            fputcsv($file, $this->surveyCsvResponseRow($response, $survey->questions, $index));
        }
        fclose($file);
    }

    private function surveyCsvHeaders(Survey $survey): array
    {
        $headers = ['#', 'Waktu Pengisian'];
        foreach ($survey->questions as $question) {
            $headers[] = trim(html_entity_decode(strip_tags($question->text)));
        }
        return $headers;
    }

    private function surveyCsvResponseRow(SurveyResponse $response, $questions, int $index): array
    {
        $row = [$index + 1, $response->created_at->format(self::DISPLAY_DATE_TIME_FORMAT)];
        foreach ($questions as $question) {
            $value = $response->answers->firstWhere('question_id', $question->id)?->answer_value;
            $decoded = $value !== null ? json_decode($value, true) : null;
            $row[] = is_array($decoded) ? implode('; ', $decoded) : ($value ?? '');
        }
        return $row;
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

    /**
     * Bersihkan teks pertanyaan (rich text). Jika kosong, pakai teks default.
     */
    private function cleanQuestionText(?string $html, int $index): string
    {
        $clean = $this->sanitizeRichText($html);

        if (trim(html_entity_decode(strip_tags($clean))) === '') {
            return 'Pertanyaan ' . ($index + 1);
        }

        return $clean;
    }

    /**
     * Sanitasi HTML sederhana: hanya tag p, br, strong, em, u, a.
     * Semua atribut dibuang kecuali href (hanya http/https/mailto) pada <a>.
     */
    private function sanitizeRichText(?string $html): string
    {
        $html = html_entity_decode((string) $html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $html = $this->normalizeRichTextLists($html);
        $html = strip_tags($html, '<p><br><strong><em><u><a><ul><ol><li>');

        return preg_replace_callback('/<(\/?)([a-z0-9]+)([^>]*)>/i', fn ($match) => $this->sanitizeRichTextTag($match), $html);
    }

    private function normalizeRichTextLists(string $html): string
    {
        return preg_replace_callback('/<ol\b[^>]*>(.*?)<\/ol>/is', function ($match) {
            $isBulletList = preg_match('/<li\b[^>]*data-list=["\']bullet["\']/i', $match[1]) === 1;
            $inner = preg_replace('/<li\b[^>]*data-list=["\'](?:bullet|ordered)["\'][^>]*>/', '<li>', $match[1]);
            $inner = preg_replace('/<span\b[^>]*class=["\'][^"\']*ql-ui[^"\']*["\'][^>]*><\/span>/i', '', $inner);
            $tag = $isBulletList ? 'ul' : 'ol';
            return '<' . $tag . '>' . $inner . '</' . $tag . '>';
        }, $html);
    }

    private function sanitizeRichTextTag(array $match): string
    {
        [, $closing, $tag, $attributes] = $match;
        $tag = strtolower($tag);
        $result = "<$tag>";
        if ($closing) {
            $result = "</$tag>";
        } elseif ($tag === 'a' && preg_match('/href\s*=\s*(?:"([^"]*)"|\'([^\']*)\')/i', $attributes, $hrefMatch)) {
            $rawHref = $hrefMatch[1] !== '' ? $hrefMatch[1] : ($hrefMatch[2] ?? '');
            $href = trim(html_entity_decode($rawHref));
            if (preg_match('#^(https?://|mailto:)#i', $href)) {
                $result = '<a href="' . e($href) . '" target="_blank" rel="noopener noreferrer">';
            }
        }
        return $result;
    }

}