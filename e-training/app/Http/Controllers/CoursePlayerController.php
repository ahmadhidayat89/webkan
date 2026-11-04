<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Support\Collection;
use App\Services\ModuleProgression;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CoursePlayerController extends Controller
{
    private const DATETIME_LABEL_FORMAT = 'd M Y, H:i';

    /**
     * Show the course player with its modules, lessons, and quizzes.
     */
    public function show($id)
    {
        $course = Course::with([
            'modules' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'modules.lessons' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'modules.lessons.files',
            'modules.lessons.quiz.questions' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'modules.lessons.quiz.questions.options' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'modules.lessons.quiz.attempts' => function ($query) {
                // Terbaru dulu (attempts[0] dipakai frontend sebagai attempt terakhir)
                $query->where('user_id', auth()->id())
                    ->orderBy('created_at', 'desc')
                    ->orderBy('id', 'desc');
            },
            'modules.lessons.quiz.overrides' => function ($query) {
                $query->where('user_id', auth()->id());
            }
        ])->findOrFail($id);

        $user = auth()->user();
        $progression = app(ModuleProgression::class);
        $progression->authorizeCourse($course, $user);
        $moduleLocks = $progression->lockedModules($course, $user);
        $lessonLocks = $progression->lockedLessons($course, $user);
        $hiddenModuleIds = $progression->hiddenModuleIds($course, $user);
        $canBypassSchedule = $user->canBypassSchedule($course);
        $lessonProgresses = \App\Models\LessonProgress::where('user_id', $user->id)
            ->whereIn('lesson_id', $course->modules->flatMap->lessons->pluck('id'))
            ->get()
            ->keyBy('lesson_id');

        $certificate = \App\Models\Certificate::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        // Format data to match the frontend expectations in CoursePlayerLayout and CoursePlayer.
        $formattedCourse = [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'certificate_id' => $certificate ? $certificate->id : null,
            'isExpired' => $course->isExpired(),
            'server_now' => now()->toIso8601String(),
            'can_bypass_schedule' => $canBypassSchedule,
            'deadline_at' => $course->deadline_at?->format(self::DATETIME_LABEL_FORMAT),
            'modules' => $course->modules
                ->reject(fn($module) => in_array($module->id, $hiddenModuleIds, true))
                ->map(fn($module) => $this->formatPlayerModule($module, $lessonProgresses, $moduleLocks, $lessonLocks))
                ->values(),
        ];

        return Inertia::render('CoursePlayer', [
            'courseData' => $formattedCourse,
            'initialLessonId' => request()->query('lesson')
        ]);
    }

    private function formatPlayerModule(Module $module, Collection $lessonProgresses, array $moduleLocks, array $lessonLocks): array
    {
        $lockedReason = $moduleLocks[$module->id] ?? null;
        return [
            'id' => $module->id,
            'title' => $module->title,
            'description' => $lockedReason === null ? $module->description : null,
            'requires_completion' => $module->requires_completion,
            'locked_reason' => $lockedReason,
            'start_at' => $module->start_at?->toIso8601String(),
            'start_at_label' => $module->start_at?->format(self::DATETIME_LABEL_FORMAT),
            'end_at' => $module->end_at?->toIso8601String(),
            'end_at_label' => $module->end_at?->format(self::DATETIME_LABEL_FORMAT),
            'lessons' => $module->lessons
                ->filter(fn($lesson) => auth()->user()->role !== 'peserta' || $lesson->is_published)
                ->map(fn($lesson) => $this->formatPlayerLesson($lesson, $module, $lessonProgresses, $lockedReason ?? $lessonLocks[$lesson->id] ?? null))->values(),
        ];
    }

    private function formatPlayerLesson(Lesson $lesson, Module $module, Collection $lessonProgresses, ?string $lockedReason): array
    {
        $isCompleted = $lessonProgresses->get($lesson->id)?->is_completed ?? false;
        if ($lockedReason !== null) {
            return [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'type' => $lesson->type,
                'isCompleted' => $isCompleted,
                'files' => [],
                'quiz' => null,
                'locked_reason' => $lockedReason,
            ];
        }
        // Jadwal kuis tidak boleh keluar dari jadwal modulnya, kecuali ada keringanan aktif
        $override = $lesson->quiz?->overrides->first();
        $quizStart = collect([$lesson->quiz?->start_at, $module->start_at])->filter()->max();
        $quizEnd = $override?->bypassesSchedule()
            ? $override->open_until
            : collect([$lesson->quiz?->deadline_at, $module->end_at])->filter()->min();
        $maxAttempts = $lesson->quiz?->max_attempts
            ? $lesson->quiz->max_attempts + ($override?->extra_attempts ?? 0)
            : null;
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'type' => $lesson->type, // video, document, quiz, zoom
            'description' => $lesson->description,
            'video_url' => $lesson->video_url,
            'duration_minutes' => $lesson->duration_minutes,
            'isCompleted' => $isCompleted,
            'locked_reason' => null,
            'files' => $lesson->files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'file_path' => route('learning.files.lesson', $file),
                    'mime_type' => $file->mime_type,
                    'file_size_kb' => $file->file_size_kb,
                ];
            })->values(),
            'quiz' => $lesson->quiz ? [
                'id' => $lesson->quiz->id,
                'quiz_mode' => $lesson->quiz->quiz_mode,
                'duration_minutes' => $lesson->quiz->duration_minutes,
                'passing_score' => $lesson->quiz->passing_score,
                'max_attempts' => $maxAttempts,
                'has_override' => $override !== null,
                'start_at' => $quizStart?->toIso8601String(),
                'start_at_label' => $quizStart?->format(self::DATETIME_LABEL_FORMAT),
                'deadline_at' => $quizEnd?->toIso8601String(),
                'deadline_at_label' => $quizEnd?->format(self::DATETIME_LABEL_FORMAT),
                'shuffle_questions' => $lesson->quiz->shuffle_questions,
                'review_mode' => $lesson->quiz->review_mode ?? 'off',
                'has_random_questions' => \Illuminate\Support\Facades\DB::table('quiz_random_groups')->where('quiz_id', $lesson->quiz->id)->exists(),
                'questions' => app(\App\Services\QuestionBankService::class)->questionsFor($lesson->quiz, auth()->user())->map(function ($q) {
                    return [
                        'id' => $q->id,
                        'question' => $q->question,
                        'type' => $q->type,
                        'points' => $q->points,
                        'explanation' => auth()->user()->role === 'peserta' ? null : $q->explanation,
                        'image_path' => $q->image_path ? Storage::url($q->image_path) : null,
                        // 'is_correct' sengaja TIDAK dikirim ke browser agar kunci jawaban
                        // tidak bisa dilihat peserta. Penilaian dilakukan di server.
                        'options' => $q->options->map(function ($opt) {
                            return [
                                'id' => $opt->id,
                                'option_text' => $opt->option_text,
                            ];
                        })->values(),
                    ];
                })->values(),
                'attempts' => $lesson->quiz->attempts->map(function ($attempt) {
                    return [
                        'id' => $attempt->id,
                        'score' => $attempt->score,
                        'is_passed' => $attempt->is_passed,
                        'is_finished' => $attempt->finished_at !== null,
                        'created_at' => $attempt->created_at->format(self::DATETIME_LABEL_FORMAT),
                    ];
                })->values(),
            ] : null,
        ];
    }

    public function startQuiz(Request $request, Course $course, \App\Models\Quiz $quiz)
    {
        abort_unless($quiz->lesson->module->course_id === $course->id, 404);
        app(ModuleProgression::class)->authorizeLesson($quiz->lesson, $request->user());
        abort_if($course->isExpired(), 422, 'Masa kursus telah berakhir.');
        DB::transaction(function () use ($quiz, $request, $course) {
            $quiz = \App\Models\Quiz::lockForUpdate()->findOrFail($quiz->id);
            $override = \App\Models\QuizUserOverride::where('quiz_id', $quiz->id)->where('user_id', $request->user()->id)->first();
            $error = $request->user()->canBypassSchedule($course) ? null : $quiz->submissionBlockedReason($override);
            if ($error) {
                throw \Illuminate\Validation\ValidationException::withMessages(['message' => $error]);
            }
            if ($this->hasReachedAttemptLimit($quiz, $request->user()->id, $override?->extra_attempts ?? 0)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['message' => 'Batas percobaan kuis telah tercapai.']);
            }
            app(\App\Services\QuestionBankService::class)->questionsFor($quiz, $request->user(), start: true);
        });
        return back();
    }

    /**
     * Review satu percobaan kuis milik peserta yang sedang login.
     * Kunci jawaban hanya dikirim jika review_mode = with_answers.
     */
    public function reviewAttempt(Request $request, Course $course, \App\Models\Quiz $quiz, \App\Models\QuizAttempt $attempt)
    {
        $user = $request->user();

        abort_unless($quiz->lesson->module->course_id === $course->id, 404);
        abort_unless($attempt->quiz_id === $quiz->id && $attempt->user_id === $user->id, 404);
        abort_if(($quiz->review_mode ?? 'off') === 'off', 403, 'Review kuis ini belum dibuka.');
        abort_if($attempt->finished_at === null, 404);

        $withAnswers = $quiz->review_mode === 'with_answers';

        $answers = $attempt->answers()
            ->with(['question.options', 'selectedOption'])
            ->get()
            ->sortBy(fn($a) => $a->question->sort_order ?? 0)
            ->values();

        $items = $answers->map(function ($a) use ($withAnswers) {
            $q = $a->question;
            $isManual = in_array($q->type, ['essay', 'short_answer'], true);
            $hasText = $a->essay_answer !== null && trim($a->essay_answer) !== '';

            if ($isManual && $a->manual_score === null && $hasText) {
                $state = 'pending';
                $earned = null;
            } elseif ($isManual && $a->manual_score !== null) {
                $state = $a->is_correct ? 'correct' : 'wrong';
                $earned = round(($a->manual_score / 100) * $q->points, 2);
            } else {
                $state = $a->is_correct ? 'correct' : 'wrong';
                $earned = $a->is_correct ? $q->points : 0;
            }

            return [
                'id' => $q->id,
                'question' => $q->question,
                'type' => $q->type,
                'points' => $q->points,
                'image_path' => $q->image_path ? Storage::url($q->image_path) : null,
                'state' => $state,
                'earned_points' => $earned,
                'manual_score' => $a->manual_score,
                'feedback' => $a->admin_feedback,
                'essay_answer' => $a->essay_answer,
                'selected_option_id' => $a->selected_option_id,
                'options' => $q->options->map(fn($o) => array_filter([
                    'id' => $o->id,
                    'option_text' => $o->option_text,
                    // is_correct hanya ikut terkirim pada mode with_answers
                    'is_correct' => $withAnswers ? (bool) $o->is_correct : null,
                ], fn($v) => $v !== null))->values(),
                'explanation' => $withAnswers ? $q->explanation : null,
            ];
        })->values();

        return response()->json([
            'review_mode' => $quiz->review_mode,
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'is_passed' => $attempt->is_passed,
                'pending_grading' => $items->contains('state', 'pending'),
            ],
            'items' => $items,
        ]);
    }

    /**
     * Submit a quiz attempt.
     */
    public function submitQuiz(Request $request, $courseId, $quizId)
    {
        $validated = $request->validate([
            'answers' => 'array|required',
            'answers.*' => 'nullable', // string (essay) atau int (ID opsi)
        ]);

        $user = auth()->user();

        // Kursus sudah lewat deadline: peserta hanya boleh melihat
        $course = Course::findOrFail($courseId);
        if ($user->role === 'pengajar') {
            abort_unless($user->canManageCourse($course), 403);
        }
        if ($course->isExpired()) {
            return back()->withErrors([
                'message' => 'Masa kursus telah berakhir. Kamu hanya dapat melihat materi.',
            ]);
        }

        $quiz = \App\Models\Quiz::findOrFail($quizId);
        abort_unless($quiz->lesson->module->course_id == $courseId, 404);
        app(ModuleProgression::class)->authorizeLesson($quiz->lesson, $user);

        $bypassSchedule = $user->canBypassSchedule($course);
        $limitError = $this->storeQuizAttempt($validated['answers'], $user, $quizId, $courseId, $bypassSchedule);

        if ($limitError) {
            return back()->withErrors(['message' => $limitError]);
        }

        return back();
    }

    private function storeQuizAttempt(array $answers, $user, $quizId, $courseId, bool $bypassSchedule = false): ?string
    {
        return DB::transaction(function () use ($answers, $user, $quizId, $courseId, $bypassSchedule) {
            $quiz = \App\Models\Quiz::with('questions.options')->lockForUpdate()->findOrFail($quizId);
            $attemptError = $this->validateQuizAttemptAccess($quiz, $user, $bypassSchedule);
            if ($attemptError !== null) {
                return $attemptError;
            }

            $selected = app(\App\Services\QuestionBankService::class)->questionsFor($quiz, $user, requireDraw: true);
            if (array_diff(array_map('intval', array_keys($answers)), $selected->pluck('id')->all())) {
                return 'Jawaban tidak sesuai dengan paket soal yang diberikan.';
            }
            $quiz->setRelation('questions', $selected);

            $attempt = \App\Models\QuizAttempt::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'score' => 0,
                'correct_answers' => 0,
                'total_questions' => $quiz->questions->count(),
                'is_passed' => null,
                'started_at' => now(),
                'finished_at' => now(),
            ]);

            [$correctCount, $earnedPoints] = $this->storeAttemptAnswers($attempt, $quiz, $answers);
            $this->updateAttemptScore($attempt, $quiz, $correctCount, $earnedPoints);
            $this->completeQuizLesson($quiz, $user, $courseId);
            return null;
        });
    }

    private function validateQuizAttemptAccess($quiz, $user, bool $bypassSchedule): ?string
    {
        $override = \App\Models\QuizUserOverride::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)->first();
        $blockedReason = $bypassSchedule ? null : $quiz->submissionBlockedReason($override);
        if ($blockedReason !== null) {
            return $blockedReason;
        }
        if ($this->hasReachedAttemptLimit($quiz, $user->id, $override?->extra_attempts ?? 0)) {
            return 'Anda telah mencapai batas maksimum percobaan untuk kuis ini.';
        }

        return null;
    }

    private function hasReachedAttemptLimit($quiz, int $userId, int $extraAttempts = 0): bool
    {
        if (!$quiz->max_attempts) {
            return false;
        }
        return \App\Models\QuizAttempt::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)->count() >= $quiz->max_attempts + $extraAttempts;
    }

    /**
     * Simpan semua jawaban. Return [jumlah benar, poin yang didapat].
     */
    private function storeAttemptAnswers($attempt, $quiz, array $answers): array
    {
        $correctCount = 0;
        $earnedPoints = 0;

        foreach ($quiz->questions as $question) {
            $isCorrect = $this->storeAttemptAnswer($attempt, $question, $answers[$question->id] ?? null);

            if ($isCorrect) {
                $correctCount++;
                $earnedPoints += $question->points ?? 1;
            }
        }

        return [$correctCount, $earnedPoints];
    }

    private function storeAttemptAnswer($attempt, $question, $answer): bool
    {
        // Pilihan Ganda dan Benar/Salah: dinilai otomatis lewat opsi yang dipilih
        $usesOptions = in_array($question->type, ['multiple_choice', 'true_false'], true);

        $selected = $usesOptions ? $question->options->firstWhere('id', (int) $answer) : null;
        $isCorrect = $usesOptions && $selected && $selected->is_correct;

        // Essay dan Jawaban Singkat: disimpan sebagai teks, dinilai manual
        $text = $usesOptions ? null : $answer;
        if ($question->type === 'short_answer' && $text !== null) {
            $text = mb_substr((string) $text, 0, 255);
        }

        \App\Models\QuizAttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_option_id' => $selected?->id,
            'is_correct' => $isCorrect,
            'essay_answer' => $text,
        ]);

        return $isCorrect;
    }

    private function updateAttemptScore($attempt, $quiz, int $correctCount, int $earnedPoints): void
    {
        $totalPoints = $quiz->questions->sum(fn($q) => $q->points ?? 1);
        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;

        // Menunggu penilaian hanya jika kuis ini benar-benar punya soal essay
        $hasEssay = $quiz->questions->contains(
            fn($q) => in_array($q->type, ['essay', 'short_answer'], true)
        );

        $attempt->score = $score;
        $attempt->correct_answers = $correctCount;
        $attempt->is_passed = $hasEssay ? null : $score >= $quiz->passing_score;
        $attempt->save();
    }

    private function completeQuizLesson($quiz, $user, $courseId): void
    {
        if (!$quiz->lesson_id) {
            return;
        }
        \App\Models\LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $quiz->lesson_id],
            ['is_completed' => true, 'completed_at' => now(), 'last_accessed_at' => now()]
        );
        $this->updateCourseProgress($user, $courseId);
    }

    /**
     * Mark a lesson as completed for the current user.
     */
    public function markLessonComplete($courseId, $lessonId)
    {
        $user = auth()->user();

        // Kursus sudah lewat deadline: tidak bisa menandai selesai
        $course = Course::findOrFail($courseId);
        if ($user->role === 'pengajar') {
            abort_unless($user->canManageCourse($course), 403);
        }
        if ($course->isExpired()) {
            return back()->withErrors([
                'message' => 'Masa kursus telah berakhir. Kamu hanya dapat melihat materi.',
            ]);
        }

        $lesson = \App\Models\Lesson::findOrFail($lessonId);
        abort_unless($lesson->module->course_id == $courseId, 404);
        app(ModuleProgression::class)->authorizeLesson($lesson, $user);
        abort_if($lesson->type === 'quiz', 403, 'Selesaikan kuis dengan mengirim jawaban.');

        // Modul harus sedang dibuka (belum dibuka / sudah ditutup: tidak bisa ditandai selesai)
        $module = \App\Models\Module::whereHas('lessons', fn($q) => $q->where('id', $lessonId))->first();
        if ($module && ! $user->canBypassSchedule($course) && ! $module->isOpen()) {
            return back()->withErrors([
                'message' => 'Modul ini sedang tidak dibuka, jadi materi tidak bisa ditandai selesai.',
            ]);
        }

        // 1. Mark lesson as completed
        \App\Models\LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            ['is_completed' => true, 'completed_at' => now(), 'last_accessed_at' => now()]
        );

        // 2. Recalculate enrollment progress
        $this->updateCourseProgress($user, $courseId);

        return back()->with('success', 'Materi ditandai selesai.');
    }

    /**
     * Helper to update course progress based on completed lessons
     */
    private function updateCourseProgress($user, $courseId)
    {
        $course = Course::with('modules.lessons')->find($courseId);
        if (!$course) {
            return;
        }

        // Modul terbatas yang tidak bisa diakses peserta ini tidak ikut dihitung
        $hiddenModuleIds = app(ModuleProgression::class)->hiddenModuleIds($course, $user);
        $allLessonIds = $course->modules
            ->reject(fn($module) => in_array($module->id, $hiddenModuleIds, true))
            ->flatMap->lessons->pluck('id');
        $totalLessons = $allLessonIds->count();

        if ($totalLessons > 0) {
            $completedLessonsCount = \App\Models\LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $allLessonIds)
                ->where('is_completed', true)
                ->count();

            $progressPercent = round(($completedLessonsCount / $totalLessons) * 100);

            $enrollment = \App\Models\Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            if ($enrollment) {
                $enrollment->progress_percent = $progressPercent;
                if ($progressPercent >= 100 && !$enrollment->completed_at) {
                    $enrollment->completed_at = now();
                }
                $enrollment->save();
            }
        }
    }
}
