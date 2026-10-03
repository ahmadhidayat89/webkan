<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Http\Request;

class CertificateVerifyController extends Controller
{
    /**
     * Halaman publik verifikasi keaslian sertifikat via QR Code.
     */
    public function show(string $code)
    {
        $certificate = Certificate::with(['user', 'course'])
            ->where('verification_code', $code)
            ->first();

        if (! $certificate) {
            return view('certificates.verify', [
                'valid'       => false,
                'certificate' => null,
            ]);
        }

        return view('certificates.verify', [
            'valid'       => true,
            'certificate' => [
                'number'     => $certificate->certificate_number,
                'name'       => $certificate->user->name,
                'org'        => $certificate->user->organization ?? '-',
                'course'     => $certificate->course->title,
                'issued_at'  => $certificate->issued_at->locale('id')->isoFormat('D MMMM YYYY'),
                'expired_at' => $certificate->expired_at
                    ? $certificate->expired_at->locale('id')->isoFormat('D MMMM YYYY')
                    : null,
            ],
        ]);
    }
}
