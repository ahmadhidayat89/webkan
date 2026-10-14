<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    private const DISPLAY_DATE_FORMAT = 'd M Y';
    private const DATETIME_LOCAL_FORMAT = 'Y-m-d\\TH:i';

    /**
     * Daftar semua kursus untuk Studio Konten (Admin).
     */
    public function index(): Response
    {
        $courses = Course::withTrashed(false)
            ->with(['category', 'modules'])
            ->withCount(['enrollments', 'modules'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($c) => [
                'id'               => $c->id,
                'title'            => $c->title,
                'slug'             => $c->slug,
                'status'           => $c->status,
                'level'            => $c->level,
                'thumbnail'        => $c->thumbnail ? Storage::url($c->thumbnail) : null,
                'category'         => $c->category?->name,
                'modules_count'    => $c->modules_count,
                'enrollments_count' => $c->enrollments_count,
                'created_at'       => $c->created_at->format(self::DISPLAY_DATE_FORMAT),
                'referral_code'    => $c->referral_code,
            ]);

        return Inertia::render('Admin/CreatorStudio', [
            'courses' => $courses,
        ]);
    }

    /**
     * Simpan kursus baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'             => 'required|string|max:255',
            'description'       => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category_id'       => 'nullable|exists:categories,id',
            'level'             => 'required|in:pemula,menengah,lanjutan',
            'duration_hours'    => 'nullable|integer|min:1',
        ]);

        $slug = Str::slug($validated['title']);
        $baseSlug = $slug;
        $i = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i++;
        }

        $course = Course::create([
            ...$validated,
            'slug'           => $slug,
            'instructor_id'  => Auth::id(),
            'status'         => 'draft',
            'referral_code'  => strtoupper(Str::random(8)),
        ]);

        return redirect()->route('admin.courses.edit', $course->id)
            ->with('success', 'Kursus berhasil dibuat!');
    }

    /**
     * Halaman editor 5-tab kursus.
     */
    public function edit(Course $course): Response
    {
        // Load semua data yang dibutuhkan 5 tab
        $course->load([
            'category',
            'modules.lessons.quiz.questions.options',
            'modules.lessons.files',
            'enrollments.user',
            'certificates.user',
        ]);

        $modules = $course->modules->map(fn ($module) => $this->formatModule($module))->values();

        // Enrolled students
        $enrolledStudents = $course->enrollments->map(fn($e) => [
            'id'              => $e->id,
            'user_id'         => $e->user_id,
            'name'            => $e->user->name,
            'email'           => $e->user->email,
            'organization'    => $e->user->organization,
            'progress_percent' => $e->progress_percent,
            'status'          => $e->status,
            'enrolled_at'     => $e->enrolled_at->format(self::DISPLAY_DATE_FORMAT),
            'completed_at'     => $e->completed_at?->format('Y-m-d'),
        ])->values();

        // Certificates
        $certificates = $course->certificates->map(fn($cert) => [
            'id'                 => $cert->id,
            'user_id'            => $cert->user_id,
            'name'               => $cert->user->name,
            'certificate_number' => $cert->certificate_number,
            'issued_at'          => $cert->issued_at?->format(self::DISPLAY_DATE_FORMAT),
            'file_path'          => $cert->file_path ? Storage::url($cert->file_path) : null,
            'recipient_name'     => $cert->recipient_name,
            'status'             => $cert->status,
            'event_text'         => $cert->event_text,
            'signer_name'        => $cert->signer_name,
            'signer_title'       => $cert->signer_title,
        ])->values();

        // All pelajar (for enroll dropdown)
        $allStudents = \App\Models\User::where('role', 'pelajar')
            ->whereNotIn('id', $course->enrollments->pluck('user_id'))
            ->get(['id', 'name', 'email', 'organization']);

        $categories = Category::all(['id', 'name']);

        return Inertia::render('Admin/CourseEditor', [
            'course' => [
                'id'                => $course->id,
                'title'             => $course->title,
                'slug'              => $course->slug,
                'description'       => $course->description,
                'short_description' => $course->short_description,
                'thumbnail'                    => $course->thumbnail ? Storage::url($course->thumbnail) : null,
                'level'                        => $course->level,
                'duration_hours'               => $course->duration_hours,
                'deadline_at'                  => $course->deadline_at?->format(self::DATETIME_LOCAL_FORMAT),
                'status'                       => $course->status,
                'category_id'                  => $course->category_id,
                'referral_code'                => $course->referral_code,
                'certificate_template_url'     => $course->certificate_template ? Storage::url($course->certificate_template) : null,
                'certificate_signature_url'    => $course->certificate_signature ? Storage::url($course->certificate_signature) : null,
                'modules'                      => $modules,
                'enrolled_students'            => $enrolledStudents,
                'certificates'                 => $certificates,
            ],
            'categories'   => $categories,
            'allStudents'  => $allStudents,
        ]);
    }

    private function formatModule($module): array
    {
        return [
            'id' => $module->id,
            'title' => $module->title,
            'description' => $module->description,
            'sort_order' => $module->sort_order,
            'is_published' => $module->is_published,
            'lessons' => $module->lessons->map(fn ($lesson) => $this->formatLesson($lesson))->values(),
        ];
    }

    private function formatLesson($lesson): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'type' => $lesson->type,
            'description' => $lesson->description,
            'video_url' => $lesson->video_url,
            'duration_minutes' => $lesson->duration_minutes,
            'start_datetime' => $lesson->start_datetime
                ? \Carbon\Carbon::parse($lesson->start_datetime)->format(self::DATETIME_LOCAL_FORMAT)
                : null,
            'sort_order' => $lesson->sort_order,
            'is_published' => $lesson->is_published,
            'files' => $lesson->files->map(fn ($file) => $this->formatLessonFile($file))->values(),
            'quiz' => $lesson->quiz ? $this->formatQuiz($lesson->quiz) : null,
        ];
    }

    private function formatLessonFile($file): array
    {
        return [
            'id' => $file->id,
            'original_name' => $file->original_name,
            'file_path' => Storage::url($file->file_path),
            'mime_type' => $file->mime_type,
            'file_size_kb' => $file->file_size_kb,
        ];
    }

    private function formatQuiz($quiz): array
    {
        return [
            'id' => $quiz->id,
            'duration_minutes' => $quiz->duration_minutes,
            'passing_score' => $quiz->passing_score,
            'max_attempts' => $quiz->max_attempts,
            'shuffle_questions' => $quiz->shuffle_questions,
            'show_correct_answers' => $quiz->show_correct_answers,
            'deadline_at' => $quiz->deadline_at?->format(self::DATETIME_LOCAL_FORMAT),
            'quiz_mode' => $quiz->quiz_mode,
            'questions' => $quiz->questions->map(fn ($question) => $this->formatQuizQuestion($question))->values(),
        ];
    }

    private function formatQuizQuestion($question): array
    {
        return [
            'id' => $question->id,
            'question' => $question->question,
            'type' => $question->type,
            'points' => $question->points,
            'sort_order' => $question->sort_order,
            'explanation' => $question->explanation,
            'image_path' => $question->image_path ? Storage::url($question->image_path) : null,
            'options' => $question->options->map(fn ($option) => [
                'id' => $option->id,
                'option_text' => $option->option_text,
                'is_correct' => $option->is_correct,
                'sort_order' => $option->sort_order,
            ])->values(),
        ];
    }

    /**
     * Update detail kursus.
     */
    public function update(Request $request, Course $course): RedirectResponse
    {
        $validated = $request->validate([
            'title'             => 'required|string|max:255',
            'description'       => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category_id'       => 'nullable|exists:categories,id',
            'level'             => 'required|in:pemula,menengah,lanjutan',
            'duration_hours'    => 'nullable|integer|min:1',
            'status'            => 'required|in:draft,published',
            'deadline_at'       => 'nullable|date',
        ]);

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $request->validate(['thumbnail' => 'image|max:2048']);
            if ($course->thumbnail) {
                Storage::delete($course->thumbnail);
            }
            $validated['thumbnail'] = $request->file('thumbnail')
                ->store('thumbnails', 'public');
        }

        $course->update($validated);

        return back()->with('success', 'Detail kursus berhasil disimpan.');
    }

    /**
     * Hapus kursus.
     */
    public function destroy(Course $course): RedirectResponse
    {
        $course->delete();
        return redirect()->route('admin.courses.index')
            ->with('success', 'Kursus berhasil dihapus.');
    }

    /**
     * Generate ulang referral code.
     */
    public function regenerateReferral(Course $course): RedirectResponse
    {
        $course->update(['referral_code' => strtoupper(Str::random(8))]);
        return back()->with('success', 'Kode referral berhasil diperbarui.');
    }
}
