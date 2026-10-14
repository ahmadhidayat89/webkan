<?php

namespace App\Http\Controllers;

use App\Models\CourseEvent;
use Illuminate\Http\Request;

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

        $events = $quizzes->concat($zooms)->sortBy('start_datetime')->values()->take(5);

        return $events;
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

        $events = $quizzes->concat($zooms)->sortBy('start_datetime')->values();

        return $events;
    }
}
