<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use App\Models\Lesson;
use App\Services\ModuleProgression;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DiscussionController extends Controller
{
    private const SQLI_PATTERNS = [
        '/[\'"]\s*(or|and)\s+\S+\s*=\s*\S+/i',
        '/\b(or|and)\s+(\d+)\s*=\s*\2\b/i',
        '/\bunion\s+(all\s+)?select\b/i',
        '/\b(drop|truncate|alter)\s+table\b/i',
        '/[\'"]\s*--/',
        '/\bxp_cmdshell\b/i',
        '/\bsleep\s*\(\s*\d+\s*\)/i',
        '/\bbenchmark\s*\(/i',
    ];

    /**
     * Ambil semua pesan diskusi untuk lesson tertentu (JSON).
     */
    public function index(Request $request, Lesson $lesson)
    {
        $this->authorizeLessonAccess($lesson);
        $discussions = $lesson->discussions()
            ->with('user')
            ->orderBy('created_at')
            ->get();

        if ($request->boolean('mark_read') && $discussions->isNotEmpty()) {
            $maxId = (int) $discussions->max('id');
            Cache::forever(self::readCacheKey((int) auth()->id(), (int) $lesson->id), $maxId);
        }

        $messages = $discussions->map(fn($d) => $this->formatMessage($d));

        return response()->json($messages);
    }

    /**
     * Kirim pesan baru (teks dan/atau file).
     */
    public function store(Request $request, Lesson $lesson)
    {
        $this->authorizeLessonAccess($lesson);
        $request->validate([
            'message' => 'nullable|string|max:2000',
            'file'    => 'nullable|file|max:1024|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,png,jpg,jpeg',
        ]);

        if (!$request->filled('message') && !$request->hasFile('file')) {
            return response()->json(['error' => 'Pesan atau file harus diisi.'], 422);
        }

        if ($request->filled('message') && $this->looksLikeSqli($request->input('message'))) {
            Log::warning('Discussion message blocked by SQLi filter', [
                'user_id'   => $request->user()?->id,
                'lesson_id' => $lesson->id,
            ]);

            return response()->json([
                'error' => 'Jawaban mengandung pola yang tidak diizinkan.',
            ], 422);
        }

        $filePath = $fileName = $fileType = $fileSize = null;

        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileType = $file->getMimeType();
            $fileSize = $file->getSize();
            $filePath = $file->store("discussions/lesson_{$lesson->id}", 'local');
        }

        $discussion = Discussion::create([
            'lesson_id' => $lesson->id,
            'user_id'   => auth()->id(),
            'message'   => $request->input('message'),
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size' => $fileSize,
        ]);

        $discussion->load('user');
        Cache::forever(self::readCacheKey((int) auth()->id(), (int) $lesson->id), (int) $discussion->id);

        return response()->json($this->formatMessage($discussion), 201);
    }

    public static function readCacheKey(int $userId, int $lessonId): string
    {
        return "discussion_read:user_{$userId}:lesson_{$lessonId}";
    }

    /**
     * Hapus pesan (hanya milik sendiri atau admin).
     */
    public function destroy(Lesson $lesson, Discussion $discussion)
    {
        $user = auth()->user();

        abort_unless($discussion->lesson_id === $lesson->id, 404);
        $this->authorizeLessonAccess($lesson);
        if ($discussion->user_id !== $user->id && !$user->canManageCourse($lesson->module->course)) {
            return response()->json(['error' => 'Tidak diizinkan.'], 403);
        }

        if ($discussion->file_path) {
            Storage::disk('local')->delete($discussion->file_path);
            Storage::disk('public')->delete($discussion->file_path);
        }

        $discussion->delete();

        return response()->json(['success' => true]);
    }

    private function authorizeLessonAccess(Lesson $lesson): void
    {
        $user = auth()->user();
        app(ModuleProgression::class)->authorizeLesson($lesson, $user);

        if ($user->role === 'peserta' && $lesson->type === 'quiz') {
            $hasCompletedQuiz = $lesson->progress()->where('user_id', $user->id)->where('is_completed', true)->exists()
                || ($lesson->quiz && $lesson->quiz->attempts()->where('user_id', $user->id)->whereNotNull('finished_at')->exists());

            abort_unless($hasCompletedQuiz, 403, 'Selesaikan kuis terlebih dahulu untuk mengakses diskusi.');
        }
    }

    private function looksLikeSqli(string $value): bool
    {
        foreach (self::SQLI_PATTERNS as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        return false;
    }

    private function formatMessage(Discussion $d): array
    {
        return [
            'id'         => $d->id,
            'message'    => $d->message,
            'file_path'  => $d->file_path ? route('learning.files.discussion', $d) : null,
            'file_name'  => $d->file_name,
            'file_type'  => $d->file_type,
            'file_size'  => $d->file_size,
            'created_at' => $d->created_at->format('d M Y, H:i'),
            'time_ago'   => $d->created_at->diffForHumans(),
            'user' => [
                'id'       => $d->user->id,
                'name'     => $d->user->name,
                'username' => $d->user->username,
                'role'     => $d->user->role,
                'is_admin' => in_array($d->user->role, ['admin', 'pengajar'], true),
                'initial'  => strtoupper(substr($d->user->name, 0, 1)),
            ],
            'is_own' => $d->user_id === auth()->id(),
        ];
    }
}
