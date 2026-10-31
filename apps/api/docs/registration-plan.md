# Rencana implementasi registrasi

Skema disetujui: formulir lengkap -> pendaftaran sementara -> OTP email ->
pembuatan akun terverifikasi -> session login 14 hari. Backend saja.

- [x] Tes HTTP lebih dulu: validasi field, duplikasi awal/akhir, OTP dan hash,
  cooldown/replacement, kegagalan mailer, batas percobaan, expiry, replay,
  pemisahan login/registrasi, session, CSRF, dan pembersihan data sementara.
- [x] Migration baru: pending_registrations (UUID, email unik, data terenkripsi,
  expires_at, timestamps); email_otps.user_id nullable dan relasi pending UUID.
  Pertahankan OTP/login yang sudah ada. Uji upgrade serta rollback terisolasi.
- [x] Lengkapi RegisterRequest: field formulir, NIM unik 13 digit, email unik,
  nomor HP 08/+62, gender, tanggal valid bukan masa depan, kedua persetujuan.
  Terima tanggal DD/MM/YYYY atau YYYY-MM-DD; simpan format database.
- [x] RegistrationController: request-otp mengunci draft per email,
  mengganti data dan OTP bersama; verify-otp mengunci draft sebelum challenge,
  cek ulang keunikan lalu buat user dan konsumsi OTP dalam satu transaksi.
- [x] Draft berlaku 30 menit, OTP 5 menit, cooldown 60 detik, maksimal 5 salah.
  Endpoint memakai web/CSRF dan throttle. Mail sinkron; gagal membatalkan draft.
- [x] Jadwalkan registrations:prune tiap 10 menit untuk menghapus draft kedaluwarsa.
- [x] Tes, format, review, verifikasi migration MySQL pada database sementara,
  dan dokumentasikan endpoint serta cara aktivasi migration.

Tidak mengirim email sungguhan saat tes. Tidak mengubah frontend atau alur Google.
