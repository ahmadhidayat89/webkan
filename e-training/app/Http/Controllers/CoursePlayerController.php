<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CoursePlayerController extends Controller
{
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
            }
        ])->findOrFail($id);

        $user = auth()->user();
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
            'deadline_at' => $course->deadline_at?->format('d M Y, H:i'),
            'modules' => $course->modules->map(function ($module) use ($lessonProgresses) {
                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'lessons' => $module->lessons->map(function ($lesson) use ($lessonProgresses) {
                        $isCompleted = isset($lessonProgresses[$lesson->id]) ? $lessonProgresses[$lesson->id]->is_completed : false;
                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'type' => $lesson->type, // video, document, quiz, zoom
                            'description' => $lesson->description,
                            'video_url' => $lesson->video_url,
                            'duration_minutes' => $lesson->duration_minutes,
                            'isCompleted' => $isCompleted,
                            'files' => $lesson->files->map(function ($file) {
                                return [
                                    'id' => $file->id,
                                    'original_name' => $file->original_name,
                                    'file_path' => Storage::url($file->file_path),
                                    'mime_type' => $file->mime_type,
                                    'file_size_kb' => $file->file_size_kb,
                                ];
                            })->values(),
                            'quiz' => $lesson->quiz ? [
                                'id' => $lesson->quiz->id,
                                'quiz_mode' => $lesson->quiz->quiz_mode,
                                'duration_minutes' => $lesson->quiz->duration_minutes,
                                'passing_score' => $lesson->quiz->passing_score,
                                'max_attempts' => $lesson->quiz->max_attempts,
                                'shuffle_questions' => $lesson->quiz->shuffle_questions,
                                'questions' => $lesson->quiz->questions->map(function ($q) {
                                    return [
                                        'id' => $q->id,
                                        'question' => $q->question,
                                        'type' => $q->type,
                                        'points' => $q->points,
                                        'explanation' => $q->explanation,
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
                                        'created_at' => $attempt->created_at->format('d M Y, H:i'),
                                    ];
                                })->values(),
                            ] : null,
                        ];
                    })->values(),
                ];
            })->values(),
        ];

        return Inertia::render('CoursePlayer', [
            'courseData' => $formattedCourse,
            'initialLessonId' => request()->query('lesson')
        ]);
    }

    /**
     * Submit a quiz attempt.
     */
    public function submitQuiz(Request $request, $courseId, $quizId)
    {
        $validated = $request->validate([
            'answers' => 'array|required',
            'answers.*' => 'nullable', // answer can be string (essay) or int (option ID)
        ]);

        $user = auth()->user();

        // Kursus sudah lewat deadline: peserta hanya boleh melihat
        $course = Course::findOrFail($courseId);
        if ($course->isExpired()) {
            return back()->withErrors([
                'message' => 'Masa kursus telah berakhir. Kamu hanya dapat melihat materi.',
            ]);
        }

        // Seluruh proses dalam satu transaksi + lock pada baris kuis,
        // sehingga cek batas percobaan dan pembuatan attempt tidak bisa
        // dijalankan bersamaan (mencegah submit ganda).
        $limitError = DB::transaction(function () use ($validated, $user, $quizId, $courseId) {
            $quiz = \App\Models\Quiz::with('questions.options')
                ->lockForUpdate()
                ->findOrFail($quizId);

            // Cek limit attempts jika ada
            if ($quiz->max_attempts) {
                $attemptsCount = \App\Models\QuizAttempt::where('user_id', $user->id)
                    ->where('quiz_id', $quiz->id)
                    ->count();
                if ($attemptsCount >= $quiz->max_attempts) {
                    return 'Anda telah mencapai batas maksimum percobaan untuk kuis ini.';
                }
            }

            $totalQuestions = $quiz->questions->count();
            $correctCount = 0;
            $totalScore = 0;

            $attempt = \App\Models\QuizAttempt::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'score' => 0,
                'correct_answers' => 0,
                'total_questions' => $totalQuestions,
                'is_passed' => null, // Default
                'started_at' => now(), // TODO: Ambil dari state jika ada tracking durasi real
                'finished_at' => now(),
            ]);

            foreach ($quiz->questions as $question) {
                $userAnswer = $validated['answers'][$question->id] ?? null;
                $isCorrect = false;
                $selectedOptionId = null;
                $essayAnswer = null;

                if ($question->type === 'multiple_choice') {
                    $selectedOptionId = $userAnswer;
                    $correctOption = $question->options->firstWhere('is_correct', true);
                    if ($correctOption && $correctOption->id == $selectedOptionId) {
                        $isCorrect = true;
                        $correctCount++;
                    }
                } else {
                    $essayAnswer = $userAnswer;
                }

                \App\Models\QuizAttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'selected_option_id' => $selectedOptionId,
                    'is_correct' => $isCorrect,
                    'essay_answer' => $essayAnswer,
                ]);
            }

            // Kalkulasi nilai
            if ($totalQuestions > 0) {
                $totalScore = round(($correctCount / $totalQuestions) * 100);
            }

            // Update score attempt
            $attempt->score = $totalScore;
            $attempt->correct_answers = $correctCount;

            if ($quiz->quiz_mode === 'essay' || $quiz->quiz_mode === 'custom') {
                $attempt->is_passed = null; // Menunggu penilaian instruktur
            } else {
                $attempt->is_passed = $totalScore >= $quiz->passing_score;
            }

            $attempt->save();

            // Tandai lesson quiz sebagai selesai saat submit (baik lulus, gagal, atau pending essay)
            if ($quiz->lesson_id) {
                \App\Models\LessonProgress::updateOrCreate(
                    ['user_id' => $user->id, 'lesson_id' => $quiz->lesson_id],
                    ['is_completed' => true, 'completed_at' => now(), 'last_accessed_at' => now()]
                );
                $this->updateCourseProgress($user, $courseId);
            }

            return null; // sukses
        });

        if ($limitError) {
            return back()->withErrors(['message' => $limitError]);
        }

        return back();
    }

    /**
     * Mark a lesson as completed for the current user.
     */
    public function markLessonComplete(Request $request, $courseId, $lessonId)
    {
        $user = auth()->user();
        
        // Kursus sudah lewat deadline: tidak bisa menandai selesai
        $course = Course::findOrFail($courseId);
        if ($course->isExpired()) {
            return back()->withErrors([
                'message' => 'Masa kursus telah berakhir. Kamu hanya dapat melihat materi.',
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
        if (!$course) return;

        $allLessonIds = $course->modules->flatMap->lessons->pluck('id');
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