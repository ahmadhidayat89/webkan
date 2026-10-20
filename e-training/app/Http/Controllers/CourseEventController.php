<?php

namespace App\Http\Controllers;

use App\Models\CourseEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CourseEventController extends Controller
{
    /**
     * Mengambil 5 event terdekat dari waktu sekarang.
     */
    public function getUpcoming()
    {
        $user = auth()->user();

        $enrolledCourseIds = [];
        if ($user && $user->role === 'peserta') {
            $enrolledCourseIds = \App\Models\Enrollment::where('user_id', $user->id)->pluck('course_id')->toArray();
        }

        // Assessment Events from Quizzes
        $quizzesQuery = \App\Models\Quiz::with('lesson.module.course')
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '>=', now());

        if ($user && $user->role === 'peserta') {
            $quizzesQuery->whereHas('lesson.module.course', function($q) use ($enrolledCourseIds) {
                $q->whereIn('id', $enrolledCourseIds);
            });
        }

        $quizzes = $quizzesQuery->get()->map(function($quiz) {
            $course = $quiz->lesson->module->course;
            return [
                'id' => 'q_'.$quiz->id,
                'title' => 'Tenggat Waktu: ' . $quiz->lesson->title,
                'description' => 'Batas waktu pengerjaan kuis/tugas.',
                'start_datetime' => $quiz->deadline_at->toISOString(),
                'end_datetime' => null,
                'event_type' => 'assessment',
                'course_title' => $course->title ?? '',
                'course_slug' => $course->slug ?? '',
                'course_id' => $course->id ?? null,
                'lesson_id' => $quiz->lesson_id,
            ];
        });

        // Live Session Events from Zoom Lessons
        $zoomQuery = \App\Models\Lesson::with('module.course')
            ->where('type', 'zoom')
            ->whereNotNull('start_datetime')
            ->where('start_datetime', '>=', now());

        if ($user && $user->role === 'peserta') {
            $zoomQuery->whereHas('module.course', function($q) use ($enrolledCourseIds) {
                $q->whereIn('id', $enrolledCourseIds);
            });
        }

        $zooms = $zoomQuery->get()->map(function($lesson) {
            $course = $lesson->module->course;
            return [
                'id' => 'l_'.$lesson->id,
                'title' => 'Sesi Zoom: ' . $lesson->title,
                'description' => 'Sesi tatap muka online untuk materi ini.',
                'start_datetime' => $lesson->start_datetime->toISOString(),
                'end_datetime' => $lesson->duration_minutes ? $lesson->start_datetime->copy()->addMinutes($lesson->duration_minutes)->toISOString() : null,
                'event_type' => 'live_session',
                'course_title' => $course->title ?? '',
                'course_slug' => $course->slug ?? '',
                'course_id' => $course->id ?? null,
                'lesson_id' => $lesson->id,
            ];
        });

        // Deadline Events dari Batas Penyelesaian Kursus
        $courseDeadlines = $this->courseDeadlineEvents($user, $enrolledCourseIds, null, null, true);

        return $quizzes
            ->concat($zooms)
            ->concat($courseDeadlines)
            ->sortBy('start_datetime')
            ->values()
            ->take(5);
    }

    /**
     * Mengambil semua event untuk ditampilkan di kalender.
     */
    public function getCalendarEvents(Request $request)
    {
        $user = auth()->user();

        $enrolledCourseIds = [];
        if ($user && $user->role === 'peserta') {
            $enrolledCourseIds = \App\Models\Enrollment::where('user_id', $user->id)->pluck('course_id')->toArray();
        }

        $quizzesQuery = \App\Models\Quiz::with('lesson.module.course')->whereNotNull('deadline_at');
        $zoomQuery = \App\Models\Lesson::with('module.course')->where('type', 'zoom')->whereNotNull('start_datetime');

        $month = null;
        $year = null;

        // Filter berdasarkan bulan jika parameter diberikan
        if ($request->has('month') && $request->has('year')) {
            $month = (int) $request->month;
            $year = (int) $request->year;
            $quizzesQuery->whereMonth('deadline_at', $month)->whereYear('deadline_at', $year);
            $zoomQuery->whereMonth('start_datetime', $month)->whereYear('start_datetime', $year);
        }

        if ($user && $user->role === 'peserta') {
            $quizzesQuery->whereHas('lesson.module.course', function($q) use ($enrolledCourseIds) {
                $q->whereIn('id', $enrolledCourseIds);
            });
            $zoomQuery->whereHas('module.course', function($q) use ($enrolledCourseIds) {
                $q->whereIn('id', $enrolledCourseIds);
            });
        }

        $quizzes = $quizzesQuery->get()->map(function($quiz) {
            $course = $quiz->lesson->module->course;
            return [
                'id' => 'q_'.$quiz->id,
                'title' => 'Tenggat Waktu: ' . $quiz->lesson->title,
                'description' => 'Batas waktu pengerjaan kuis/tugas.',
                'start_datetime' => $quiz->deadline_at->toISOString(),
                'end_datetime' => null,
                'event_type' => 'assessment',
                'course_title' => $course->title ?? '',
                'course_slug' => $course->slug ?? '',
                'course_id' => $course->id ?? null,
                'lesson_id' => $quiz->lesson_id,
                'date' => $quiz->deadline_at->format('Y-m-d'),
            ];
        });

        $zooms = $zoomQuery->get()->map(function($lesson) {
            $course = $lesson->module->course;
            return [
                'id' => 'l_'.$lesson->id,
                'title' => 'Sesi Zoom: ' . $lesson->title,
                'description' => 'Sesi tatap muka online.',
                'start_datetime' => $lesson->start_datetime->toISOString(),
                'end_datetime' => $lesson->duration_minutes ? $lesson->start_datetime->copy()->addMinutes($lesson->duration_minutes)->toISOString() : null,
                'event_type' => 'live_session',
                'course_title' => $course->title ?? '',
                'course_slug' => $course->slug ?? '',
                'course_id' => $course->id ?? null,
                'lesson_id' => $lesson->id,
                'date' => $lesson->start_datetime->format('Y-m-d'),
            ];
        });

        // Deadline Events dari Batas Penyelesaian Kursus (titik merah)
        $courseDeadlines = $this->courseDeadlineEvents($user, $enrolledCourseIds, $month, $year);

        return $quizzes
            ->concat($zooms)
            ->concat($courseDeadlines)
            ->sortBy('start_datetime')
            ->values();
    }

    /**
     * Event "deadline" dari kolom courses.deadline_at (Batas Penyelesaian Kursus).
     * Peserta hanya melihat kursus published yang diikutinya; admin melihat semua.
     */
    private function courseDeadlineEvents($user, array $enrolledCourseIds, ?int $month = null, ?int $year = null, bool $onlyFuture = false)
    {
        $query = \App\Models\Course::whereNotNull('deadline_at');

        if ($onlyFuture) {
            $query->where('deadline_at', '>=', now());
        }

        if ($month && $year) {
            $query->whereMonth('deadline_at', $month)->whereYear('deadline_at', $year);
        }

        if ($user && $user->role === 'peserta') {
            $query->where('status', 'published')->whereIn('id', $enrolledCourseIds);
        }

        return $query->get()->map(function ($course) {
            $deadline = Carbon::parse($course->deadline_at);
            return [
                'id' => 'c_' . $course->id,
                'title' => 'Batas Penyelesaian: ' . $course->title,
                'description' => 'Batas akhir penyelesaian kursus.',
                'start_datetime' => $deadline->toISOString(),
                'end_datetime' => null,
                'event_type' => 'deadline',
                'course_title' => $course->title ?? '',
                'course_slug' => $course->slug ?? '',
                'course_id' => $course->id,
                'lesson_id' => null,
                'date' => $deadline->format('Y-m-d'),
            ];
        });
    }
}
