# Login dan registrasi Google — backend

Implementasi berada di `apps/api`. Tombol dan formulir React belum dihubungkan
ke endpoint ini. Rancangan: [google-auth-design.md](google-auth-design.md).

## Konfigurasi

Isi konfigurasi lokal berikut (jangan commit client secret):

```dotenv
GOOGLE_CLIENT_ID=client-id-dari-google
GOOGLE_CLIENT_SECRET=client-secret-dari-google
GOOGLE_REDIRECT_URI=http://localhost:8000/auth-google-callback
FRONTEND_URL=http://localhost:5173
SESSION_LIFETIME=20160
SESSION_EXPIRE_ON_CLOSE=false
```

Daftarkan nilai `GOOGLE_REDIRECT_URI` yang persis sama pada OAuth client jenis
Web application di Google Cloud Console. Callback `/api/auth/google/callback`
juga tersedia jika URI tersebut yang didaftarkan. Nilai FRONTEND_URL adalah
origin frontend tetap, tanpa path. Gunakan hostname yang konsisten saat lokal
(jangan mencampur localhost dan 127.0.0.1), agar cookie session bisa digunakan.

Untuk pengisian profil tambahan, aktifkan People API dan konfigurasi consent
screen untuk scope `user.phonenumbers.read`, `user.gender.read`, dan
`user.birthday.read`. Aplikasi yang masih berstatus testing memerlukan test user
di Google Console; persyaratan publikasi/verifikasi mengikuti konfigurasi Google.
SMTP yang sudah dikonfigurasi digunakan untuk OTP alamat email pihak ketiga.

## Alur dan kontrak endpoint

Semua endpoint memakai cookie session Laravel. POST memerlukan CSRF:
ambil `GET /api/auth/csrf-token`, kirim nilai `csrf_token` pada header
`X-CSRF-TOKEN`, dan sertakan cookie (`credentials: 'include'`). Ambil token CSRF
kembali setelah login/registrasi karena session diregenerasi.

| Metode dan path | Perilaku |
| --- | --- |
| GET `/api/auth/google/redirect` | Navigasi browser penuh ke Google dengan scope dasar openid/email/profile. Alias: `/auth-google-redirect`. |
| GET `/api/auth/google/register/redirect` | Pintu masuk khusus Daftar dengan Google. Setelah verifikasi identitas langsung membuat draft tanpa mencari user atau menghubungkan akun yang sudah ada. |
| GET `/api/auth/google/callback` | Memverifikasi state, nonce, signature JWT, issuer, audience, masa berlaku, dan identitas. Alias: `/auth-google-callback`. |
| GET `/api/auth/google/draft` | Profil sementara, `needs_email_verification`, `existing_account`, dan `expires_at`. Hanya session pemilik; 410 jika tidak ada/kedaluwarsa. |
| GET `/api/auth/google/profile/redirect` | Meminta izin profil tambahan untuk draft aktif. Callback memakai URI Google yang sama. |
| POST `/api/auth/google/email/request-otp` | Mengirim OTP ke email draft yang ditentukan server. Body kosong. Menghasilkan `challenge_id`, `expires_in: 300`, `retry_after: 60`. |
| POST `/api/auth/google/email/verify-otp` | Body `{ "challenge_id": "uuid", "code": "0123" }`. Akun lama dihubungkan lalu login; akun baru mendapat bukti email untuk melanjutkan registrasi. |
| POST `/api/auth/google/register` | Validasi profil, buat user dan relasi Google secara transaksional, hapus draft, lalu login. Status 201, `user`, `next: "/dashboard"`. |

Pada alur **Daftar dengan Google**, arahkan browser ke
`/api/auth/google/register/redirect`. Server menyimpan maksud daftar dalam
session OAuth; callback memakai URI Google yang sama, sehingga tidak perlu
menambahkan callback baru di Google Console. Setelah verifikasi, profil Google
langsung menjadi draft. Email/sub yang sudah terdaftar baru ditolak ketika
formulir disimpan; pengguna diminta login. OTP email pihak ketiga hanya
membuktikan email draft, tidak menghubungkan atau meloginkan akun lama pada
alur daftar ini. Profil tambahan tetap memakai izin opsional yang sudah ada.

Pada alur **Login dengan Google**, callback akun yang sudah dihubungkan menggunakan identitas Google `sub` yang
stabil. Jika belum dihubungkan, server mencari email pengguna. Email Gmail atau
Workspace yang diverifikasi Google dapat langsung dihubungkan. Email pihak
ketiga memerlukan OTP sebelum menghubungkan akun atau membuat akun baru.
Konflik email/sub tidak mengganti hubungan akun yang sudah ada.

Redirect frontend:

- `/dashboard`: login berhasil.
- `/google`: draft baru tersedia, lengkapi registrasi.
- `/google?step=verify-email`: butuh OTP email terlebih dahulu.
- `/google?profile=unavailable`: izin profil tambahan ditolak/gagal; isi manual.
- `/login?error=google_invalid`, `google_cancelled`, `google_conflict`, atau
  `google_unavailable`: proses login tidak selesai.

Draft berumur 30 menit; OAuth state berumur 10 menit dan hanya sekali pakai.
Login Google baru untuk email yang sama mengganti pemilik draft dan membatalkan
kode lama, tetapi mempertahankan jeda pengiriman OTP. Kode berlaku 5 menit,
maksimal 5 percobaan, dan hanya disimpan sebagai hash. Draft Google dipisahkan
dari draft OTP email dengan provider, disimpan terenkripsi, dan dibersihkan oleh
`registrations:prune` yang sudah dijadwalkan. Jalankan scheduler Laravel seperti
konfigurasi registrasi email sebelumnya.

## Formulir registrasi Google

```json
{
  "NIM": "0123456789012",
  "fullName": "Nama Lengkap",
  "phone": "081234567890",
  "gender": "woman",
  "tanggal_lahir": "25/12/2003",
  "legal_agreement": true,
  "privacy_agreement": true
}
```

Email dan Google sub diambil dari identitas yang diverifikasi server. Jangan
kirim `email`, `google_sub`, `google`, `provider`, atau `email_verified_at` dalam
formulir. Profil opsional tidak dijamin tersedia: telepon harus cocok dengan
format aplikasi Indonesia, gender man/woman, tanggal lahir lengkap termasuk
tahun. Data yang tidak tersedia diisi manual. NIM serta dua persetujuan wajib
diisi sendiri. Nama dapat diperiksa/diperbaiki sebelum submit. Token akses
Google digunakan sementara hanya untuk People API, tidak disimpan dalam draft,
tidak dikirim ke frontend, dan tidak disertakan pada URL redirect.

Session login mengikuti konfigurasi 14 hari, tetap tersimpan saat browser
ditutup; masa berlaku Laravel diperbarui saat session aktif digunakan.

## Verifikasi

```powershell
php artisan test --compact --filter='GoogleAuthTest|RegistrationTest|OtpAuthTest'
php tests/Database/registrations.php
```

Tes Google memakai JWT RSA yang ditandatangani dengan kunci khusus tes serta
HTTP Google dan email simulasi. Harness MySQL membuat database sementara dengan
nama acak, memeriksa isolasi koneksi/model sebelum menulis, menjalankan migrasi,
callback, registrasi, session, konflik collation email, rollback, dan pasang
ulang. Database sementara dihapus setelah tes. Login akun Google nyata dan
pengiriman email nyata belum diuji oleh rangkaian ini.

Referensi resmi: [OpenID Connect Google](https://developers.google.com/identity/openid-connect/openid-connect),
[validasi ID token dan otoritas email](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token),
[People API people.get](https://developers.google.com/people/api/rest/v1/people/get).
