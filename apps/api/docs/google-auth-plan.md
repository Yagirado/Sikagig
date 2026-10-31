# Implementasi backend Google

Mengikuti google-auth-design.md. Backend saja; callback lama tetap menjadi alias
agar GOOGLE_REDIRECT_URI yang sudah dikonfigurasi tetap berlaku.

- [x] Tes OAuth dengan JWT RSA bertanda tangan dan HTTP Google palsu; tes akun
  lama, draft baru, penolakan token/state, profil opsional, kepemilikan session,
  OTP email pihak ketiga, bentrok akun, dan pembuatan akun transaksional.
- [x] Client OAuth dengan state+nonce+PKCE, timeout, validasi issuer/audience/
  expiry/signature/nonce dan cache kunci publik dari endpoint Google tetap.
- [x] Tambahkan provider dan owner_hash pada pending_registrations, pisahkan
  email/google. Alur OTP email hanya boleh menggunakan draft provider email.
- [x] Service draft Google, relasi sub/user, OTP pembuktian email, dan submit
  profil. Email/sub hanya dari hasil verifikasi backend; tidak dari formulir.
- [x] Controller redirect/callback, profil People API opsional, draft, OTP,
  dan registrasi. URL redirect aplikasi berasal dari konfigurasi tetap.
- [x] Uji ulang auth, migration MySQL terisolasi, format, review, aktivasi
  migration lokal, dan dokumentasikan konfigurasi serta batas integrasi.

Hasil 13 September 2026: 36 tes Google lulus. Suite lengkap 85/86 lulus;
satu kegagalan lama ExampleTest disebabkan view welcome yang tidak tersedia.
Seluruh tes autentikasi lulus. Harness MySQL lulus untuk migrasi, callback JWT,
registrasi Google/email, konflik collation email, session, rollback dan pasang
ulang. Pint dan git diff --check lulus. Temuan review tentang jeda OTP ketika
OAuth diulang diperbaiki dan memiliki tes regresi. Migrasi provider lokal
berstatus Ran pada batch 3. Belum menguji akun Google atau email nyata.
