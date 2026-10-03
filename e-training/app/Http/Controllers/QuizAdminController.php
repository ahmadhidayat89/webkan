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
            'quiz_mode'            => 'required|in:multiple_choice,essay,custom',
        ]);

        $quiz->update($request->only([
            'duration_minutes', 'passing_score', 'max_attempts',
            'shuffle_questions', 'show_correct_answers', 'deadline_at', 'quiz_mode',
        ]));

        return back()->with('success', 'Setting kuis disimpan.');
    }

    /**
     * Tambah soal baru.
     */
    public function addQuestion(Request $request, Quiz $quiz): RedirectResponse
    {
        $rules = [
            'question'    => 'required|string',
            'type'        => 'required|in:multiple_choice,essay',
            'points'      => 'required|integer|min:1',
            'explanation' => 'nullable|string',
        ];

        if ($request->type === 'multiple_choice') {
            $rules['options'] = 'required|array|min:2';
            $rules['options.*.option_text'] = 'required|string';
            $rules['options.*.is_correct']  = 'required|boolean';
        }

        $request->validate($rules);

        $maxOrder = $quiz->questions()->max('sort_order') ?? 0;

        DB::transaction(function () use ($request, $quiz, $maxOrder) {
            $question = $quiz->questions()->create([
                'question'    => $request->question,
                'type'        => $request->type,
                'points'      => $request->points,
                'sort_order'  => $maxOrder + 1,
                'explanation' => $request->explanation,
            ]);

            if ($request->type === 'multiple_choice' && $request->options) {
                foreach ($request->options as $i => $opt) {
                    QuizOption::create([
                        'question_id' => $question->id,
                        'option_text' => $opt['option_text'],
                        'is_correct'  => $opt['is_correct'],
                        'sort_order'  => $i,
                    ]);
                }
            }
        });

        return back()->with('success', 'Soal berhasil ditambahkan.');
    }

    /**
     * Update soal (termasuk opsi pilihan ganda).
     */
    public function updateQuestion(Request $request, QuizQuestion $question): RedirectResponse
    {
        $rules = [
            'question'    => 'required|string',
            'type'        => 'required|in:multiple_choice,essay',
            'points'      => 'required|integer|min:1',
            'explanation' => 'nullable|string',
        ];

        if ($request->type === 'multiple_choice') {
            $rules['options'] = 'required|array|min:2';
            $rules['options.*.option_text'] = 'required|string';
            $rules['options.*.is_correct']  = 'required|boolean';
        }

        $request->validate($rules);

        DB::transaction(function () use ($request, $question) {
            $question->update([
                'question'    => $request->question,
                'type'        => $request->type,
                'points'      => $request->points,
                'explanation' => $request->explanation,
            ]);

            if ($request->type === 'multiple_choice') {
                // Hapus opsi lama, buat yang baru
                $question->options()->delete();
                foreach ($request->options as $i => $opt) {
                    QuizOption::create([
                        'question_id' => $question->id,
                        'option_text' => $opt['option_text'],
                        'is_correct'  => $opt['is_correct'],
                        'sort_order'  => $i,
                    ]);
                }
            } else {
                // Essay: hapus opsi pilihan ganda jika ada
                $question->options()->delete();
            }
        });

        return back()->with('success', 'Soal berhasil diperbarui.');
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
            'questions'             => 'required|array',
            'questions.*.id'        => 'required|exists:quiz_questions,id',
            'questions.*.sort_order'=> 'required|integer',
        ]);

        foreach ($request->questions as $item) {
            QuizQuestion::where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Urutan soal disimpan.');
    }
}
