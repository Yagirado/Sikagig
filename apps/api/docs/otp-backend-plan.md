# Rencana backend login OTP

Implementasi mengikuti skema yang disetujui: email wajib sudah ada di users,
OTP acak empat digit, hash saja di email_otps, kedaluwarsa lima menit,
jeda kirim ulang 60 detik, maksimal lima percobaan, dan sekali pakai.
Seluruh perubahan berada di apps/api.

- [x] Buat tes HTTP untuk validasi email, pengiriman, cooldown, penggantian kode,
  kegagalan mailer, batas verifikasi, kedaluwarsa, session, dan logout.
- [x] Jalankan tes sebelum implementasi dan pastikan endpoint belum tersedia.
- [x] Lengkapi SendOtpRequest dan OtpEmail; tambahkan template email.
- [x] Tambahkan OtpAuthController dan route /api/auth dengan middleware web
  untuk cookie, session, dan CSRF. Gunakan transaksi dan kunci baris user
  dengan urutan yang sama saat mengirim dan memverifikasi.
- [x] Sediakan GET csrf-token, POST request-otp, POST verify-otp, GET me,
  dan POST logout. Verifikasi sukses meregenerasi session; logout membatalkannya.
- [x] Jalankan tes, format PHP, periksa route dan diff, lalu tinjau kode.
- [x] Dokumentasikan kontrak API, pengaturan SMTP, batas pengujian, dan
  cara pemanggilan API tanpa mengubah frontend.

Tes menggunakan SQLite in-memory dengan skema kolom/indeks yang sesuai
untuk auth; CHECK constraint MySQL dan perilaku kunci antarproses memerlukan
pengujian MySQL tersendiri. Mail dipalsukan saat tes; tidak mengirim email
ke pengguna maupun menjalankan migration pada database pengembangan.
