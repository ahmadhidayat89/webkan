<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Certificate;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    private const DISPLAY_DATE_TIME_FORMAT = 'd M Y, H:i';

    public function index(Request $request): Response
    {
        $type   = $request->get('type', 'all');   // all | enrollment | certificate | quiz
        $perPage = 30;

        $activities = collect();

        // ── Enrollment ──
        if (in_array($type, ['all', 'enrollment'])) {
            $this->appendEnrollmentActivities($activities);
        }

        // ── Certificate ──
        if (in_array($type, ['all', 'certificate'])) {
            $this->appendCertificateActivities($activities);
        }

        // ── Quiz ──
        if (in_array($type, ['all', 'quiz'])) {
            $this->appendQuizActivities($activities);
        }

        $sorted = $activities->sortByDesc('sort')->values();
        $total  = $sorted->count();

        // Simple pagination via slice
        $page  = max(1, (int) $request->get('page', 1));
        $items = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        return Inertia::render('Admin/ActivityLog', [
            'activities'  => $items,
            'total'       => $total,
            'perPage'     => $perPage,
            'currentPage' => $page,
            'activeType'  => $type,
        ]);
    }

    private function appendEnrollmentActivities($activities): void
    {
        Enrollment::with('user', 'course')->latest()->take(100)->get()->each(function ($item) use ($activities) {
            if (!$item->user || !$item->course) {
                return;
            }
            $activities->push([
                'id' => 'enroll_' . $item->id, 'type' => 'enrollment',
                'user_name' => $item->user->name,
                'user_initial' => strtoupper(substr($item->user->name, 0, 1)),
                'text' => "mendaftar kursus \"{$item->course->title}\"", 'course' => $item->course->title,
                'time' => $item->created_at->diffForHumans(),
                'time_full' => $item->created_at->format(self::DISPLAY_DATE_TIME_FORMAT),
                'sort' => $item->created_at->timestamp,
            ]);
        });
    }

    private function appendCertificateActivities($activities): void
    {
        Certificate::with('user', 'course')->latest()->take(100)->get()->each(function ($item) use ($activities) {
            if (!$item->user || !$item->course) {
                return;
            }
            $time = $item->issued_at ?? $item->created_at;
            $activities->push([
                'id' => 'cert_' . $item->id, 'type' => 'certificate',
                'user_name' => $item->user->name,
                'user_initial' => strtoupper(substr($item->user->name, 0, 1)),
                'text' => "mendapat sertifikat \"{$item->course->title}\"", 'course' => $item->course->title,
                'time' => $time->diffForHumans(),
                'time_full' => $time->format(self::DISPLAY_DATE_TIME_FORMAT), 'sort' => $time->timestamp,
            ]);
        });
    }

    private function appendQuizActivities($activities): void
    {
        QuizAttempt::with(['user', 'quiz.lesson.module.course'])->whereNotNull('finished_at')
            ->latest('finished_at')->take(100)->get()->each(function ($item) use ($activities) {
                if (!$item->user || !$item->quiz) {
                    return;
                }
                $course = optional(optional(optional($item->quiz->lesson)->module)->course);
                $status = $item->is_passed ? 'lulus' : 'belum lulus';
                $activities->push([
                    'id' => 'quiz_' . $item->id, 'type' => 'quiz',
                    'user_name' => $item->user->name,
                    'user_initial' => strtoupper(substr($item->user->name, 0, 1)),
                    'text' => "mengerjakan kuis di \"{$course->title}\" — {$status} (skor {$item->score})",
                    'course' => $course->title ?? '-', 'passed' => $item->is_passed, 'score' => $item->score,
                    'time' => $item->finished_at->diffForHumans(),
                    'time_full' => $item->finished_at->format(self::DISPLAY_DATE_TIME_FORMAT),
                    'sort' => $item->finished_at->timestamp,
                ]);
            });
    }
}
