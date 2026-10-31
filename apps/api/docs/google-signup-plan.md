# Daftar dengan Google

Desain disetujui pengguna: verifikasi Google lalu langsung membuka draft
registrasi; pemeriksaan email/sub duplikat dilakukan saat submit. Backend saja
mengikuti lingkup sebelumnya. Gunakan endpoint terpisah daripada parameter
callback dari browser agar maksud daftar disimpan dalam session OAuth.

1. Tambahkan tes GoogleAuthTest: akun lama tetap mendapat draft tanpa login
   atau linking; akun baru bisa menyelesaikan registrasi; sub/email duplikat
   ditolak saat submit; OTP pihak ketiga hanya membuktikan email, tidak login.
   Jalankan `php artisan test --compact --filter=GoogleAuthTest`, pastikan tes
   baru gagal karena endpoint belum tersedia.
2. routes/api.php: GET /api/auth/google/register/redirect dengan session lock
   60 detik. GoogleAuthController::registerRedirect memanggil
   authorizationUrl($request, 'register'). Callback memeriksa flow session
   setelah verifikasi token; register membuat draft dengan target_user_id null
   dan profil People API lalu redirect /google atau /google?step=verify-email.
   Alur login/profile lama dan validasi submit tetap dipakai.
3. Perbarui pesan duplikasi email agar menyarankan login. Dokumentasikan
   endpoint baru di google-auth.md. Jalankan Pint, tes auth dan diff --check.
   Tidak perlu migrasi atau perubahan konfigurasi Google Console.

Hasil: implementasi selesai. Lima tes baru awalnya gagal 404 sebelum endpoint
ditambahkan, kemudian seluruh 86 tes autentikasi lulus (666 assertion).
Pint dan git diff --check lulus. Endpoint GET daftar dan POST submit terdaftar
di route:list. Integrasi tombol frontend serta OAuth Google nyata belum diuji.
