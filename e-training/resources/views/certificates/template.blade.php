<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Sertifikat — {{ $course_title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4 landscape;
        }

        body {
            font-family: 'DejaVu Serif', serif;
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            background: #ffffff;
            color: #1a1a1a;
        }

        .bg-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 0;
        }

        .bg-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            background: #ffffff;
            z-index: 0;
        }

        /* Nomor sertifikat: coklat emas */
        .cert-number {
            position: absolute;
            top: 50mm;
            left: 0;
            width: 297mm;
            text-align: center;
            font-size: 14pt;
            color: #A0772B;
            z-index: 10;
        }

        /* Nama peserta: biru tua */
        .student-name {
            position: absolute;
            top: 86mm;
            left: 40mm;
            width: 217mm;
            height: 14mm;
            text-align: center;
            font-size: 32pt;
            font-weight: bold;
            line-height: 1;
            color: #1F3A6E;
            z-index: 10;
        }

        /* Blok di bawah garis nama */
        .below-name {
            position: absolute;
            top: 106mm;
            left: 25mm;
            width: 247mm;
            text-align: center;
            z-index: 10;
        }

        .status-text {
            font-size: 15pt;
            color: #333333;
        }

        .course-title {
            font-size: 21pt;
            font-weight: bold;
            margin: 4mm auto 0;
            width: 235mm;
            line-height: 1.3;
            color: #111111;
        }

        /* Keterangan tanggal: tebal */
        .event-text {
            font-size: 14pt;
            font-weight: bold;
            margin: 4mm auto 0;
            width: 235mm;
            line-height: 1.4;
            color: #111111;
        }

        /* Tanda tangan: lebih besar, sedikit menimpa nama */
        .signature-wrap {
            position: absolute;
            bottom: 14mm;
            left: 78.5mm;
            width: 140mm;
            text-align: center;
            z-index: 10;
        }

        .signature-img {
            height: 30mm;
            max-width: 90mm;
            display: block;
            margin: 0 auto -4mm;
        }

        .signature-name {
            font-size: 14pt;
            font-weight: bold;
            color: #1a1a1a;
        }

        .signature-role {
            font-size: 11pt;
            margin-top: 1mm;
            color: #444444;
        }

        /* QR */
        .qr-wrap {
            position: absolute;
            bottom: 20mm;
            left: 40mm;
            text-align: center;
            z-index: 10;
        }

        .qr-img {
            width: 26mm;
            height: 26mm;
            display: block;
        }

        .qr-svg-wrap {
            width: 26mm;
            height: 26mm;
            overflow: hidden;
            display: block;
        }

        .qr-svg-wrap svg {
            width: 100%;
            height: 100%;
        }

        .qr-label {
            font-size: 6pt;
            color: #777777;
            margin-top: 1mm;
            letter-spacing: 0.5px;
        }
    </style>
</head>

<body>

    @if(!empty($bg_base64))
    <img class="bg-image" src="{{ $bg_base64 }}" alt="background" />
    @else
    <div class="bg-fallback"></div>
    @endif

    <div class="cert-number">No. {{ $certificate_number }}</div>

    <div class="student-name">{{ $student_name }}</div>

    <div class="below-name">
        <div class="status-text">telah {{ $status_text ?? 'lulus' }} pada pelatihan:</div>
        <div class="course-title">{{ $course_title }}</div>

        @if(!empty($event_text))
        <div class="event-text">{!! nl2br(e($event_text)) !!}</div>
        @endif
    </div>

    @if(!empty($qr_base64))
    <div class="qr-wrap">
        @if(!empty($qr_is_svg))
        <div class="qr-svg-wrap">
            {!! base64_decode(substr($qr_base64, strpos($qr_base64, ',') + 1)) !!}
        </div>
        @else
        <img class="qr-img" src="{{ $qr_base64 }}" alt="QR Verifikasi" />
        @endif
        <div class="qr-label">SCAN UNTUK VERIFIKASI</div>
    </div>
    @endif

    <div class="signature-wrap">
        @if(!empty($sig_base64))
        <img class="signature-img" src="{{ $sig_base64 }}" alt="Tanda Tangan" />
        @endif
        <div class="signature-name">{{ $signer_name ?? '' }}</div>
        <div class="signature-role">{{ $signer_role ?? '' }}</div>
    </div>

</body>

</html>
