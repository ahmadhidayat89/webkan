<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateAdminController extends Controller
{
    public function __construct(protected CertificateService $certService) {}

    /**
     * Generate atau re-generate sertifikat PDF untuk satu pelajar.
     */
    public function generate(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user       = \App\Models\User::findOrFail($request->user_id);
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        // Buat atau ambil record sertifikat
        $cert = Certificate::firstOrNew([
            'user_id'   => $user->id,
            'course_id' => $course->id,
        ]);

        // Buat nomor sertifikat jika belum ada
        if (! $cert->certificate_number) {
            $courseCode = strtoupper(Str::limit(
                preg_replace('/[^A-Za-z0-9]/', '', $course->slug), 8, ''
            ));
            $count = Certificate::whereYear('issued_at', now()->year)->count() + 1;
            $cert->certificate_number = sprintf(
                'KAN-%d-%s-%06d',
                now()->year,
                $courseCode,
                $count
            );
        }

        // Pastikan verification_code ada sebelum save pertama
        if (! $cert->verification_code) {
            $cert->verification_code = Str::uuid();
        }

        // Simpan dulu agar punya ID untuk generate
        $cert->save();

        // Generate PDF via service
        $this->certService->generate($cert, $course, $user);

        return back()->with('success', "Sertifikat untuk {$user->name} berhasil digenerate.");
    }

    /**
     * Upload template gambar background untuk sertifikat kursus ini.
     */
    public function uploadTemplate(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'template' => 'required|file|mimes:jpg,jpeg,png|max:5120',
        ]);

        // Hapus template lama
        if ($course->certificate_template) {
            Storage::disk('public')->delete($course->certificate_template);
        }

        $path = $request->file('template')->store(
            "certificate-templates/{$course->id}",
            'public'
        );

        $course->update(['certificate_template' => $path]);

        return back()->with('success', 'Template sertifikat berhasil diupload.');
    }

    /**
     * Upload gambar tanda tangan untuk sertifikat kursus ini.
     */
    public function uploadSignature(Request $request, Course $course): RedirectResponse
    {
        $request->validate([
            'signature' => 'required|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($course->certificate_signature) {
            Storage::disk('public')->delete($course->certificate_signature);
        }

        $path = $request->file('signature')->store(
            "certificate-signatures/{$course->id}",
            'public'
        );

        $course->update(['certificate_signature' => $path]);

        return back()->with('success', 'Tanda tangan berhasil diupload.');
    }

    /**
     * Download sertifikat PDF (admin).
     */
    public function download(Certificate $certificate)
    {
        if (! $certificate->file_path || ! Storage::disk('public')->exists($certificate->file_path)) {
            abort(404, 'File sertifikat tidak ditemukan.');
        }

        return Storage::disk('public')->download(
            $certificate->file_path,
            "Sertifikat-{$certificate->certificate_number}.pdf"
        );
    }

    /**
     * Preview sertifikat sebagai HTML di browser (tanpa download PDF).
     */
    public function preview(Certificate $certificate)
    {
        $certificate->load(['user', 'course']);
        $course = $certificate->course;
        $user   = $certificate->user;

        $verifyUrl = url('/verify/' . ($certificate->verification_code ?? 'preview'));
        $qrBase64  = $this->certService->generateQrBase64($verifyUrl);
        $bgBase64  = $this->certService->imageToBase64($course->certificate_template);
        $sigBase64 = $this->certService->imageToBase64($course->certificate_signature);

        return view('certificates.template', [
            'student_name'       => $user->name,
            'student_org'        => $user->organization ?? '',
            'course_title'       => $course->title,
            'course_level'       => ucfirst($course->level ?? ''),
            'certificate_number' => $certificate->certificate_number,
            'issue_date'         => $certificate->issued_at->locale('id')->isoFormat('D MMMM YYYY'),
            'duration_hours'     => $course->duration_hours ?? 0,
            'verify_url'         => $verifyUrl,
            'qr_base64'          => $qrBase64,
            'qr_is_svg'          => str_starts_with($qrBase64, 'data:image/svg'),
            'bg_base64'          => $bgBase64,
            'sig_base64'         => $sigBase64,
            'signer_name'        => $course->instructor->name ?? 'Kepala KAN',
            'signer_role'        => 'Kepala Pusat Pengembangan SDM',
        ]);
    }

    /**
     * Preview template sertifikat menggunakan data dummy (belum generate untuk pelajar tertentu).
     */
    public function previewTemplate(Course $course)
    {
        $verifyUrl = url('/verify/preview-qr-demo');
        $qrBase64  = $this->certService->generateQrBase64($verifyUrl);
        $bgBase64  = $this->certService->imageToBase64($course->certificate_template);
        $sigBase64 = $this->certService->imageToBase64($course->certificate_signature);

        return view('certificates.template', [
            'student_name'       => 'Nama Pelajar Contoh',
            'student_org'        => 'Instansi / Organisasi',
            'course_title'       => $course->title,
            'course_level'       => ucfirst($course->level ?? 'Umum'),
            'certificate_number' => 'KAN-' . now()->year . '-PREVIEW-000001',
            'issue_date'         => now()->locale('id')->isoFormat('D MMMM YYYY'),
            'duration_hours'     => $course->duration_hours ?? 0,
            'verify_url'         => $verifyUrl,
            'qr_base64'          => $qrBase64,
            'qr_is_svg'          => str_starts_with($qrBase64, 'data:image/svg'),
            'bg_base64'          => $bgBase64,
            'sig_base64'         => $sigBase64,
            'signer_name'        => $course->instructor->name ?? 'Kepala KAN',
            'signer_role'        => 'Kepala Pusat Pengembangan SDM',
        ]);
    }
}
