<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GradingController extends Controller
{
    private const ATTEMPT_DATETIME_FORMAT = 'd M Y H:i';

    /**
     * Ringkasan pengerjaan seluruh kuis pada satu kursus untuk Laporan Nilai (Grader Report).
     */
    public function courseReport(Course $course)
    {
        $quizIds = $course->modules()
            ->with('lessons.quiz')
            ->get()
            ->flatMap(fn ($module) => $module->lessons->pluck('quiz.id'))
            ->filter()
            ->values();

        $attempts = QuizAttempt::whereIn('quiz_id', $quizIds)
            ->with(['user', 'answers.question'])
            ->orderByDesc('score')
            ->orderByDesc('finished_at')
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'quiz_id' => $attempt->quiz_id,
                'user_id' => $attempt->user_id,
                'user_name' => $attempt->user?->name,
                'user_email' => $attempt->user?->email,
                'score' => $attempt->score,
                'is_passed' => $attempt->is_passed,
                'started_at' => $attempt->started_at?->format(self::ATTEMPT_DATETIME_FORMAT),
                'finished_at' => $attempt->finished_at?->format(self::ATTEMPT_DATETIME_FORMAT),
                'pending_grading' => $attempt->answers->contains(
                    fn ($ans) => in_array($ans->question?->type, ['essay', 'short_answer'], true)
                        && $ans->manual_score === null
                        && filled($ans->essay_answer)
                ),
            ])
            ->values();

        return response()->json($attempts);
    }

    /**
     * List semua attempts untuk kuis tertentu.
     * Return data via JSON (untuk AJAX dari CourseEditor).
     */
    public function listAttempts(Quiz $quiz)
    {
        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->with(['user', 'answers.question.options', 'answers.selectedOption'])
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'user_id'         => $a->user_id,
                'user_name'       => $a->user->name,
                'user_email'      => $a->user->email,
                'score'           => $a->score,
                'is_passed'       => $a->is_passed,
                'started_at'      => $a->started_at->format(self::ATTEMPT_DATETIME_FORMAT),
                'finished_at'     => $a->finished_at?->format(self::ATTEMPT_DATETIME_FORMAT),
                'duration_seconds' => $a->finished_at && $a->started_at
                    ? max(0, (int) $a->started_at->diffInSeconds($a->finished_at, false))
                    : null,
                'has_essay'       => $a->answers->where('essay_answer', '!=', null)->count() > 0,
                'pending_grading' => $a->answers->where('essay_answer', '!=', null)
                    ->where('manual_score', null)->count() > 0,
                'answers'         => $a->answers->map(fn($ans) => [
                    'id'                   => $ans->id,
                    'question_id'          => $ans->question_id,
                    'question_text'        => $ans->question?->question,
                    'question_type'        => $ans->question?->type,
                    'question_explanation' => $ans->question?->explanation,
                    'question_image'       => $ans->question?->image_path
                        ? \Illuminate\Support\Facades\Storage::url($ans->question->image_path)
                        : null,
                    'selected_option'      => $ans->selectedOption?->option_text,
                    'correct_option'       => $ans->question?->options?->firstWhere('is_correct', true)?->option_text,
                    'is_correct'           => $ans->is_correct,
                    'essay_answer'         => $ans->essay_answer,
                    'manual_score'         => $ans->manual_score,
                    'admin_feedback'       => $ans->admin_feedback,
                    'max_points'           => $ans->question?->points ?? 1,
                ])->values(),
            ]);

        return response()->json($attempts);
    }

    /**
     * Simpan nilai manual untuk jawaban essay.
     */
    public function gradeEssay(Request $request, QuizAttemptAnswer $answer): RedirectResponse
    {
        $request->validate([
            'manual_score'   => 'required|integer|min:0|max:100',
            'admin_feedback' => 'nullable|string|max:1000',
        ]);

        $answer->update([
            'manual_score'   => $request->manual_score,
            'admin_feedback' => $request->admin_feedback,
            'is_correct'     => $request->manual_score >= 70, // pass jika >= 70%
        ]);

        // Recalculate total score attempt
        $attempt = $answer->attempt;
        $this->recalculateScore($attempt);

        return back()->with('success', 'Nilai berhasil disimpan.');
    }

    /**
     * Batch grade: simpan semua jawaban essay dalam satu attempt sekaligus.
     */
    public function batchGrade(Request $request, QuizAttempt $attempt): RedirectResponse
    {
        $request->validate([
            'grades'                    => 'required|array',
            'grades.*.answer_id'        => 'required|exists:quiz_attempt_answers,id',
            'grades.*.manual_score'     => 'required|integer|min:0|max:100',
            'grades.*.admin_feedback'   => 'nullable|string|max:1000',
        ]);

        foreach ($request->grades as $grade) {
            QuizAttemptAnswer::where('id', $grade['answer_id'])
                ->where('attempt_id', $attempt->id) // security: pastikan milik attempt ini
                ->update([
                    'manual_score'   => $grade['manual_score'],
                    'admin_feedback' => $grade['admin_feedback'] ?? null,
                    'is_correct'     => $grade['manual_score'] >= 70,
                ]);
        }

        $this->recalculateScore($attempt);

        return back()->with('success', 'Semua nilai berhasil disimpan.');
    }

    private function recalculateScore(QuizAttempt $attempt): void
    {
        $answers       = $attempt->answers()->with('question')->get();
        $totalPoints   = $answers->sum(fn($a) => $a->question?->points ?? 1);
        $earnedPoints  = $answers->sum(function ($a) {
            if (in_array($a->question?->type, ['essay', 'short_answer'], true)) {
                return $a->manual_score ? ($a->manual_score / 100) * ($a->question->points ?? 1) : 0;
            }
            // Pilihan Ganda dan Benar/Salah: dinilai otomatis saat submit
            return $a->is_correct ? ($a->question?->points ?? 1) : 0;
        });

        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

        // Masih ada essay yang dijawab tapi belum dinilai: status tetap "menunggu"
        $hasPendingEssay = $answers->contains(
            fn($a) => in_array($a->question?->type, ['essay', 'short_answer'], true)
                && $a->manual_score === null
                && filled($a->essay_answer)
        );

        $attempt->update([
            'score'            => $score,
            'correct_answers'  => $answers->where('is_correct', true)->count(),
            'is_passed'        => $hasPendingEssay ? null : $score >= ($attempt->quiz?->passing_score ?? 70),
            'finished_at'      => $attempt->finished_at ?? now(),
        ]);
    }
}
