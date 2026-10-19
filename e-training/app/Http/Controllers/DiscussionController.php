<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use App\Models\Lesson;
use Illuminate\Http\Request;
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
    public function index(Lesson $lesson)
    {
        $messages = $lesson->discussions()
            ->with('user')
            ->orderBy('created_at')
            ->get()
            ->map(fn($d) => $this->formatMessage($d));

        return response()->json($messages);
    }

    /**
     * Kirim pesan baru (teks dan/atau file).
     */
    public function store(Request $request, Lesson $lesson)
    {
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
            $filePath = $file->store("discussions/lesson_{$lesson->id}", 'public');
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

        return response()->json($this->formatMessage($discussion), 201);
    }

    /**
     * Hapus pesan (hanya milik sendiri atau admin).
     */
    public function destroy(Discussion $discussion)
    {
        $user = auth()->user();

        if ($discussion->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Tidak diizinkan.'], 403);
        }

        if ($discussion->file_path) {
            Storage::disk('public')->delete($discussion->file_path);
        }

        $discussion->delete();

        return response()->json(['success' => true]);
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
            'file_path'  => $d->file_path ? Storage::disk('public')->url($d->file_path) : null,
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
                'is_admin' => $d->user->isAdmin(),
                'initial'  => strtoupper(substr($d->user->name, 0, 1)),
            ],
            'is_own' => $d->user_id === auth()->id(),
        ];
    }
}