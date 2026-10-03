<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GradingController extends Controller
{
    /**
     * List semua attempts untuk kuis tertentu.
     * Return data via JSON (untuk AJAX dari CourseEditor).
     */
    public function listAttempts(Quiz $quiz)
    {
        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->with(['user', 'answers.question', 'answers.selectedOption'])
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'user_id'         => $a->user_id,
                'user_name'       => $a->user->name,
                'user_email'      => $a->user->email,
                'score'           => $a->score,
                'is_passed'       => $a->is_passed,
                'started_at'      => $a->started_at->format('d M Y H:i'),
                'finished_at'     => $a->finished_at?->format('d M Y H:i'),
                'has_essay'       => $a->answers->where('essay_answer', '!=', null)->count() > 0,
                'pending_grading' => $a->answers->where('essay_answer', '!=', null)
                    ->where('manual_score', null)->count() > 0,
                'answers'         => $a->answers->map(fn($ans) => [
                    'id'               => $ans->id,
                    'question_id'      => $ans->question_id,
                    'question_text'    => $ans->question?->question,
                    'question_type'    => $ans->question?->type,
                    'question_image'   => $ans->question?->image_path
                        ? \Illuminate\Support\Facades\Storage::url($ans->question->image_path)
                        : null,
                    'selected_option'  => $ans->selectedOption?->option_text,
                    'is_correct'       => $ans->is_correct,
                    'essay_answer'     => $ans->essay_answer,
                    'manual_score'     => $ans->manual_score,
                    'admin_feedback'   => $ans->admin_feedback,
                    'max_points'       => $ans->question?->points ?? 1,
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
            if ($a->question?->type === 'essay') {
                return $a->manual_score ? ($a->manual_score / 100) * ($a->question->points ?? 1) : 0;
            }
            return $a->is_correct ? ($a->question?->points ?? 1) : 0;
        });

        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

        $attempt->update([
            'score'            => $score,
            'correct_answers'  => $answers->where('is_correct', true)->count(),
            'is_passed'        => $score >= ($attempt->quiz?->passing_score ?? 70),
            'finished_at'      => $attempt->finished_at ?? now(),
        ]);
    }
}
