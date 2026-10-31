# Backend login OTP

API ini hanya untuk login pengguna yang emailnya sudah terdaftar di `users`.
Tidak membuat akun baru. Frontend belum dihubungkan oleh perubahan ini.

## Aturan

- OTP acak empat digit, termasuk kemungkinan nol di depan (contoh `0482`).
- Kode asli dikirim melalui Laravel Mail; database hanya menyimpan `Hash::make()`.
- Kedaluwarsa lima menit setelah diterbitkan, maksimal lima percobaan salah,
  dan hanya bisa dipakai sekali.
- Kirim ulang memakai endpoint yang sama setelah 60 detik. UUID challenge baru
  menggantikan challenge sebelumnya; kode/challenge lama tidak dapat dipakai.
- Bila mailer melempar kegagalan, OTP baru dan OTP yang digantikan dibatalkan.
  API mengembalikan 503, tanpa `challenge_id`.
- Request OTP dibatasi 10 request/menit dan verifikasi 30 request/menit per IP
  untuk tamu (per pengguna bila sudah login), di luar cooldown per pengguna
  dan batas percobaan per challenge. Respons throttling memakai HTTP 429.
- Pengiriman dilakukan sinkron, tidak memerlukan queue worker. Timeout SMTP
  default 15 detik, dapat diubah melalui `MAIL_TIMEOUT`.
- Verifikasi memakai `Hash::check`, mencatat `consumed_at`, lalu login melalui
  guard `web` dan meregenerasi ID session. Session berlaku 14 hari tidak aktif
  berdasarkan konfigurasi session proyek; aktivitas memperbarui masa berlaku.

Transaksi database mengunci baris pengguna sebelum challenge saat kirim dan
verifikasi. Ini juga melindungi pengiriman pertama ketika challenge belum ada.
Kegagalan mailer dan percobaan salah dikembalikan sebagai respons dari transaksi
agar pembatalan kode dan penambahan percobaan tetap tersimpan.

## Cookie dan CSRF

Route menggunakan middleware `web` meskipun URL diawali `/api`.
Gunakan `Accept: application/json`. Simpan cookie antar-request.

1. `GET /api/auth/csrf-token`: simpan cookie session dan nilai `csrf_token`.
2. Kirim cookie serta header `X-CSRF-TOKEN: <csrf_token>` pada setiap POST.
3. Setelah verifikasi atau logout, gunakan cookie terbaru dan ambil token CSRF
   baru karena session/token diregenerasi.

Untuk browser, gunakan `credentials: "include"`. Integrasi lintas origin juga
memerlukan konfigurasi CORS dengan origin frontend eksplisit serta dukungan
credentials; konfigurasi tersebut belum ditambahkan karena frontend di luar
cakupan. Pemanggilan dari origin yang sama atau klien API dapat digunakan.
API tidak mengembalikan bearer token dan tidak memerlukan localStorage.

## Endpoint

### POST /api/auth/request-otp

```json
{"email":"user@example.com"}
```

Respons 200 setelah mailer menerima pengiriman:

```json
{
  "success": true,
  "message": "Permintaan pengiriman OTP diterima. Silakan cek email kamu.",
  "challenge_id": "UUID-yang-dibuat-backend",
  "expires_in": 300,
  "retry_after": 60
}
```

- 422: format email tidak valid atau email belum terdaftar.
- 429: cooldown/rate limit; perhatikan header `Retry-After`.
- 503: mailer gagal; OTP baru dibatalkan.
- 419: cookie/token CSRF tidak valid.

### POST /api/auth/verify-otp

```json
{"challenge_id":"UUID-dari-request-otp","code":"0482"}
```

`code` harus string agar nol di depan tetap ada.

Respons 200:

```json
{
  "success": true,
  "message": "Login berhasil.",
  "user": {"id": 1, "email": "user@example.com", "fullName": "Pengguna"}
}
```

- 422: payload tidak valid, challenge tidak ada, kode salah, kedaluwarsa,
  sudah digunakan, purpose bukan login, atau email akun sudah berubah.
- 429: percobaan salah kelima dan seterusnya, atau rate limit.
- 419: cookie/token CSRF tidak valid.

### GET /api/auth/me

Mengembalikan `success` dan `user` dari session, atau 401 jika belum login.
Gunakan endpoint ini ketika membuka kembali aplikasi.

### POST /api/auth/logout

Membatalkan session dan meregenerasi token CSRF. Mengembalikan 200 dengan
`success: true`, atau 401 jika belum login.

## Pengaturan mail

Isi `apps/api/.env` dengan konfigurasi SMTP penyedia email:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.penyedia-email.example
MAIL_PORT=587
MAIL_USERNAME=akun-smtp
MAIL_PASSWORD=kredensial-smtp
MAIL_FROM_ADDRESS=alamat-pengirim-terverifikasi@example.com
MAIL_FROM_NAME="SIKAGIG"
MAIL_TIMEOUT=15
```

Gunakan host, port, skema, dan kredensial yang sesuai penyedia. Contoh di atas
bukan konfigurasi siap kirim. Sesudah mengubah env, jalankan
`php artisan config:clear`. Pengiriman email tidak diuji ke alamat sungguhan.
Mailer `log`/`array` hanya untuk pengembangan/pengujian dan tidak mengirim email
ke inbox. Hindari mailer failover ke `log` untuk pengiriman sungguhan.

Penerimaan oleh SMTP tidak menjamin pesan sampai ke inbox. Penolakan penerima
yang datang belakangan (bounce) memerlukan integrasi notifikasi penyedia email;
fitur ini belum melacak bounce. OTP tetap kedaluwarsa setelah lima menit.

## Verifikasi

```sh
php artisan test --filter=OtpAuthTest
php artisan route:list --path=api/auth -v
```

Tes menggunakan SQLite in-memory dengan skema auth yang sesuai dan fake mailer;
tidak menyentuh data pengguna pengembangan. Tes mencakup rendering email,
CSRF aktif, sesi database, cooldown, invalidasi kode, dan kegagalan SMTP simulasi.
CHECK constraint MySQL serta locking antarproses belum diuji melalui tes SQLite.
