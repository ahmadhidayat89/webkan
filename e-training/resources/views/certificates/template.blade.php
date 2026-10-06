<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Sertifikat — {{ $course_title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            margin: 0;
            size: A4 landscape;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            background: #e8f4fc;
        }

        /* ── Full-bleed background image ── */
        .bg-image {
            position: absolute;
            top: 0; left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 0;
        }

        /* ── Fallback background jika tidak ada template ── */
        .bg-fallback {
            position: absolute;
            top: 0; left: 0;
            width: 297mm;
            height: 210mm;
            background: linear-gradient(135deg, #e8f4fc 0%, #ffffff 60%, #ddeeff 100%);
            z-index: 0;
        }

        /* ── Overlay area (semua teks di atas gambar) ── */
        .overlay {
            position: absolute;
            top: 0; left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 10;
        }

        /* Judul SERTIFIKAT */
        .cert-title {
            position: absolute;
            top: 35mm;        /* naik dari 32 → turun ke 40 */
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 40pt;  /* lebih besar */
            font-weight: 900;
            color: #1565C0;
            letter-spacing: 8px;
            text-transform: uppercase;
        }

        /* Nomor Sertifikat */
        .cert-number {
            position: absolute;
            top: 60mm;        /* turun dari 48 */
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 12pt;  /* sedikit lebih besar */
            font-weight: bold;
            color: #333333;
            letter-spacing: 1px;
        }

        /* Label "Diberikan kepada:" */
        .given-to-label {
            position: absolute;
            top: 79mm;        /* turun dari 66 */
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 12pt;  /* lebih besar */
            font-weight: bold;
            color: #444444;
        }

        /* Nama pelajar — besar & emas, dengan underline text */
        .student-name {
            position: absolute;
            top: 94mm;        /* turun dari 75 */
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 34pt;  /* lebih besar */
            font-weight: bold;
            font-style: italic;
            color: #C8860A;
            text-decoration: underline;      /* underline di teks, bukan div terpisah */
            text-underline-offset: 3mm;
            text-decoration-color: #aaaaaa;
        }

        /* "Telah Berhasil Menyelesaikan Pelatihan :" */
        .completed-text {
            position: absolute;
            top: 119mm;       /* turun dari 104 */
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 12pt;  /* lebih besar */
            font-weight: bold;
            color: #444444;
        }

        /* Nama Pelatihan/Kursus */
        .course-title {
            position: absolute;
            top: 130mm;       /* turun dari 113 */
            left: 10%;
            width: 80%;
            text-align: center;
            font-size: 16pt;  /* lebih besar dari 13pt */
            font-weight: bold;
            font-style: italic;
            color: #1a1a1a;
        }

        /* QR Code — kiri bawah, lebih ke atas */
        .qr-wrap {
            position: absolute;
            bottom: 26mm;     /* naik dari 18mm */
            left: 32mm;
            text-align: center;
        }
        .qr-img {
            width: 30mm;
            height: 30mm;
            display: block;
        }
        .qr-svg-wrap {
            width: 30mm;
            height: 30mm;
            overflow: hidden;
            display: block;
        }
        .qr-svg-wrap svg {
            width: 100%;
            height: 100%;
        }
        .qr-label {
            font-size: 5pt;
            color: #777777;
            margin-top: 1mm;
            letter-spacing: 0.5px;
            text-align: center;
        }

        /* Tanda Tangan — kanan bawah, lebih ke atas */
        .signature-wrap {
            position: absolute;
            bottom: 22mm;     /* naik dari 14mm */
            right: 34mm;
            text-align: center;
            width: 55mm;
        }
        .signature-img {
            height: 16mm;
            max-width: 50mm;
            object-fit: contain;
            display: block;
            margin: 0 auto 1mm;
        }
        .signature-line {
            border-top: 1px solid #555555;
            width: 50mm;
            margin: 0 auto 2mm;
        }
        .signature-name {
            font-size: 10pt;
            font-weight: bold;
            color: #1a1a1a;
        }
        .signature-role {
            font-size: 8pt;
            color: #555555;
            margin-top: 1mm;
        }
    </style>
</head>
<body>

    {{-- Background: gambar template dari admin --}}
    @if(!empty($bg_base64))
        <img class="bg-image" src="{{ $bg_base64 }}" alt="background" />
    @else
        <div class="bg-fallback"></div>
    @endif

    {{-- Semua teks di-overlay di atas gambar --}}
    <div class="overlay">

        {{-- Judul --}}
        <div class="cert-title">Sertifikat</div>

        {{-- Nomor Sertifikat --}}
        <div class="cert-number">NO : {{ $certificate_number }}</div>

        {{-- Diberikan kepada --}}
        <div class="given-to-label">Diberikan kepada:</div>

        {{-- Nama Peserta (besar & emas, underline via CSS) --}}
        <div class="student-name">{{ $student_name }}</div>

        {{-- Teks penyelesaian --}}
        <div class="completed-text">Telah Berhasil Menyelesaikan Pelatihan :</div>

        {{-- Nama Kursus --}}
        <div class="course-title">{{ strtoupper($course_title) }}</div>

        {{-- QR Code kiri bawah --}}
        @if(!empty($qr_base64))
        <div class="qr-wrap">
            @if(!empty($qr_is_svg))
                {{-- SVG: decode base64 dan render inline (DOMPDF & browser compatible) --}}
                <div class="qr-svg-wrap">
                    {!! base64_decode(substr($qr_base64, strpos($qr_base64, ',') + 1)) !!}
                </div>
            @else
                <img class="qr-img" src="{{ $qr_base64 }}" alt="QR Verifikasi" />
            @endif
            <div class="qr-label">SCAN UNTUK VERIFIKASI</div>
        </div>
        @endif

        {{-- Tanda tangan kanan bawah --}}
        <div class="signature-wrap">
            @if(!empty($sig_base64))
                <img class="signature-img" src="{{ $sig_base64 }}" alt="Tanda Tangan" />
            @endif
            <div class="signature-line"></div>
            <div class="signature-name">{{ $signer_name ?? 'Kepala KAN' }}</div>
            <div class="signature-role">{{ $signer_role ?? 'Kepala Pusat Pengembangan SDM' }}</div>
        </div>

    </div>

</body>
</html>
