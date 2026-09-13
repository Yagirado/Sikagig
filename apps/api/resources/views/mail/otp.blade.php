<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kode OTP {{ $purpose === 'register' ? 'Registrasi' : 'Login' }}</title>
</head>
<body>
    <h1>Kode OTP {{ $purpose === 'register' ? 'Registrasi' : 'Login' }} {{ config('app.name') }}</h1>
    <p>Masukkan kode berikut untuk melanjutkan {{ $purpose === 'register' ? 'registrasi' : 'login' }}:</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">{{ $code }}</p>
    <p>Kode berlaku selama 5 menit dan hanya dapat digunakan sekali.</p>
    <p>Jangan bagikan kode ini kepada siapa pun. Jika kamu tidak meminta kode ini, abaikan email ini.</p>
</body>
</html>
