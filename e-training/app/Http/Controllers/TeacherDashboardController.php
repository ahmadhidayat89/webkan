<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->role === 'pengajar', 403);
        $courseIds = $user->teachingCourses()->pluck('courses.id');
        $pending = QuizAttempt::query()
            ->whereNotNull('finished_at')
            ->whereHas('quiz.lesson.module.course', fn ($query) => $query->whereIn('id', $courseIds))
            ->whereHas('answers', fn ($query) => $query->pendingManualGrading());

        $stats = [
            'courses' => $courseIds->count(),
            'participants' => Enrollment::whereIn('course_id', $courseIds)->distinct()->count('user_id'),
            'pendingAttempts' => (clone $pending)->count(),
            'pendingQuizzes' => (clone $pending)->distinct()->count('quiz_id'),
            'pendingAnswers' => QuizAttemptAnswer::pendingManualGrading()
                ->whereIn('attempt_id', (clone $pending)->select('quiz_attempts.id'))->count(),
        ];

        $pendingAttempts = $pending
            ->with(['user:id,name', 'quiz.lesson.module.course:id,title'])
            ->withCount(['answers as pending_answers_count' => fn ($query) => $query->pendingManualGrading()])
            ->orderBy('finished_at')->orderBy('id')
            ->paginate(10)->through(fn ($attempt) => $this->formatAttempt($attempt));

        $courses = $user->teachingCourses()->withCount('enrollments')
            ->orderByDesc('updated_at')->orderBy('courses.id')->limit(6)->get()
            ->map(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'participants' => $course->enrollments_count,
                'url' => route('admin.courses.edit', $course),
            ]);

        return Inertia::render('Teacher/Dashboard', [
            'stats' => $stats,
            'pendingAttempts' => $pendingAttempts,
            'courses' => $courses,
        ]);
    }

    private function formatAttempt(QuizAttempt $attempt): array
    {
        $lesson = $attempt->quiz->lesson;

        return [
            'id' => $attempt->id,
            'student' => $attempt->user->name,
            'quiz' => $lesson->title,
            'course' => $lesson->module->course->title,
            'pendingAnswers' => $attempt->pending_answers_count,
            'submittedAt' => $attempt->finished_at->format('d M Y, H:i'),
            'gradingUrl' => route('admin.courses.edit', [
                'course' => $lesson->module->course_id,
                'tab' => 'grading',
                'quiz' => $attempt->quiz_id,
                'attempt' => $attempt->id,
            ]),
        ];
    }
}
