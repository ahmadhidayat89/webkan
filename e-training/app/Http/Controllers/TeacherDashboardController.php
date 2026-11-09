<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
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

        $recentDiscussions = Discussion::query()
            ->whereHas('lesson.module.course', fn ($query) => $query->whereIn('id', $courseIds))
            ->with(['user:id,name,role', 'lesson.module.course:id,title'])
            ->latest('id')
            ->take(200)
            ->get()
            ->filter(fn (Discussion $d) => $d->lesson?->module_id !== null)
            ->groupBy(fn (Discussion $d) => $d->lesson->module_id)
            ->take(10)
            ->map(fn ($group) => $this->formatModuleDiscussion($group, (int) $user->id))
            ->values();

        return Inertia::render('Teacher/Dashboard', [
            'stats' => $stats,
            'pendingAttempts' => $pendingAttempts,
            'courses' => $courses,
            'recentDiscussions' => $recentDiscussions,
        ]);
    }

    private function formatModuleDiscussion($group, int $userId): array
    {
        /** @var Discussion $latest */
        $latest = $group->first();
        $lesson = $latest->lesson;
        $module = $lesson?->module;
        $course = $module?->course;

        $unreadCount = $group->groupBy('lesson_id')->sum(function ($lessonMsgs, $lessonId) use ($userId) {
            $lastReadId = (int) \Illuminate\Support\Facades\Cache::get(
                DiscussionController::readCacheKey($userId, (int) $lessonId),
                0
            );
            return $lessonMsgs->filter(fn ($m) => $m->id > $lastReadId && (int) $m->user_id !== $userId)->count();
        });

        return [
            'id' => 'module_' . ($module?->id ?? $latest->id),
            'module_id' => $module?->id,
            'user_name' => $latest->user?->name ?? 'Pengguna',
            'user_role' => $latest->user?->role ?? 'peserta',
            'lesson_title' => $lesson?->title ?? '-',
            'module_title' => $module?->title ?? '-',
            'course_title' => $course?->title ?? '-',
            'message' => $latest->message ?: ($latest->file_name ? "📎 {$latest->file_name}" : ''),
            'time_ago' => $latest->created_at?->diffForHumans(),
            'total_messages' => $group->count(),
            'unread_count' => $unreadCount,
            'is_read' => $unreadCount === 0,
            'reply_url' => $course && $lesson ? route('admin.courses.edit', [
                'course' => $course->id,
                'tab' => 'discussions',
                'lesson' => $lesson->id,
            ]) : '#',
        ];
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
