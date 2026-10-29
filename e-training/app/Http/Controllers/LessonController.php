<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonFile;
use App\Models\Module;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonController extends Controller
{
    public function store(Request $request, Module $module): RedirectResponse
    {
        $request->validate([
            'title'  => 'required|string|max:255',
            'type'   => 'required|in:video,document,quiz,zoom',
            'video_url' => 'nullable|string|max:2048',
        ]);

        $maxOrder = $module->lessons()->max('sort_order') ?? 0;

        $lesson = $module->lessons()->create([
            'title'       => $request->title,
            'type'        => $request->type,
            'description' => $request->description,
            'video_url'   => $request->video_url,
            'sort_order'  => $maxOrder + 1,
        ]);

        // Auto-buat Quiz jika tipe = quiz
        if ($request->type === 'quiz') {
            Quiz::create([
                'lesson_id'     => $lesson->id,
                'passing_score' => 70,
                'max_attempts'  => 3,
                'quiz_mode'     => 'custom',
            ]);
        }

        return back()->with('success', 'Materi berhasil ditambahkan.');
    }

    public function update(Request $request, Lesson $lesson): RedirectResponse
    {
        $request->validate([
            'title'            => 'sometimes|required|string|max:255',
            'description'      => 'nullable|string',
            'video_url'        => 'nullable|string|max:2048',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_published'     => 'boolean',
            'start_datetime'   => 'nullable|date',
        ]);

        $lesson->update($request->only([
            'title',
            'description',
            'video_url',
            'duration_minutes',
            'is_published',
            'start_datetime',
        ]));

        return back()->with('success', 'Materi berhasil diperbarui.');
    }

    public function destroy(Lesson $lesson): RedirectResponse
    {
        // Hapus file-file terkait dari storage
        foreach ($lesson->files as $file) {
            Storage::disk('public')->delete($file->file_path);
        }
        $lesson->delete();
        return back()->with('success', 'Materi berhasil dihapus.');
    }

    /**
     * Upload file dokumen ke lesson.
     */
    public function uploadFile(Request $request, Lesson $lesson): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|max:8000|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt',
        ]);

        $file = $request->file('file');
        $path = $file->store("lesson-files/{$lesson->id}", 'public');

        LessonFile::create([
            'lesson_id'     => $lesson->id,
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $path,
            'mime_type'     => $file->getMimeType(),
            'file_size_kb'  => (int) ceil($file->getSize() / 1024),
        ]);

        return back()->with('success', 'File berhasil diupload.');
    }

    /**
     * Hapus file dari lesson.
     */
    public function deleteFile(LessonFile $file): RedirectResponse
    {
        Storage::disk('public')->delete($file->file_path);
        $file->delete();
        return back()->with('success', 'File berhasil dihapus.');
    }

    /**
     * Reorder materi dalam modul.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'lessons'              => 'required|array',
            'lessons.*.id'         => 'required|exists:lessons,id',
            'lessons.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->lessons as $item) {
            Lesson::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Urutan materi disimpan.');
    }
}
