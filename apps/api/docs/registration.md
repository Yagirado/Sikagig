# Registrasi akun melalui OTP

Backend menerima formulir lengkap, menyimpannya sementara, dan membuat akun
hanya setelah OTP email berhasil diverifikasi. Frontend belum dihubungkan.

## Endpoint

Gunakan cookie dan CSRF seperti pada `otp-auth.md`: ambil
`GET /api/auth/csrf-token`, simpan cookie, dan kirim `X-CSRF-TOKEN` pada POST.

`POST /api/auth/register/request-otp` menerima:

```json
{
  "NIM": "0123456789012",
  "fullName": "Nama Lengkap",
  "email": "user@example.com",
  "phone": "081234567890",
  "gender": "woman",
  "tanggal_lahir": "25/12/2003",
  "legal_agreement": true,
  "privacy_agreement": true
}
```

- Semua field wajib. NIM berupa string tepat 13 digit dan unik di users.
- Email dinormalisasi ke huruf kecil dan wajib belum terdaftar di users.
- Nomor HP: 08 diikuti 8–11 digit atau +62 diikuti 9–12 digit.
- Gender: `man` atau `woman`.
- Tanggal: `DD/MM/YYYY` atau `YYYY-MM-DD`, valid dan bukan di masa depan.
- Kedua persetujuan wajib diterima. Backend menetapkan nilai boolean true
  hanya setelah validasi accepted berhasil.

Respons 200 berisi `success`, `message`, `challenge_id`, `expires_in: 300`,
dan `retry_after: 60`. Kode asli hanya dikirim ke email; respons tidak berisi
kode, hash, atau formulir. Kirim ulang menggunakan endpoint dan formulir
lengkap yang sama setelah 60 detik. Kirim ulang mengganti UUID challenge,
OTP, dan formulir bersama-sama; challenge lama tidak berlaku.

`POST /api/auth/register/verify-otp` menerima:

```json
{"challenge_id":"UUID-dari-request-otp","code":"0482"}
```

Kode harus string empat digit. Respons sukses 201:

```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "user": {"id": 1, "email": "user@example.com", "fullName": "Nama Lengkap"}
}
```

Simpan cookie terbaru. Backend membuat user dengan `email_verified_at` dan
`profile_completed_at`, menandai OTP terpakai, mengaitkan OTP ke user, serta
menghapus draft dalam satu transaksi. Setelah commit, session diregenerasi
dan login berlaku 14 hari tidak aktif sesuai konfigurasi proyek.
`GET /api/auth/me` dan `POST /api/auth/logout` memakai endpoint login yang ada.
Ambil token CSRF baru setelah registrasi karena token session berubah.

## Kondisi gagal

| Status | Penyebab |
| --- | --- |
| 422 | Formulir salah; email/NIM sudah digunakan; kode salah/kedaluwarsa/terpakai; draft sudah berakhir |
| 429 | Cooldown, batas request, atau lima percobaan OTP salah |
| 503 | Mailer gagal; draft beserta OTP baru dibatalkan |
| 419 | Cookie/token CSRF tidak valid |

Keunikan email/NIM dicek saat permintaan dan saat verifikasi. Indeks unik
database mencegah duplikasi yang terjadi bersamaan; pelanggaran indeks saat
verifikasi dikembalikan sebagai 422 dengan transaksi di-rollback.
NIM di draft tidak memblokir pendaftaran lain sebelum akun dibuat.
Challenge `register` tidak diterima endpoint verifikasi login, dan sebaliknya.

Alamat tujuan OTP harus sama persis dengan email dalam formulir yang akan
dibuat menjadi akun, termasuk ketika collation MySQL menyamakan dua alamat
berbeda. Penggantian formulir juga memperbarui alamat tujuan OTP.

## Penyimpanan dan aktivasi

Jalankan `php artisan migrate` dari `apps/api` untuk dua migration baru:

- `2026_09_13_100000_create_pending_registrations_table.php`
- `2026_09_13_100001_link_registration_otps_to_pending_registrations.php`

`pending_registrations` menyimpan UUID, email, formulir terenkripsi dengan
APP_KEY, batas waktu, dan timestamps. `email_otps.user_id` menjadi nullable;
OTP sebelum akun dibuat merujuk ke `pending_registration_id` dengan FK cascade.
Satu draft per email dan satu OTP aktif per draft. OTP yang sukses tetap
tersimpan sebagai terpakai dengan user_id, tanpa tautan ke draft.

Draft kedaluwarsa 30 menit setelah permintaan terakhir yang lolos cooldown.
OTP berlaku lima menit, maksimal lima percobaan salah. Scheduler menjalankan
`registrations:prune` setiap 10 menit; server harus menjalankan Laravel
scheduler (`php artisan schedule:run` tiap menit, atau `schedule:work` untuk
pengembangan). Perintah cleanup bisa dijalankan manual. Draft kedaluwarsa
tetap ditolak saat verifikasi meskipun scheduler belum berjalan.

Pengiriman menggunakan mailer sinkron yang sama dengan login. Konfigurasi
SMTP dan batas pengiriman dijelaskan di `otp-auth.md`. Login dan registrasi
berbagi batas request kirim OTP 10/menit dan verifikasi 30/menit per IP untuk
tamu (per akun setelah login). Tidak ada email sungguhan dikirim saat tes.

## Pengujian

```sh
php artisan test --filter='RegistrationTest|OtpAuthTest'
php tests/Database/registrations.php
```

Tes fitur menggunakan SQLite in-memory dan fake mailer. Tes MySQL memakai
database sementara bernama unik, memeriksa identitas koneksi sebelum menulis,
lalu menghapus database sementara itu setelah selesai. Tes ini memeriksa
upgrade/rollback, preservasi data lama, constraint profil, alur HTTP dengan
CSRF/cookie, serta pengikatan email ketika collation menganggapnya setara.
Perilaku request paralel belum diuji dengan beberapa proses sekaligus.
