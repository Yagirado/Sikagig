# Manual Test Checklist: Auth — SIKAGIG

> Mencakup: OTP login/register, guard suspend, guard profil, NIM validasi.
> OTP testing dummy: `123456` (juragan@example.com), `234567` (sika@example.com)

---

## A. Register (Akun Baru via OTP)

| #   | Test Case                           | Steps                                                              | Expected                                                | Pass? |
| --- | ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ----- |
| 1   | Register sebagai CLIENT             | Masukkan email baru → klik "Daftar" → pilih role `client` → submit | OTP dikirim ke email                                    |       |
| 2   | Verifikasi OTP register             | Masukkan OTP yang dikirim                                          | Akun dibuat, token diterima, redirect ke `/gigs`        |       |
| 3   | Register sebagai FREELANCER         | Masukkan email baru → pilih role `freelancer`                      | OTP dikirim                                             |       |
| 4   | Verifikasi OTP freelancer           | Masukkan OTP                                                       | Akun dibuat, redirect ke `/gigs` — bisa browse langsung |       |
| 5   | Email sudah terdaftar saat register | Masukkan email yang sudah ada → pilih register                     | Arahkan ke flow login (bukan error)                     |       |
| 6   | OTP register expired                | Tunggu >10 menit lalu masukkan OTP                                 | Error "OTP sudah kedaluwarsa"                           |       |
| 7   | OTP register salah                  | Masukkan kode OTP yang salah                                       | Error "OTP tidak valid"                                 |       |
| 8   | OTP dipakai dua kali                | Pakai OTP yang sudah digunakan                                     | Error "OTP sudah digunakan"                             |       |

---

## B. Login (Akun Sudah Ada via OTP)

| #   | Test Case                          | Steps                                       | Expected                                    | Pass? |
| --- | ---------------------------------- | ------------------------------------------- | ------------------------------------------- | ----- |
| 9   | Login client normal                | Masukkan email → request OTP → masukkan OTP | Token diterima, redirect ke `/gigs`         |       |
| 10  | Login freelancer normal            | Masukkan email → OTP                        | Token diterima, redirect ke `/gigs`         |       |
| 11  | Token tersimpan                    | Login sukses                                | `localStorage.getItem('token')` ada isinya  |       |
| 12  | Email tidak terdaftar (login flow) | Masukkan email yang belum ada               | Diarahkan ke halaman register / pilih role  |       |
| 13  | OTP login expired                  | Tunggu >10 menit                            | Error "OTP sudah kedaluwarsa"               |       |
| 14  | OTP login salah                    | OTP yang salah                              | Error "OTP tidak valid"                     |       |
| 15  | Kirim ulang OTP                    | Klik "Kirim ulang" setelah 60 detik         | OTP baru dikirim, OTP lama tidak valid lagi |       |
| 16  | Kirim ulang sebelum 60 detik       | Klik "Kirim ulang" sebelum 60 detik         | Tombol disabled / countdown timer           |       |

---

## C. Login Freelancer yang Disuspend

| #   | Test Case                       | Steps                                                               | Expected                                                       | Pass? |
| --- | ------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- | ----- |
| 17  | Login freelancer suspended      | Masukkan email `sika.suspended@example.com` → OTP valid             | Error "Akun Anda telah disuspend: [alasan]", tidak dapat token |       |
| 18  | Token lama freelancer suspended | Login → suspend akun → coba akses protected route dengan token lama | Response 401, token sudah direvoke                             |       |
| 19  | Pesan alasan suspend muncul     | Login dengan akun suspended                                         | Pesan menampilkan `suspended_reason` yang diisi admin          |       |

---

## D. Token & Session

| #   | Test Case                         | Steps                                          | Expected                                   | Pass? |
| --- | --------------------------------- | ---------------------------------------------- | ------------------------------------------ | ----- |
| 20  | Akses protected route tanpa token | Buka `/dashboard` tanpa login                  | Redirect ke `/login`                       |       |
| 21  | Token tidak valid                 | Set localStorage token = `abc123` → request    | Response 401, redirect ke login            |       |
| 22  | Header Authorization ter-attach   | Login sukses → buka Network tab → buat request | Header `Authorization: Bearer <token>` ada |       |

---

## E. Logout

| #   | Test Case                        | Steps                                          | Expected                                                        | Pass? |
| --- | -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ----- |
| 23  | Logout normal                    | Klik logout                                    | Token direvoke di DB, localStorage bersih, redirect ke `/login` |       |
| 24  | Akses dashboard setelah logout   | Logout → navigasi ke `/dashboard`              | Redirect ke `/login`                                            |       |
| 25  | Token tidak valid setelah logout | Logout → request dengan token lama via Postman | Response 401                                                    |       |

---

## F. Role-Based Access

| #   | Test Case                     | Steps                                          | Expected               | Pass? |
| --- | ----------------------------- | ---------------------------------------------- | ---------------------- | ----- |
| 26  | CLIENT coba kirim proposal    | Login client → `POST /api/gigs/1/proposals`    | Response 403 Forbidden |       |
| 27  | FREELANCER coba buat gig      | Login freelancer → `POST /api/gigs`            | Response 403 Forbidden |       |
| 28  | Super admin akses panel admin | Login admin → `GET /api/admin/freelancers`     | Response 200           |       |
| 29  | Client coba akses panel admin | Login client → `GET /api/admin/freelancers`    | Response 403           |       |
| 30  | Freelancer coba suspend user  | Freelancer → `POST /api/admin/users/1/suspend` | Response 403           |       |

---

## G. Guard Kelengkapan Profil

| #   | Test Case                               | Steps                                          | Expected                                                                    | Pass? |
| --- | --------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- | ----- |
| 31  | Browse gig tanpa profil lengkap         | Login → buka `/gigs`                           | Daftar gig tampil normal ✅ (tidak perlu profil lengkap)                    |       |
| 32  | Lihat detail gig tanpa profil           | Klik salah satu gig                            | Detail tampil ✅                                                            |       |
| 33  | Freelancer belum lengkap coba ambil gig | Login `sika2@example.com` → klik "Ambil Gig"   | Backend: 403 `profile_incomplete` → Frontend: popup "Lengkapi Profil Dulu!" |       |
| 34  | Client belum lengkap coba buat gig      | Login `juragan2@example.com` → klik "Buat Gig" | Backend: 403 `profile_incomplete` → Frontend: popup                         |       |
| 35  | Popup ada tombol "Lengkapi Sekarang"    | Popup muncul                                   | Klik → redirect ke `/profile/edit`                                          |       |
| 36  | Setelah lengkapi profil, bisa lanjut    | Isi profil lengkap → submit → kembali ke gig   | Bisa ambil/buat gig tanpa popup                                             |       |
| 37  | Freelancer sudah lengkap kirim proposal | Login `sika@example.com` → klik "Ambil Gig"    | Form proposal muncul, tidak ada popup                                       |       |

---

## H. Validasi NIM

| #   | Test Case                            | Steps                                                                                  | Expected                                                   | Pass? |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----- |
| 38  | NIM tepat 13 digit angka             | Isi NIM `1234567890123` (13 digit) → save                                              | Tersimpan ✅                                               |       |
| 39  | NIM kurang dari 13 digit             | Isi NIM `123456789012` (12 digit) → save                                               | Error "NIM harus tepat 13 digit angka"                     |       |
| 40  | NIM lebih dari 13 digit              | Isi NIM `12345678901234` (14 digit) → save                                             | Error "NIM harus tepat 13 digit angka"                     |       |
| 41  | NIM mengandung huruf                 | Isi NIM `2310ABC170001` → save                                                         | Error "NIM hanya boleh berisi angka"                       |       |
| 42  | NIM mengandung spasi                 | Isi NIM `231063 170001` → save                                                         | Error "NIM tidak valid"                                    |       |
| 43  | NIM sudah dipakai user lain          | Freelancer A punya NIM `2310631170001` → Freelancer B coba daftar dengan NIM yang sama | Error "NIM sudah terdaftar"                                |       |
| 44  | Update NIM ke NIM sendiri            | User A edit profil, NIM tidak diubah → save                                            | Tersimpan ✅ (unique kecuali milik sendiri)                |       |
| 45  | NIM NULL (belum diisi)               | Freelancer belum isi NIM → coba ambil gig                                              | Kena guard `is_profile_complete = 0` → popup               |       |
| 46  | NIM kosong string                    | Kirim `nim: ""` via API                                                                | Validasi error "NIM wajib diisi"                           |       |
| 47  | NIM field ada di DB sebagai CHAR(13) | Cek via phpMyAdmin atau `DESCRIBE profiles`                                            | Tipe kolom `char(13)`, ada UNIQUE KEY dan CHECK constraint |       |
