<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Sertifikat – E-Training KAN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f2240 0%, #1a3a5c 50%, #0d1f38 100%);
            display: flex; align-items: center; justify-content: center;
            padding: 2rem;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 32px 64px rgba(0,0,0,0.3);
            text-align: center;
        }
        .icon-wrap {
            width: 80px; height: 80px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2.5rem;
        }
        .icon-valid { background: #d1fae5; }
        .icon-invalid { background: #fee2e2; }
        h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
        h1.valid { color: #065f46; }
        h1.invalid { color: #991b1b; }
        .subtitle { color: #6b7280; font-size: 0.95rem; margin-bottom: 2rem; }
        .info-grid {
            background: #f9fafb;
            border-radius: 16px;
            padding: 1.5rem;
            text-align: left;
            border: 1px solid #e5e7eb;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
            padding: 0.6rem 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            min-width: 130px;
        }
        .info-value { font-size: 0.9rem; font-weight: 600; color: #111827; }
        .cert-number-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 0.25rem 0.75rem;
            font-family: monospace;
            font-size: 0.85rem;
            font-weight: 700;
        }
        .footer-note {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }
        .footer-note img { height: 36px; margin-bottom: 0.5rem; }
        .footer-note p { font-size: 0.8rem; color: #9ca3af; }
        .kan-logo {
            width: 48px; height: 48px; background: #1a3a5c; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-size: 0.9rem;
            margin: 0 auto 0.75rem;
        }
    </style>
</head>
<body>
    <div class="card">
        @if($valid)
            <div class="icon-wrap icon-valid">✅</div>
            <h1 class="valid">Sertifikat Valid</h1>
            <p class="subtitle">Sertifikat ini telah terverifikasi dan diterbitkan resmi oleh Komite Akreditasi Nasional.</p>

            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">No. Sertifikat</span>
                    <span class="info-value">
                        <span class="cert-number-badge">{{ $certificate['number'] }}</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nama Penerima</span>
                    <span class="info-value">{{ $certificate['name'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Instansi / Organisasi</span>
                    <span class="info-value">{{ $certificate['org'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nama Pelatihan</span>
                    <span class="info-value">{{ $certificate['course'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tanggal Terbit</span>
                    <span class="info-value">{{ $certificate['issued_at'] }}</span>
                </div>
                @if($certificate['expired_at'])
                <div class="info-row">
                    <span class="info-label">Berlaku Hingga</span>
                    <span class="info-value">{{ $certificate['expired_at'] }}</span>
                </div>
                @endif
            </div>

            <div class="footer-note">
                <div class="kan-logo">KAN</div>
                <p><strong>Komite Akreditasi Nasional</strong></p>
                <p>National Accreditation Body of Indonesia</p>
            </div>
        @else
            <div class="icon-wrap icon-invalid">❌</div>
            <h1 class="invalid">Sertifikat Tidak Valid</h1>
            <p class="subtitle">Kode verifikasi yang Anda masukkan tidak ditemukan atau tidak valid. Pastikan Anda scan QR Code yang benar dari sertifikat asli.</p>

            <div class="footer-note">
                <div class="kan-logo">KAN</div>
                <p><strong>Komite Akreditasi Nasional</strong></p>
                <p>Jika Anda yakin sertifikat ini asli, hubungi admin KAN.</p>
            </div>
        @endif
    </div>
</body>
</html>
