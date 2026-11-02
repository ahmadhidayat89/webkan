<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class QuizAdminController extends Controller
{
    /**
     * Update setting kuis (batas waktu, passing score, dll).
     */
    public function updateSettings(Request $request, Quiz $quiz): RedirectResponse
    {
        $request->validate([
            'duration_minutes'     => 'nullable|integer|min:1',
            'passing_score'        => 'required|integer|min:0|max:100',
            'max_attempts'         => 'required|integer|min:1',
            'shuffle_questions'    => 'boolean',
            'show_correct_answers' => 'boolean',
            'deadline_at'          => 'nullable|date',
            'quiz_mode'            => 'required|in:multiple_choice,essay,true_false,short_answer,custom',
        ]);

        $quiz->update($request->only([
            'duration_minutes',
            'passing_score',
            'max_attempts',
            'shuffle_questions',
            'show_correct_answers',
            'deadline_at',
            'quiz_mode',
        ]));

        return back()->with('success', 'Setting kuis disimpan.');
    }

    /**
     * Tambah soal baru.
     */
    public function addQuestion(Request $request, Quiz $quiz): RedirectResponse
    {
        $request->validate($this->questionRules($request));

        $maxOrder = $quiz->questions()->max('sort_order') ?? 0;

        DB::transaction(function () use ($request, $quiz, $maxOrder) {
            $question = $quiz->questions()->create([
                'question'    => $request->question,
                'type'        => $request->type,
                'points'      => $request->points,
                'sort_order'  => $maxOrder + 1,
                'explanation' => $request->explanation,
            ]);

            $this->syncOptions($question, $request);
        });

        return back()->with('success', 'Soal berhasil ditambahkan.');
    }

    /**
     * Update soal (termasuk opsi).
     */
    public function updateQuestion(Request $request, QuizQuestion $question): RedirectResponse
    {
        $request->validate($this->questionRules($request));

        DB::transaction(function () use ($request, $question) {
            $question->update([
                'question'    => $request->question,
                'type'        => $request->type,
                'points'      => $request->points,
                'explanation' => $request->explanation,
            ]);

            $this->syncOptions($question, $request);
        });

        return back()->with('success', 'Soal berhasil diperbarui.');
    }

    /**
     * Aturan validasi per tipe soal.
     */
    private function questionRules(Request $request): array
    {
        $rules = [
            'question'    => 'required|string',
            'type'        => 'required|in:multiple_choice,essay,true_false,short_answer',
            'points'      => 'required|integer|min:1',
            'explanation' => 'nullable|string',
        ];

        if ($request->type === 'multiple_choice') {
            $rules['options']               = 'required|array|min:2|max:8';
            $rules['options.*.option_text'] = 'required|string';
            $rules['options.*.is_correct']  = 'required|boolean';
        }

        if ($request->type === 'true_false') {
            // Urutan tetap: index 0 = Benar, index 1 = Salah
            $rules['options']              = 'required|array|size:2';
            $rules['options.*.is_correct'] = 'required|boolean';
        }

        return $rules;
    }

    /**
     * Simpan ulang opsi sesuai tipe soal.
     */
    private function syncOptions(QuizQuestion $question, Request $request): void
    {
        $question->options()->delete();

        if ($request->type === 'multiple_choice') {
            foreach ($request->options as $i => $opt) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_text' => $opt['option_text'],
                    'is_correct'  => $opt['is_correct'],
                    'sort_order'  => $i,
                ]);
            }
        } elseif ($request->type === 'true_false') {
            // Teks dipaksa dari server; yang dibaca hanya kunci jawabannya
            $benarIsCorrect = $request->boolean('options.0.is_correct');

            QuizOption::create([
                'question_id' => $question->id,
                'option_text' => 'Benar',
                'is_correct'  => $benarIsCorrect,
                'sort_order'  => 0,
            ]);
            QuizOption::create([
                'question_id' => $question->id,
                'option_text' => 'Salah',
                'is_correct'  => ! $benarIsCorrect,
                'sort_order'  => 1,
            ]);
        }
        // essay: tidak punya opsi
    }

    /**
     * Upload gambar untuk soal.
     */
    public function uploadQuestionImage(Request $request, QuizQuestion $question): RedirectResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        // Hapus gambar lama
        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }

        $path = $request->file('image')
            ->store("quiz-images/{$question->quiz_id}", 'public');

        $question->update(['image_path' => $path]);

        return back()->with('success', 'Gambar soal berhasil diupload.');
    }

    /**
     * Hapus soal.
     */
    public function deleteQuestion(QuizQuestion $question): RedirectResponse
    {
        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }
        $question->delete();
        return back()->with('success', 'Soal berhasil dihapus.');
    }

    /**
     * Reorder soal.
     */
    public function reorderQuestions(Request $request): RedirectResponse
    {
        $request->validate([
            'questions'              => 'required|array',
            'questions.*.id'         => 'required|exists:quiz_questions,id',
            'questions.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->questions as $item) {
            QuizQuestion::where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Urutan soal disimpan.');
    }
}
