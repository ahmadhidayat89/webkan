<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Certificate;
use App\Models\User;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $eventController = app(CourseEventController::class);
        $upcomingEvents = $eventController->getUpcoming();
        $calendarEvents = $eventController->getCalendarEvents($request);

        if ($user->isAdmin()) {
            $totalStudents = User::where('role', 'pelajar')->count();
            $activeCourses = Course::where('status', 'published')->count();
            // Estimasi completion rate bisa dari perbandingan certificate / enrollment
            $totalEnrollments = Enrollment::count();
            $totalCertificates = Certificate::count();
            $completionRate = $totalEnrollments > 0 ? round(($totalCertificates / $totalEnrollments) * 100) : 0;

            // ── Aktivitas Terkini: gabungkan enrollment, certificate, quiz ──
            $activities = collect();

            // Enrollment terbaru
            \App\Models\Enrollment::with('user', 'course')
                ->latest()->take(10)->get()
                ->each(function ($e) use (&$activities) {
                    if ($e->user && $e->course) {
                        $activities->push([
                            'id'   => 'enroll_' . $e->id,
                            'type' => 'enrollment',
                            'text' => "{$e->user->name} mendaftar kursus \"{$e->course->title}\"",
                            'time' => $e->created_at->diffForHumans(),
                            'sort' => $e->created_at->timestamp,
                        ]);
                    }
                });

            // Sertifikat terbaru
            Certificate::with('user', 'course')
                ->latest()->take(10)->get()
                ->each(function ($c) use (&$activities) {
                    if ($c->user && $c->course) {
                        $activities->push([
                            'id'   => 'cert_' . $c->id,
                            'type' => 'certificate',
                            'text' => "Sertifikat diterbitkan untuk {$c->user->name} — \"{$c->course->title}\"",
                            'time' => $c->issued_at ? $c->issued_at->diffForHumans() : $c->created_at->diffForHumans(),
                            'sort' => $c->issued_at ? $c->issued_at->timestamp : $c->created_at->timestamp,
                        ]);
                    }
                });

            // Quiz attempts terbaru
            \App\Models\QuizAttempt::with(['user', 'quiz.lesson.module.course'])
                ->whereNotNull('finished_at')
                ->latest('finished_at')->take(10)->get()
                ->each(function ($a) use (&$activities) {
                    if ($a->user && $a->quiz) {
                        $courseName = optional(optional(optional($a->quiz->lesson)->module)->course)->title ?? 'kursus';
                        $status = $a->is_passed ? 'lulus' : 'belum lulus';
                        $activities->push([
                            'id'   => 'quiz_' . $a->id,
                            'type' => 'quiz',
                            'text' => "{$a->user->name} mengerjakan kuis di \"{$courseName}\" — {$status} (skor {$a->score})",
                            'time' => $a->finished_at->diffForHumans(),
                            'sort' => $a->finished_at->timestamp,
                        ]);
                    }
                });

            $recentActivity = $activities->sortByDesc('sort')->take(10)->values()->toArray();

            // ── User Online (aktif dalam 5 menit terakhir) ──
            $onlineUsers = User::where('role', 'pelajar')
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
        } else {
            // Peserta
            $enrollments = Enrollment::with(['course.instructor', 'course.category'])
                ->where('user_id', $user->id)
                ->get();

            $coursesInProgress = $enrollments->where('progress_percent', '<', 100)->where('progress_percent', '>', 0)->count();
            $coursesCompleted = $enrollments->where('progress_percent', 100)->count();
            $certificates = Certificate::where('user_id', $user->id)->count();
            
            $totalHoursLearned = 0;
            foreach ($enrollments as $enrollment) {
                if ($enrollment->course) {
                    $totalHoursLearned += ($enrollment->progress_percent / 100) * $enrollment->course->duration_hours;
                }
            }
            $totalHoursLearned = round($totalHoursLearned);

            $studentStats = [
                'coursesInProgress' => $coursesInProgress,
                'coursesCompleted' => $coursesCompleted,
                'certificates' => $certificates,
                'totalHoursLearned' => $totalHoursLearned,
            ];

            $certificates = Certificate::where('user_id', $user->id)->get()->keyBy('course_id');

            $enrolledCourses = $enrollments->map(function ($enrollment) use ($certificates) {
                $course = $enrollment->course;
                if (!$course) { return null; }
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'short_description' => $course->short_description,
                    'category_name' => $course->category ? $course->category->name : 'Umum',
                    'thumbnail' => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
                    'instructor_name' => $course->instructor ? $course->instructor->name : 'Instruktur',
                    'level' => $course->level,
                    'duration' => $course->duration_hours . ' Jam',
                    'progress' => $enrollment->progress_percent,
                    'enrolled_students' => $course->enrollments()->count(),
                    'rating' => 0,
                    'is_featured' => $course->is_featured,
                    'certificate_id' => isset($certificates[$course->id]) ? $certificates[$course->id]->id : null,
                ];
            })->filter()->values();

            // Ambil kursus yang belum di-enroll
            $enrolledCourseIds = $enrollments->pluck('course_id')->toArray();
            $availableCoursesQuery = Course::with(['instructor', 'category'])
                ->withCount('enrollments')
                ->where('status', 'published')
                ->whereNotIn('id', $enrolledCourseIds)
                ->take(4)
                ->get();

            $availableCourses = $availableCoursesQuery->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'short_description' => $course->short_description,
                    'category_name' => $course->category ? $course->category->name : 'Umum',
                    'thumbnail' => $course->thumbnail ? \Illuminate\Support\Facades\Storage::url($course->thumbnail) : null,
                    'instructor_name' => $course->instructor ? $course->instructor->name : 'Instruktur',
                    'level' => $course->level,
                    'duration' => $course->duration_hours . ' Jam',
                    'progress' => 0,
                    'enrolled_students' => $course->enrollments_count,
                    'rating' => 0,
                    'is_featured' => $course->is_featured,
                ];
            });

            // User pelajar yang sedang online (kecuali diri sendiri)
            $onlineUsers = User::where('role', 'pelajar')
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
}
