# Session persisten

Session Laravel disimpan di database dengan batas 14 hari tidak aktif
(`SESSION_LIFETIME=20160` menit). Cookie tetap berlaku saat browser ditutup
(`SESSION_EXPIRE_ON_CLOSE=false`). Aktivitas pada route dengan middleware
session memperbarui masa berlaku cookie dan waktu aktivitas di database.

Konfigurasi ada di `apps/api/config/session.php` dan `apps/api/.env.example`.
Untuk instalasi yang sudah berjalan, sesuaikan `apps/api/.env` lalu jalankan
`php artisan config:clear` dari direktori `apps/api`.

## Status integrasi

Saat perubahan ini dibuat, halaman login React hanya berpindah ke halaman
OTP/Google. Backend belum menyelesaikan verifikasi OTP maupun login Google
dan belum membuat session autentikasi. Jadi konfigurasi ini menyiapkan
penyimpanan session, tetapi belum menyediakan fitur tetap login secara utuh.

Dokumen auth sebelumnya merencanakan bearer token di localStorage. Pengaturan
session ini berlaku untuk autentikasi berbasis cookie/session Laravel;
masa berlaku bearer token harus diatur terpisah jika pendekatan itu digunakan.

## Pemeriksaan setelah autentikasi tersambung

- Login dengan OTP atau Google yang valid; pastikan backend membuat session
  autentikasi dan meregenerasi ID session setelah login.
- Pastikan cookie session memiliki tanggal kedaluwarsa 14 hari ke depan,
  bukan cookie yang hanya berlaku selama browser terbuka.
- Tutup seluruh jendela Chrome, buka kembali web dengan profil browser yang
  sama, dan pastikan identitas pengguna dipulihkan dari backend. Ulangi di Firefox.
- Uji session dengan aktivitas terakhir 13 hari lalu: pengguna tetap login.
- Uji session dengan aktivitas terakhir lebih dari 14 hari lalu: login ulang
  diperlukan, meskipun cookie lama dikirim secara manual.
- Logout harus membatalkan session di backend; membuka ulang browser tidak
  boleh memulihkan login tersebut.
- Tanpa cookie (misalnya cookie dihapus atau sesi privat berakhir), login
  ulang diperlukan.

Penutupan browser nyata dan pemulihan login belum dapat diuji sebelum
integrasi autentikasi selesai.
