<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Certificate;
use App\Models\User;
use App\Models\Enrollment as CourseEnrollment;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $eventController = app(CourseEventController::class);
        $upcomingEvents = $eventController->getUpcoming();
        $calendarEvents = $eventController->getCalendarEvents($request);

        if ($user->isAdmin()) {
            return $this->adminDashboard($upcomingEvents, $calendarEvents);
        }

        return $this->studentDashboard($user, $upcomingEvents, $calendarEvents);
    }

    private function adminDashboard($upcomingEvents, $calendarEvents)
    {
            $totalStudents = User::where('role', 'peserta')->count();
            $activeCourses = Course::where('status', 'published')->count();
            // Estimasi completion rate bisa dari perbandingan certificate / enrollment
            $totalEnrollments = Enrollment::count();
            $totalCertificates = Certificate::count();
            $completionRate = $totalEnrollments > 0 ? round(($totalCertificates / $totalEnrollments) * 100) : 0;

            $recentActivity = $this->recentAdminActivities();

            // ── User Online (aktif dalam 5 menit terakhir) ──
            $onlineUsers = User::where('role', 'peserta')
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->orderByDesc('last_seen_at')
                ->take(20)
                ->get()
                ->map(fn($u) => [
                    'id'           => $u->id,
                    'name'         => $u->name,
                    'username'     => $u->username,
                    'organization' => $u->organization,
                    'last_seen_at' => $u->last_seen_at?->diffForHumans(),
                ]);

            $adminStats = [
                'totalStudents'    => $totalStudents,
                'activeCourses'    => $activeCourses,
                'completionRate'   => $completionRate,
                'totalCertificates'=> $totalCertificates,
                'recentActivity'   => $recentActivity,
                'onlineCount'      => $onlineUsers->count(),
            ];

            // Kursus terbaru untuk tampilan admin
            $adminCourses = Course::with(['instructor', 'category'])
                ->withCount('enrollments')
                ->latest()->take(4)->get()
                ->map(fn($course) => [
                    'id'               => $course->id,
                    'title'            => $course->title,
                    'description'      => $course->description,
                    'short_description'=> $course->short_description,
                    'category_name'    => $course->category?->name ?? 'Umum',
                    'thumbnail'        => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
                    'instructor_name'  => $course->instructor?->name ?? 'Instruktur',
                    'level'            => $course->level,
                    'duration'         => $course->duration_hours . ' Jam',
                    'progress'         => 0,
                    'enrolled_students'=> $course->enrollments_count,
                    'rating'           => 0,
                    'is_featured'      => $course->is_featured,
                ]);

            return Inertia::render('Dashboard', [
                'upcomingEvents' => $upcomingEvents,
                'calendarEvents' => $calendarEvents,
                'adminStats'     => $adminStats,
                'adminCourses'   => $adminCourses,
                'onlineUsers'    => $onlineUsers,
            ]);
    }

    private function recentAdminActivities(): array
    {
        $activities = collect();
        $this->appendEnrollmentActivities($activities);
        $this->appendCertificateActivities($activities);
        $this->appendQuizActivities($activities);
        return $activities->sortByDesc('sort')->take(10)->values()->toArray();
    }

    private function appendEnrollmentActivities($activities): void
    {
        Enrollment::with('user', 'course')->latest()->take(10)->get()->each(function ($enrollment) use ($activities) {
            if (!$enrollment->user || !$enrollment->course) {
                return;
            }
            $activities->push([
                'id' => 'enroll_' . $enrollment->id, 'type' => 'enrollment',
                'text' => "{$enrollment->user->name} mendaftar kursus \"{$enrollment->course->title}\"",
                'time' => $enrollment->created_at->diffForHumans(), 'sort' => $enrollment->created_at->timestamp,
            ]);
        });
    }

    private function appendCertificateActivities($activities): void
    {
        Certificate::with('user', 'course')->latest()->take(10)->get()->each(function ($certificate) use ($activities) {
            if (!$certificate->user || !$certificate->course) {
                return;
            }
            $issuedAt = $certificate->issued_at ?? $certificate->created_at;
            $activities->push([
                'id' => 'cert_' . $certificate->id, 'type' => 'certificate',
                'text' => "Sertifikat diterbitkan untuk {$certificate->user->name} — \"{$certificate->course->title}\"",
                'time' => $issuedAt->diffForHumans(), 'sort' => $issuedAt->timestamp,
            ]);
        });
    }

    private function appendQuizActivities($activities): void
    {
        \App\Models\QuizAttempt::with(['user', 'quiz.lesson.module.course'])->whereNotNull('finished_at')
            ->latest('finished_at')->take(10)->get()->each(function ($attempt) use ($activities) {
                if (!$attempt->user || !$attempt->quiz) {
                    return;
                }
                $courseName = optional(optional(optional($attempt->quiz->lesson)->module)->course)->title ?? 'kursus';
                $status = $attempt->is_passed ? 'lulus' : 'belum lulus';
                $activities->push([
                    'id' => 'quiz_' . $attempt->id, 'type' => 'quiz',
                    'text' => "{$attempt->user->name} mengerjakan kuis di \"{$courseName}\" — {$status} (skor {$attempt->score})",
                    'time' => $attempt->finished_at->diffForHumans(), 'sort' => $attempt->finished_at->timestamp,
                ]);
            });
    }

    private function totalHoursLearned($enrollments): int
    {
        return (int) round($enrollments->sum(fn ($enrollment) => $enrollment->course
            ? ($enrollment->progress_percent / 100) * $enrollment->course->duration_hours
            : 0));
    }

    private function formatEnrolledCourse(CourseEnrollment $enrollment, $certificates): ?array
    {
        $course = $enrollment->course;
        if (!$course) {
            return null;
        }
        return [
            'id' => $course->id, 'title' => $course->title,
            'short_description' => $course->short_description,
            'category_name' => $course->category ? $course->category->name : 'Umum',
            'thumbnail' => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
            'instructor_name' => $course->instructor ? $course->instructor->name : 'Instruktur',
            'level' => $course->level, 'duration' => $course->duration_hours . ' Jam',
            'progress' => $enrollment->progress_percent,
            'enrolled_students' => $course->enrollments()->count(), 'rating' => 0,
            'is_featured' => $course->is_featured,
            'certificate_id' => isset($certificates[$course->id]) ? $certificates[$course->id]->id : null,
        ];
    }

    private function formatAvailableCourse(Course $course): array
    {
        return [
            'id' => $course->id, 'title' => $course->title,
            'short_description' => $course->short_description,
            'category_name' => $course->category ? $course->category->name : 'Umum',
            'thumbnail' => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
            'instructor_name' => $course->instructor ? $course->instructor->name : 'Instruktur',
            'level' => $course->level, 'duration' => $course->duration_hours . ' Jam',
            'progress' => 0, 'enrolled_students' => $course->enrollments_count,
            'rating' => 0, 'is_featured' => $course->is_featured,
        ];
    }

    private function studentDashboard(User $user, $upcomingEvents, $calendarEvents)
    {
            // Peserta
            $enrollments = Enrollment::with(['course.instructor', 'course.category'])
                ->where('user_id', $user->id)
                ->get();

            $coursesInProgress = $enrollments->where('progress_percent', '<', 100)->where('progress_percent', '>', 0)->count();
            $coursesCompleted = $enrollments->where('progress_percent', 100)->count();
            $certificates = Certificate::where('user_id', $user->id)->count();
            
            $totalHoursLearned = $this->totalHoursLearned($enrollments);

            $studentStats = [
                'coursesInProgress' => $coursesInProgress,
                'coursesCompleted' => $coursesCompleted,
                'certificates' => $certificates,
                'totalHoursLearned' => $totalHoursLearned,
            ];

            $certificates = Certificate::where('user_id', $user->id)->get()->keyBy('course_id');

            $enrolledCourses = $enrollments
                ->map(fn ($enrollment) => $this->formatEnrolledCourse($enrollment, $certificates))
                ->filter()->values();

            // Ambil kursus yang belum di-enroll
            $enrolledCourseIds = $enrollments->pluck('course_id')->toArray();
            $availableCoursesQuery = Course::with(['instructor', 'category'])
                ->withCount('enrollments')
                ->where('status', 'published')
                ->whereNotIn('id', $enrolledCourseIds)
                ->take(4)
                ->get();

            $availableCourses = $availableCoursesQuery->map(fn ($course) => $this->formatAvailableCourse($course));

            // User peserta yang sedang online (kecuali diri sendiri)
            $onlineUsers = User::where('role', 'peserta')
                ->where('id', '!=', $user->id)
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->orderByDesc('last_seen_at')
                ->take(15)
                ->get()
                ->map(fn($u) => [
                    'id'           => $u->id,
                    'name'         => $u->name,
                    'username'     => $u->username,
                    'organization' => $u->organization,
                    'last_seen_at' => $u->last_seen_at?->diffForHumans(),
                ]);

            return Inertia::render('Dashboard', [
                'upcomingEvents'   => $upcomingEvents,
                'calendarEvents'   => $calendarEvents,
                'studentStats'     => $studentStats,
                'enrolledCourses'  => $enrolledCourses,
                'availableCourses' => $availableCourses,
                'onlineUsers'      => $onlineUsers,
            ]);

    }
}
