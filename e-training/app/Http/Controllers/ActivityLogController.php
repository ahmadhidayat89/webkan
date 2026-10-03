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
    public function index(Request $request): Response
    {
        $type   = $request->get('type', 'all');   // all | enrollment | certificate | quiz
        $perPage = 30;

        $activities = collect();

        // ── Enrollment ──
        if (in_array($type, ['all', 'enrollment'])) {
            Enrollment::with('user', 'course')
                ->latest()->take(100)->get()
                ->each(function ($e) use (&$activities) {
                    if ($e->user && $e->course) {
                        $activities->push([
                            'id'          => 'enroll_' . $e->id,
                            'type'        => 'enrollment',
                            'user_name'   => $e->user->name,
                            'user_initial'=> strtoupper(substr($e->user->name, 0, 1)),
                            'text'        => "mendaftar kursus \"{$e->course->title}\"",
                            'course'      => $e->course->title,
                            'time'        => $e->created_at->diffForHumans(),
                            'time_full'   => $e->created_at->format('d M Y, H:i'),
                            'sort'        => $e->created_at->timestamp,
                        ]);
                    }
                });
        }

        // ── Certificate ──
        if (in_array($type, ['all', 'certificate'])) {
            Certificate::with('user', 'course')
                ->latest()->take(100)->get()
                ->each(function ($c) use (&$activities) {
                    if ($c->user && $c->course) {
                        $ts = $c->issued_at ?? $c->created_at;
                        $activities->push([
                            'id'          => 'cert_' . $c->id,
                            'type'        => 'certificate',
                            'user_name'   => $c->user->name,
                            'user_initial'=> strtoupper(substr($c->user->name, 0, 1)),
                            'text'        => "mendapat sertifikat \"{$c->course->title}\"",
                            'course'      => $c->course->title,
                            'time'        => $ts->diffForHumans(),
                            'time_full'   => $ts->format('d M Y, H:i'),
                            'sort'        => $ts->timestamp,
                        ]);
                    }
                });
        }

        // ── Quiz ──
        if (in_array($type, ['all', 'quiz'])) {
            QuizAttempt::with(['user', 'quiz.lesson.module.course'])
                ->whereNotNull('finished_at')
                ->latest('finished_at')->take(100)->get()
                ->each(function ($a) use (&$activities) {
                    if ($a->user && $a->quiz) {
                        $course  = optional(optional(optional($a->quiz->lesson)->module)->course);
                        $status  = $a->is_passed ? 'lulus' : 'belum lulus';
                        $activities->push([
                            'id'          => 'quiz_' . $a->id,
                            'type'        => 'quiz',
                            'user_name'   => $a->user->name,
                            'user_initial'=> strtoupper(substr($a->user->name, 0, 1)),
                            'text'        => "mengerjakan kuis di \"{$course->title}\" — {$status} (skor {$a->score})",
                            'course'      => $course->title ?? '-',
                            'passed'      => $a->is_passed,
                            'score'       => $a->score,
                            'time'        => $a->finished_at->diffForHumans(),
                            'time_full'   => $a->finished_at->format('d M Y, H:i'),
                            'sort'        => $a->finished_at->timestamp,
                        ]);
                    }
                });
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
}
