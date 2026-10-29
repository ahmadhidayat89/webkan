<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
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
        $data = $request->validate([
            'user_id'        => 'required|exists:users,id',
            'recipient_name' => 'nullable|string|max:150',
            'status'         => 'sometimes|in:hadir,lulus',
            'event_text'     => 'nullable|string|max:500',
            'signer_name'    => 'nullable|string|max:100',
            'signer_title'   => 'nullable|string|max:100',
        ]);

        $user       = User::findOrFail($data['user_id']);
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
                preg_replace('/[^A-Za-z0-9]/', '', $course->slug),
                8,
                ''
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

        // Isi data kustom dari admin (hanya yang dikirim form)
        $cert->fill(Arr::only($data, [
            'recipient_name',
            'status',
            'event_text',
            'signer_name',
            'signer_title',
        ]));

        // Klik cepat (tanpa modal): kalau keterangan masih kosong, isi otomatis
        // dengan tanggal selesai peserta (atau hari ini kalau belum tercatat)
        // dan durasi pelatihan dari detail kursus.
        if (! $request->has('event_text') && empty($cert->event_text)) {
            $tanggal = ($enrollment->completed_at ?? now())
                ->locale('id')
                ->isoFormat('D MMMM YYYY');

            $cert->event_text = "Yang diselesaikan pada tanggal {$tanggal}";

            if ($course->duration_hours) {
                $cert->event_text .= ", dilaksanakan secara daring selama {$course->duration_hours} jam";
            }
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

        $path = Storage::disk('public')->path($certificate->file_path);

        return response()->download(
            $path,
            "Sertifikat-{$certificate->certificate_number}.pdf",
            [
                'Content-Type' => 'application/pdf',
            ]
        );
    }

    /**
     * Preview sertifikat sebagai HTML di browser (tanpa download PDF).
     */
    public function preview(Certificate $certificate)
    {
        $certificate->load(['user', 'course']);

        return view(
            'certificates.template',
            $this->certService->viewData($certificate, $certificate->course, $certificate->user)
        );
    }

    /**
     * Preview template sertifikat menggunakan data dummy.
     */
    public function previewTemplate(Course $course)
    {
        $dummy = new Certificate();
        $dummy->forceFill([
            'certificate_number' => 'KAN-' . now()->year . '-PREVIEW-000001',
            'recipient_name'     => 'Nama Peserta Contoh',
            'status'             => 'lulus',
            'event_text'         => 'Yang diselesaikan pada tanggal '
                . now()->locale('id')->isoFormat('D MMMM YYYY')
                . ' secara daring dengan '
                . ($course->duration_hours ?: 0) . ' JP',
        ]);

        $user = new User();
        $user->name = 'Nama Peserta Contoh';

        return view(
            'certificates.template',
            $this->certService->viewData($dummy, $course, $user)
        );
    }
}
