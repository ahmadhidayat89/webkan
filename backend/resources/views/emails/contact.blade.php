<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Pesan Baru dari Formulir Kontak</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2>Pesan Baru dari Formulir Hubungi Kami</h2>

    <p><strong>Nama:</strong> {{ $name }}</p>
    <p><strong>Email:</strong> {{ $email }}</p>
    <p><strong>Telepon:</strong> {{ $phone }}</p>
    <p><strong>Subjek:</strong> {{ $subject }}</p>
    <p><strong>Waktu:</strong> {{ $submittedAt }}</p>

    <p><strong>Pesan:</strong></p>
    <p style="white-space: pre-wrap;">{{ $messageContent }}</p>
</body>
</html>