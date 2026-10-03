<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    /**
     * Tampilkan daftar sertifikat milik pelajar yang sedang login.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $certificates = Certificate::with('course.instructor')
            ->where('user_id', $user->id)
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn($cert) => [
                'id'                 => $cert->id,
                'certificate_number' => $cert->certificate_number,
                'course_title'       => $cert->course?->title ?? '-',
                'instructor_name'    => $cert->course?->instructor?->name ?? 'Instruktur',
                'issued_at'          => $cert->issued_at
                    ? $cert->issued_at->format('d M Y')
                    : ($cert->created_at->format('d M Y')),
                'file_url'           => $cert->file_path
                    ? Storage::disk('public')->url($cert->file_path)
                    : null,
            ]);

        return Inertia::render('Certificates', [
            'certificates' => $certificates,
        ]);
    }

    /**
     * Download sertifikat PDF milik pelajar.
     */
    public function download(int $id)
    {
        $user = auth()->user();

        $cert = Certificate::where('id', $id)
            ->where('user_id', $user->id) // pastikan hanya bisa download miliknya sendiri
            ->firstOrFail();

        if (!$cert->file_path || !Storage::disk('public')->exists($cert->file_path)) {
            abort(404, 'File sertifikat belum tersedia.');
        }

        return Storage::disk('public')->download(
            $cert->file_path,
            "Sertifikat_{$cert->certificate_number}.pdf"
        );
    }
}
