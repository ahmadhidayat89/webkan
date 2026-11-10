<?php

namespace App\Http\Controllers;

use App\Models\BankQuestion;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Services\QuestionBankService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class QuizAdminController extends Controller
{
    private const DATETIME_LABEL_FORMAT = 'd M Y, H:i';

    /**
     * Update setting kuis (batas waktu, passing score, dll).
     */
    public function updateSettings(Request $request, Quiz $quiz): RedirectResponse
    {
        $request->validate([
            'duration_minutes' => 'nullable|integer|min:1',
            'passing_score' => 'required|integer|min:0|max:100',
            'max_attempts' => 'required|integer|min:1',
            'shuffle_questions' => 'boolean',
            'show_correct_answers' => 'boolean',
            'review_mode' => 'sometimes|in:off,review,with_answers',
            'start_at' => 'nullable|date',
            'deadline_at' => ['nullable', 'date', Rule::when($request->filled('start_at'), ['after:start_at'])],
            'quiz_mode' => 'required|in:multiple_choice,essay,true_false,short_answer,custom',
            'exam_type' => 'sometimes|in:open_book,close_book',
        ], [
            'deadline_at.after' => 'Deadline harus setelah waktu mulai.',
        ]);

        $scheduleError = $this->moduleScheduleError($quiz, $request->input('start_at'), $request->input('deadline_at'));
        if ($scheduleError !== null) {
            return back()->withErrors(['deadline_at' => $scheduleError]);
        }

        $quiz->update($request->only([
            'duration_minutes',
            'passing_score',
            'max_attempts',
            'shuffle_questions',
            'show_correct_answers',
            'review_mode',
            'start_at',
            'deadline_at',
            'quiz_mode',
            'exam_type',
        ]));

        return back()->with('success', 'Setting kuis disimpan.');
    }

    /**
     * Pesan error kalau jadwal kuis keluar dari jadwal modulnya, atau null kalau aman.
     */
    private function moduleScheduleError(Quiz $quiz, ?string $startAt, ?string $deadlineAt): ?string
    {
        $module = Module::whereHas('lessons', fn($q) => $q->where('id', $quiz->lesson_id))->first();
        if ($module === null) {
            return null;
        }

        $start = $startAt ? Carbon::parse($startAt) : null;
        $end = $deadlineAt ? Carbon::parse($deadlineAt) : null;
        $opens = $module->start_at;
        $closes = $module->end_at;

        $checks = [
            [$start && $opens && $start->lt($opens), 'Waktu mulai kuis tidak boleh lebih awal dari modul dibuka (' . $opens?->format(self::DATETIME_LABEL_FORMAT) . ').'],
            [$end && $opens && $end->lt($opens), 'Deadline kuis tidak boleh lebih awal dari modul dibuka (' . $opens?->format(self::DATETIME_LABEL_FORMAT) . ').'],
            [$start && $closes && $start->gt($closes), 'Waktu mulai kuis tidak boleh melewati modul ditutup (' . $closes?->format(self::DATETIME_LABEL_FORMAT) . ').'],
            [$end && $closes && $end->gt($closes), 'Deadline kuis tidak boleh melewati modul ditutup (' . $closes?->format(self::DATETIME_LABEL_FORMAT) . ').'],
        ];

        foreach ($checks as [$invalid, $message]) {
            if ($invalid) {
                return $message;
            }
        }

        return null;
    }

    /**
     * Tambah soal baru.
     */
    public function addQuestion(Request $request, Quiz $quiz): RedirectResponse
    {
        app(QuestionBankService::class)->assertQuizEditable($quiz);
        $request->validate($this->questionRules($request));

        DB::transaction(function () use ($request, $quiz) {
            $quiz = Quiz::lockForUpdate()->findOrFail($quiz->id);
            app(QuestionBankService::class)->assertQuizEditable($quiz);
            $maxOrder = $quiz->questions()->max('sort_order') ?? 0;
            $question = $quiz->questions()->create([
                'question' => $request->question,
                'type' => $request->type,
                'points' => $request->points,
                'sort_order' => $maxOrder + 1,
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
        app(QuestionBankService::class)->assertQuizEditable($question->quiz);
        $request->validate($this->questionRules($request));

        DB::transaction(function () use ($request, $question) {
            $quiz = Quiz::lockForUpdate()->findOrFail($question->quiz_id);
            app(QuestionBankService::class)->assertQuizEditable($quiz);
            $question->update([
                'question' => $request->question,
                'type' => $request->type,
                'points' => $request->points,
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
            'question' => 'required|string',
            'type' => 'required|in:multiple_choice,essay,true_false,short_answer',
            'points' => 'required|integer|min:1',
            'explanation' => 'nullable|string',
        ];

        if ($request->type === 'multiple_choice') {
            $rules['options'] = 'required|array|min:2|max:8';
            $rules['options.*.option_text'] = 'required|string';
            $rules['options.*.is_correct'] = 'required|boolean';
        }

        if ($request->type === 'true_false') {
            // Urutan tetap: index 0 = Benar, index 1 = Salah
            $rules['options'] = 'required|array|size:2';
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
                    'is_correct' => $opt['is_correct'],
                    'sort_order' => $i,
                ]);
            }
        } elseif ($request->type === 'true_false') {
            // Teks dipaksa dari server; yang dibaca hanya kunci jawabannya
            $benarIsCorrect = $request->boolean('options.0.is_correct');

            QuizOption::create([
                'question_id' => $question->id,
                'option_text' => 'Benar',
                'is_correct' => $benarIsCorrect,
                'sort_order' => 0,
            ]);
            QuizOption::create([
                'question_id' => $question->id,
                'option_text' => 'Salah',
                'is_correct' => ! $benarIsCorrect,
                'sort_order' => 1,
            ]);
        }
        // essay: tidak punya opsi
    }

    /**
     * Upload gambar untuk soal.
     */
    public function uploadQuestionImage(Request $request, QuizQuestion $question): RedirectResponse
    {
        app(QuestionBankService::class)->assertQuizEditable($question->quiz);
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        DB::transaction(function () use ($request, $question) {
            $quiz = Quiz::lockForUpdate()->findOrFail($question->quiz_id);
            app(QuestionBankService::class)->assertQuizEditable($quiz);
            $question->refresh();
            // Hapus gambar lama
            if ($question->image_path && ! $question->bank_question_id && ! BankQuestion::where('image_path', $question->image_path)->exists()) {
                Storage::disk('public')->delete($question->image_path);
            }

            $path = $request->file('image')
                ->store("quiz-images/{$question->quiz_id}", 'public');

            $question->update(['image_path' => $path]);
        });

        return back()->with('success', 'Gambar soal berhasil diupload.');
    }

    /**
     * Hapus soal.
     */
    public function deleteQuestion(QuizQuestion $question): RedirectResponse
    {
        DB::transaction(function () use ($question) {
            $quiz = Quiz::lockForUpdate()->findOrFail($question->quiz_id);
            app(QuestionBankService::class)->assertQuizEditable($quiz);
            $question->refresh();
            abort_if($question->random_group_id !== null, 422, 'Hapus kelompok acak melalui pengaturan bank soal.');
            if ($question->image_path && ! $question->bank_question_id && ! BankQuestion::where('image_path', $question->image_path)->exists()) {
                Storage::disk('public')->delete($question->image_path);
            }
            $question->delete();
        });

        return back()->with('success', 'Soal berhasil dihapus.');
    }

    /**
     * Reorder soal.
     */
    public function reorderQuestions(Request $request): RedirectResponse
    {
        $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|exists:quiz_questions,id',
            'questions.*.sort_order' => 'required|integer',
        ]);

        DB::transaction(function () use ($request) {
            $quizIds = QuizQuestion::whereIn('id', array_column($request->questions, 'id'))->pluck('quiz_id')->unique()->sort()->values();
            foreach (Quiz::whereIn('id', $quizIds)->orderBy('id')->lockForUpdate()->get() as $quiz) {
                app(QuestionBankService::class)->assertQuizEditable($quiz);
            }
            foreach ($request->questions as $item) {
                QuizQuestion::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });

        return back()->with('success', 'Urutan soal disimpan.');
    }
}
