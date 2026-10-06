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
                'created_at'       => $c->created_at->format('d M Y'),
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

        // Format modules
        $modules = $course->modules->map(fn($m) => [
            'id'          => $m->id,
            'title'       => $m->title,
            'description' => $m->description,
            'sort_order'  => $m->sort_order,
            'is_published' => $m->is_published,
            'lessons'     => $m->lessons->map(fn($l) => [
                'id'               => $l->id,
                'title'            => $l->title,
                'type'             => $l->type,
                'description'      => $l->description,
                'video_url'        => $l->video_url,
                'duration_minutes' => $l->duration_minutes,
                'start_datetime'   => $l->start_datetime
                    ? \Carbon\Carbon::parse($l->start_datetime)->format('Y-m-d\TH:i')
                    : null,
                'sort_order'       => $l->sort_order,
                'is_published'     => $l->is_published,
                'files'            => $l->files->map(fn($f) => [
                    'id'            => $f->id,
                    'original_name' => $f->original_name,
                    'file_path'     => Storage::url($f->file_path),
                    'mime_type'     => $f->mime_type,
                    'file_size_kb'  => $f->file_size_kb,
                ])->values(),
                'quiz' => $l->quiz ? [
                    'id'                  => $l->quiz->id,
                    'duration_minutes'    => $l->quiz->duration_minutes,
                    'passing_score'       => $l->quiz->passing_score,
                    'max_attempts'        => $l->quiz->max_attempts,
                    'shuffle_questions'   => $l->quiz->shuffle_questions,
                    'show_correct_answers' => $l->quiz->show_correct_answers,
                    'deadline_at'         => $l->quiz->deadline_at?->format('Y-m-d\TH:i'),
                    'quiz_mode'           => $l->quiz->quiz_mode,
                    'questions'           => $l->quiz->questions->map(fn($q) => [
                        'id'          => $q->id,
                        'question'    => $q->question,
                        'type'        => $q->type,
                        'points'      => $q->points,
                        'sort_order'  => $q->sort_order,
                        'explanation' => $q->explanation,
                        'image_path'  => $q->image_path ? Storage::url($q->image_path) : null,
                        'options'     => $q->options->map(fn($o) => [
                            'id'         => $o->id,
                            'option_text' => $o->option_text,
                            'is_correct' => $o->is_correct,
                            'sort_order' => $o->sort_order,
                        ])->values(),
                    ])->values(),
                ] : null,
            ])->values(),
        ]);

        // Enrolled students
        $enrolledStudents = $course->enrollments->map(fn($e) => [
            'id'              => $e->id,
            'user_id'         => $e->user_id,
            'name'            => $e->user->name,
            'email'           => $e->user->email,
            'organization'    => $e->user->organization,
            'progress_percent' => $e->progress_percent,
            'status'          => $e->status,
            'enrolled_at'     => $e->enrolled_at->format('d M Y'),
        ])->values();

        // Certificates
        $certificates = $course->certificates->map(fn($cert) => [
            'id'                 => $cert->id,
            'user_id'            => $cert->user_id,
            'name'               => $cert->user->name,
            'certificate_number' => $cert->certificate_number,
            'issued_at'          => $cert->issued_at->format('d M Y'),
            'file_path'          => $cert->file_path ? Storage::url($cert->file_path) : null,
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
                'deadline_at'                  => $course->deadline_at?->format('Y-m-d\TH:i'),
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
            if ($course->thumbnail) Storage::delete($course->thumbnail);
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
