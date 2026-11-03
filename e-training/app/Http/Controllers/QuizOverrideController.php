<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizUserOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuizOverrideController extends Controller
{
    /**
     * Daftar peserta kursus beserta keringanan kuis ini (untuk modal admin).
     */
    public function index(Quiz $quiz): JsonResponse
    {
        $course = $this->authorizedCourse($quiz);

        $enrollments = Enrollment::with('user:id,name,email')
            ->where('course_id', $course->id)->get();

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->selectRaw('user_id, count(*) as total')->groupBy('user_id')
            ->pluck('total', 'user_id');

        $overrides = $quiz->overrides()->get()->keyBy('user_id');

        return response()->json([
            'max_attempts' => $quiz->max_attempts,
            'participants' => $enrollments->filter(fn ($e) => $e->user)->map(fn ($e) => [
                'id' => $e->user->id,
                'name' => $e->user->name,
                'email' => $e->user->email,
                'attempts_used' => (int) ($attempts[$e->user->id] ?? 0),
                'override' => ($o = $overrides->get($e->user->id)) ? [
                    'id' => $o->id,
                    'extra_attempts' => $o->extra_attempts,
                    'open_until' => $o->open_until?->toIso8601String(),
                    'reason' => $o->reason,
                ] : null,
            ])->values(),
        ]);
    }

    /**
     * Beri keringanan untuk satu atau banyak peserta.
     * Percobaan ditambahkan ke keringanan sebelumnya; tenggat hanya diganti kalau diisi.
     */
    public function store(Request $request, Quiz $quiz): RedirectResponse
    {
        $course = $this->authorizedCourse($quiz);

        $data = $request->validate([
            'user_ids' => 'required|array|min:1|max:200',
            'user_ids.*' => 'integer|distinct|exists:users,id',
            'extra_attempts' => 'required|integer|min:0|max:10',
            'open_until' => 'nullable|date|after:now',
            'reason' => 'nullable|string|max:500',
        ], [
            'open_until.after' => 'Tenggat baru harus setelah waktu sekarang.',
        ]);

        if ((int) $data['extra_attempts'] === 0 && empty($data['open_until'])) {
            return back()->withErrors(['extra_attempts' => 'Isi tambahan percobaan atau tenggat baru.']);
        }
        if ($course->isExpired()) {
            return back()->withErrors(['user_ids' => 'Masa kursus sudah berakhir, keringanan kuis tidak berlaku.']);
        }

        $enrolled = Enrollment::where('course_id', $course->id)
            ->whereIn('user_id', $data['user_ids'])->count();
        if ($enrolled !== count($data['user_ids'])) {
            return back()->withErrors(['user_ids' => 'Ada peserta yang tidak terdaftar di kursus ini.']);
        }

        foreach ($data['user_ids'] as $userId) {
            $override = QuizUserOverride::firstOrNew([
                'quiz_id' => $quiz->id,
                'user_id' => $userId,
            ]);

            // Percobaan ditambahkan ke keringanan sebelumnya
            $override->extra_attempts = (int) ($override->extra_attempts ?? 0) + (int) $data['extra_attempts'];

            // Tenggat hanya diganti kalau diisi; kosong = tenggat lama tetap
            if (! empty($data['open_until'])) {
                $override->open_until = $data['open_until'];
            }

            $override->granted_by = auth()->id();
            if (! empty($data['reason'])) {
                $override->reason = $data['reason'];
            }
            $override->save();
        }

        return back()->with('success', 'Keringanan diberikan ke ' . count($data['user_ids']) . ' peserta.');
    }

    /**
     * Cabut keringanan.
     */
    public function destroy(Quiz $quiz, QuizUserOverride $override): RedirectResponse
    {
        $this->authorizedCourse($quiz);
        abort_unless((int) $override->quiz_id === (int) $quiz->id, 404);

        $override->delete();

        return back()->with('success', 'Keringanan dicabut.');
    }

    /**
     * Ambil kursus milik kuis, dan pastikan pengajar hanya mengatur kursusnya sendiri.
     */
    private function authorizedCourse(Quiz $quiz): Course
    {
        $course = $quiz->lesson?->module?->course;
        abort_unless($course, 404);
        abort_unless(auth()->user()->canManageCourse($course), 403);

        return $course;
    }
}
