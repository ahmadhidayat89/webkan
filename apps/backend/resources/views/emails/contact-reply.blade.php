<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">
                Komite Akreditasi Nasional
              </p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">kan.go.id</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Yth. <strong>{{ $recipientName }}</strong>,
              </p>
              <div style="color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">{{ $replyBody }}</div>

              <!-- Quoted original -->
              <div style="margin-top:32px;padding:16px;background:#f9fafb;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Pesan asli Anda</p>
                <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Subjek: <strong>{{ $originalSubject }}</strong></p>
                <p style="margin:8px 0 0;font-size:13px;color:#6b7280;white-space:pre-wrap;line-height:1.6;">{{ $originalMessage }}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 28px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Email ini dikirim otomatis oleh sistem KAN.<br>
                Komite Akreditasi Nasional — kan.go.id
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
