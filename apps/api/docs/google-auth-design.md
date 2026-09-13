# Skema login dan registrasi Google

Status: backend diimplementasikan; integrasi frontend belum dilakukan.
Konfigurasi dan endpoint: [google-auth.md](google-auth.md). Mengikuti permintaan pengguna:
klik Google di halaman login, autentikasi Google, cek akun di backend,
login bila sudah ada atau tampilkan draft registrasi dengan profil Google.

## Alur

1. Frontend menuju GET /api/auth/google/redirect. Backend membuat OAuth state
   dan nonce dalam session, lalu mengarahkan ke Google dengan scope dasar
   openid, email, profile. Pembatalan atau kegagalan kembali ke login dengan
   pesan yang sesuai, tanpa membuat akun/session autentikasi.
2. Callback memeriksa state, menukar authorization code melalui backend,
   dan memverifikasi identitas/token Google (signature, issuer, audience,
   expiry, nonce). Jangan menerima email/sub yang diklaim frontend.
3. Cari google_accounts berdasarkan sub Google yang sudah diverifikasi.
   Jika sudah terkait, login ke user terkait; perubahan email di Google tidak
   memindahkan hubungan akun secara otomatis.
4. Jika sub belum terkait, cari email di users. Pencocokan email harus
   mempertimbangkan normalisasi dan tidak boleh menganggap dua alamat berbeda
   sebagai pemilik yang sama hanya karena collation MySQL menyamakannya.
5. Jika akun email ditemukan, lakukan verifikasi kepemilikan yang sesuai:
   Gmail atau Workspace dengan email_verified dan hd yang valid dapat memakai
   identitas Google yang otoritatif. Untuk email pihak ketiga yang tidak
   dikelola Google, minta OTP ke email akun sebelum menautkan akun Google.
   Bila user sudah terkait google_sub lain, tolak penautan otomatis.
6. Penautan sub ke user dilakukan secara transaksional dan mengikuti unique
   index pada google_sub dan user_id. Sesudah berhasil, regenerasi session,
   lalu arahkan ke dashboard dengan session 14 hari tidak aktif.
7. Jika email belum ada, buat draft Google terikat session dan identitas
   Google terverifikasi. Email dan google_sub hanya ditentukan backend.
   Email pihak ketiga memerlukan pembuktian OTP sebelum ditandai terverifikasi.
8. Isi nama/email yang tersedia. Untuk akun baru, minta izin tambahan opsional
   People API untuk nomor HP, gender, dan tanggal lahir. Jika izin ditolak,
   API gagal, atau data tidak tersedia, lanjutkan dengan formulir manual.
9. Tampilkan halaman /google yang berisi draft. User memeriksa/melengkapi
   data, mengisi NIM, dan menyetujui kedua ketentuan secara eksplisit.
10. POST penyelesaian registrasi memvalidasi field, session/draft, expiry,
    dan keunikan email/NIM/sub sekali lagi. Buat users dan google_accounts
    serta hapus draft dalam satu transaksi. Regenerasi session dan login.

## Pengisian otomatis

| Field aplikasi | Sumber | Jika kosong/tidak cocok |
| --- | --- | --- |
| fullName | Nama profil Google | User mengisi nama |
| email | Email identitas Google | Tolak bila identitas email tidak tersedia; jangan memakai email dari form |
| phone | People API phoneNumbers | User mengisi nomor sesuai format aplikasi |
| gender | People API genders | male -> man, female -> woman; nilai lain memerlukan pilihan manual |
| tanggal_lahir | People API birthdays | Isi hanya jika tahun/bulan/hari lengkap dan valid; jangan menebak tahun |
| NIM | Form aplikasi | Wajib diisi user, tepat 13 digit dan unik |
| legal_agreement, privacy_agreement | Persetujuan user | Tidak boleh dicentang otomatis |

Nama, nomor, gender, dan tanggal lahir dapat diperiksa/dikoreksi sebelum
submit. Email Google dikunci; mengganti email memerlukan alur verifikasi baru.
Nomor pemulihan akun Google tidak dijamin tersedia lewat People API.

Scope People API yang dibutuhkan:
- https://www.googleapis.com/auth/user.phonenumbers.read
- https://www.googleapis.com/auth/user.gender.read
- https://www.googleapis.com/auth/user.birthday.read

Ambil data dari people/me dengan personFields yang sesuai. Minta izin tambahan
hanya untuk melengkapi akun baru; login akun lama cukup memakai identitas dasar.
Token akses dipakai backend untuk pengambilan profil dan tidak dikirim ke
frontend/dimasukkan URL. Tidak perlu menyimpan refresh token untuk skema ini.

## Data dan endpoint usulan

- users: akun yang sudah selesai dibuat.
- google_accounts: relasi unik user_id dengan google_sub yang diverifikasi.
- pending_registrations: perlu diperluas dengan provider (email/google),
  identitas Google terverifikasi di payload terenkripsi, dan kepemilikan draft
  melalui session. Pisahkan keunikan draft menurut email+provider agar draft
  OTP email dan draft Google tidak saling menimpa. Draft berlaku 30 menit.
- GET /api/auth/google/redirect: mulai login.
- GET /api/auth/google/callback: verifikasi hasil login Google.
- GET /api/auth/google/profile/redirect dan callback: persetujuan tambahan
  People API untuk draft baru bila diperlukan.
- GET /api/auth/google/draft: baca draft milik session saat ini.
- POST /api/auth/google/register: validasi dan simpan registrasi dari draft.

Semua route mempertahankan session; POST wajib memakai CSRF. Callback OAuth
memakai state/nonce sekali pakai. Sukses redirect hanya ke URL aplikasi yang
ditentukan backend, bukan return URL bebas dari request.

## Pemeriksaan saat implementasi

Uji login sub yang sudah terkait; penautan email tepercaya; email pihak ketiga
yang harus OTP; email belum terdaftar; hubungan Google bentrok; state/token
tidak valid; izin tambahan ditolak; profil sebagian/birthday tanpa tahun;
draft kedaluwarsa atau session lain; NIM/email terpakai saat submit; replay
callback/draft; dan rollback transaksi saat pembuatan akun gagal.

## Referensi

- Google OIDC: https://developers.google.com/identity/openid-connect/reference
- Verifikasi backend dan kepemilikan email: https://developers.google.com/identity/sign-in/web/backend-auth
- People API: https://developers.google.com/people/api/rest/v1/people/get
