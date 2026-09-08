# Skema login SIKAGIG

`auth_schema.sql` adalah skema mandiri untuk **MySQL 8.0.16+**, mengikuti
engine skema lama di `apps/database/sikagig.sql`. Konfigurasi Laravel saat
file ini dibuat masih SQLite. File ini belum diimpor ke database aplikasi.

## Cakupan dan keputusan

- Login tanpa password: email + OTP atau identitas Google yang telah diverifikasi.
- Kalimat "email terdaftar langsung ke homepage" ditafsirkan sebagai **login
  Google**, bukan sekadar memasukkan alamat email tanpa bukti kepemilikan.
- NIM dan email unik per pengguna. Nomor telepon tidak harus unik.
- Satu pengguna boleh memiliki login email dan satu akun Google yang terhubung.
- Profil Google baru dapat disimpan sementara dengan kolom profil NULL.
  Semua data pendaftaran wajib dilengkapi sebelum akses homepage.
- `name` menyimpan nama lengkap agar konsisten dengan model User Laravel.
- `gender`: `male`, `female`, `other`, atau `prefer_not_to_say`.
  Label UI boleh diterjemahkan; nilai lain dari Google harus dipetakan.
- Default rancangan OTP: 6 digit, berlaku 10 menit, maksimal 5 percobaan,
  jeda kirim ulang 60 detik. Batas waktu, panjang kode, dan cooldown diterapkan
  backend; SQL hanya menyediakan kolom dan constraint pendukung.
  Halaman OTP React saat ini menggunakan 4 input dan perlu diselaraskan.

## Tabel

| Tabel | Isi |
| --- | --- |
| `users` | NIM, nama lengkap, email, telepon, gender, tanggal lahir, status verifikasi dan kelengkapan profil |
| `google_accounts` | Hubungan user dengan identifier Google `sub` yang stabil dan unik |
| `email_otps` | Challenge login/registrasi, hash OTP, waktu kedaluwarsa, jumlah percobaan, waktu penggunaan |
| `sessions` | Sesi Laravel, termasuk sesi tamu sebelum login |

Relasi: `users` 1:0..1 `google_accounts`, `users` 1:N `email_otps`,
dan `users` 1:N `sessions`. Penghapusan user menghapus ketiga data turunannya.

## Alur email dan pendaftaran

1. Backend memvalidasi dan menormalkan email (trim dan lowercase) lalu mencari
   `users.email`. Jangan mengubah titik atau alias `+` pada alamat email.
2. Email tidak ada: arahkan ke form pendaftaran dengan email terisi.
3. Form berisi NIM, nama lengkap, email, telepon, gender, dan tanggal lahir.
   Validasi format email, nomor telepon, tanggal lahir yang valid/tidak di masa
   depan, serta NIM unik. Simpan user dengan `email_verified_at = NULL`.
   Isi `profile_completed_at` setelah seluruh data lolos validasi.
4. Email terdaftar dan terverifikasi: buat challenge `login` dan kirim OTP.
   Akun pendaftaran yang belum terverifikasi melanjutkan challenge `register`.
5. Backend menghasilkan OTP dengan generator acak kriptografis, menyimpan
   `Hash::make($code)` pada `code_hash`, lalu mengirim kode asli melalui email.
   Pembuatan baris database sendiri tidak mengirim email.
6. Verifikasi menerima UUID challenge dan kode. Dalam transaksi dengan row lock
   (`SELECT ... FOR UPDATE`), cocokkan tujuan, email tujuan dengan email user saat
   ini, masa berlaku, `consumed_at IS NULL`, dan batas percobaan. Bandingkan kode
   dengan `Hash::check`. Kegagalan menambah `attempts` secara atomik.
7. Jika benar, tandai challenge terpakai dan isi `email_verified_at`; invalidasi
   challenge lain milik user dalam transaksi yang sama. Jangan memakai ulang OTP.
8. Regenerasi sesi setelah autentikasi. User terverifikasi dengan profil lengkap
   masuk homepage (route frontend saat ini `/dashboard`); lainnya hanya boleh
   mengakses pengisian profil/logout. Terapkan pembatasan ini juga di backend.

Kirim ulang mengganti UUID dan hash pada slot `(user_id, purpose)` yang sama,
sehingga kode/challenge lama tidak berlaku. Terapkan cooldown dan rate limit
per akun/email serta IP untuk pengiriman dan percobaan verifikasi; resend tidak
boleh menghapus batas percobaan agregat. Akun yang belum diverifikasi tidak boleh
ditimpa data profilnya hanya berdasarkan email dari request anonim.

## Alur Google

1. Backend memverifikasi ID token menggunakan library resmi/terawat: signature,
   issuer, audience, expiry, serta state/nonce sesuai flow. Jangan mempercayai
   email atau `sub` yang dikirim frontend tanpa memverifikasi token.
2. Cari `google_accounts.google_sub`. Jika sudah terhubung, gunakan user tersebut.
3. Jika belum terhubung dan email belum ada, buat user sementara, isi data yang
   tersedia, dan hubungkan `google_sub`. Tandai email terverifikasi hanya jika
   ada bukti verifikasi yang sesuai; jika tidak, minta OTP ke email tersebut.
4. Jika email sudah ada tetapi Google belum terhubung, jangan membuat user kedua.
   Hubungkan melalui sesi user yang sudah terautentikasi atau verifikasi OTP
   email akun yang ada terlebih dahulu. Login berikutnya lewat `sub` tersebut
   tidak memerlukan OTP tambahan.
5. Profil lengkap dan email terverifikasi: homepage. Profil belum lengkap:
   form pelengkapan data, dengan nama dan email yang tersedia sudah terisi.
6. Login Google dasar menyediakan identitas/nama/email sesuai claim yang tersedia.
   Telepon, gender, dan tanggal lahir **tidak dijamin tersedia**: memerlukan
   People API, scope/izin yang sesuai, dan data yang benar-benar tersedia.
   Tanggal lahir tanpa tahun tidak dapat mengisi kolom DATE; minta pengguna
   melengkapinya. NIM diisi manual. Jangan menimpa profil yang sudah dikonfirmasi
   setiap kali user login Google.

Referensi:
- https://developers.google.com/identity/openid-connect/openid-connect
- https://developers.google.com/people/api/rest/v1/people/get

## Cara menggunakan dan batas integrasi

Pilih database MySQL kosong di phpMyAdmin, lalu import `auth_schema.sql`.
Alternatif dari prompt client MySQL setelah memilih database kosong:

```sql
SOURCE C:/laragon/www/Sikagig/apps/api/database/auth_schema.sql;
```

File tidak berisi `DROP TABLE`, data pengguna contoh, maupun `CREATE DATABASE`.
Import akan gagal jika tabel bernama sama sudah ada; ini bukan skrip upgrade.
MySQL DDL tidak sepenuhnya transaksional, jadi gunakan database kosong khusus.

SQL ini baru struktur data, belum endpoint login, email sender, Google OAuth,
atau integrasi frontend. Sebelum aplikasi memakainya:

- Sesuaikan koneksi Laravel dari SQLite ke database MySQL tujuan.
- Selaraskan migration dan model User/factory dengan skema tanpa password dan
  field baru. Migration `create_users_table` lama membuat `users` dan `sessions`
  yang sama, jadi **jangan menjalankan migration lama di atas hasil import**.
- Migration percakapan yang ada juga bergantung pada `gigs` dan `proposals`,
  yang sengaja tidak termasuk skema khusus login ini.
- Jika memakai database untuk cache/queue, sediakan tabel infrastrukturnya melalui
  migration yang diselaraskan. Alternatif pengembangan awal: cache file dan queue
  sync. File ini hanya menyertakan tabel session untuk kebutuhan autentikasi.
- Implementasikan endpoint, otorisasi pelengkapan profil, cookie/session + CSRF
  dan CORS untuk frontend, pengiriman email, Google OAuth, serta pengujian alur.
- Constraint database membantu integritas data; keputusan autentikasi, validasi
  input, OTP sekali pakai, dan redirect tetap menjadi tanggung jawab aplikasi.
