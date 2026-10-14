<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRMarkupSVG;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Generate atau re-generate sertifikat PDF untuk seorang pelajar.
     *
     * @return Certificate
     */
    public function generate(Certificate $cert, Course $course, User $user): Certificate
    {
        // 1. Pastikan verification_code ada
        if (! $cert->verification_code) {
            $cert->verification_code = Str::uuid();
        }

        // 2. Render Blade template ke HTML (semua data dari viewData)
        $html = view('certificates.template', $this->viewData($cert, $course, $user))->render();

        // 3. Generate PDF via DOMPDF
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'landscape')
            ->setOption('isPhpEnabled', true)
            ->setOption('isRemoteEnabled', false)
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('chroot', storage_path('app/public'));

        // 4. Simpan ke storage
        $filename = "certificates/{$course->id}/{$user->id}.pdf";
        Storage::disk('public')->put($filename, $pdf->output());

        $cert->fill(['file_path' => $filename, 'issued_at' => now()])->save();

        return $cert;
    }

    /**
     * Kumpulkan semua data yang dibutuhkan template sertifikat.
     * Dipakai bersama oleh PDF dan preview, supaya hasilnya selalu sama.
     */
    public function viewData(Certificate $cert, Course $course, User $user): array
    {
        $verifyUrl = url('/verify/' . ($cert->verification_code ?? 'preview'));
        $qr        = $this->generateQrBase64($verifyUrl);

        return [
            'student_name'       => $cert->recipient_name ?: $user->name,
            'status_text'        => $cert->status === 'hadir' ? 'hadir' : 'lulus',
            'course_title'       => $course->title,
            'event_text'         => $cert->event_text,
            'certificate_number' => $cert->certificate_number,
            'qr_base64'          => $qr,
            'qr_is_svg'          => str_starts_with($qr, 'data:image/svg'),
            'bg_base64'          => $this->imageToBase64($course->certificate_template),
            'sig_base64'         => $this->imageToBase64($course->certificate_signature),
            'signer_name'        => $cert->signer_name  ?: config('app.certificate_signer_name'),
            'signer_role'        => $cert->signer_title ?: config('app.certificate_signer_title'),
        ];
    }

    /**
     * Generate QR Code dan kembalikan sebagai string base64.
     *
     * chillerlan/php-qrcode v6 API:
     *  - `outputInterface` = FQCN class (bukan konstanta lama outputType)
     *  - `eccLevel`        = integer dari EccLevel::L/M/Q/H
     *  - Default output sudah QRMarkupSVG (pure PHP, zero GD dependency)
     */
    public function generateQrBase64(string $content): string
    {
        // Gunakan PNG via GD jika ekstensi GD tersedia
        if (extension_loaded('gd')) {
            $options = new QROptions([
                'outputInterface' => QRGdImagePNG::class,
                'eccLevel'        => EccLevel::L,
                'scale'           => 6,
                'imageBase64'     => true,
            ]);

            return (new QRCode($options))->render($content);
        }

        // Fallback: SVG pure PHP (default v6, zero dependency).
        // CATATAN v6: render() SELALU mengembalikan data URI (data:image/svg+xml;base64,...)
        // tidak peduli setting imageBase64. Kita return langsung tanpa encode ulang.
        $options = new QROptions([
            'outputInterface' => QRMarkupSVG::class,
            'eccLevel'        => EccLevel::L,
            'scale'           => 6,
        ]);

        return (new QRCode($options))->render($content);
    }

    /**
     * Baca gambar dari storage dan konversi ke base64 data URI.
     * Kembalikan null jika file tidak ada.
     */
    public function imageToBase64(?string $storagePath): ?string
    {
        if (! $storagePath) {
            return null;
        }

        if (! Storage::disk('public')->exists($storagePath)) {
            return null;
        }

        $raw = Storage::disk('public')->get($storagePath);

        $fullPath = Storage::disk('public')->path($storagePath);
        $mime = mime_content_type($fullPath) ?: 'application/octet-stream';

        return 'data:' . $mime . ';base64,' . base64_encode($raw);
    }
}