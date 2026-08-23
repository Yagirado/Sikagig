# Manual Test Checklist: Profile — SIKAGIG

> Gunakan checklist ini untuk memverifikasi semua flow profil.

---

## A. Edit Profil Client

| #   | Test Case                        | Steps                                 | Expected Result               | Pass? |
| --- | -------------------------------- | ------------------------------------- | ----------------------------- | ----- |
| 1   | Edit nama                        | Login CLIENT → edit nama → save       | Nama berubah di profil        |       |
| 2   | Edit company & industry          | Ubah data company dan industry → save | Tersimpan, tampil di profil   |       |
| 3   | Edit bio lebih dari 300 karakter | Ketik bio 301 karakter → save         | Error validasi                |       |
| 4   | Hapus nama (kosongkan)           | Kosongkan field nama → save           | Error validasi, nama required |       |

---

## B. Edit Profil Freelancer

| #   | Test Case                 | Steps                                       | Expected Result                    | Pass? |
| --- | ------------------------- | ------------------------------------------- | ---------------------------------- | ----- |
| 5   | Tambah skill              | Login FREELANCER → tambah skill baru → save | Skill muncul di profil             |       |
| 6   | Hapus semua skill         | Hapus semua skill → save                    | Error validasi (minimal 1 skill)   |       |
| 7   | Ganti experience level    | Ubah dari BEGINNER ke INTERMEDIATE          | Tersimpan                          |       |
| 8   | Portfolio URL tidak valid | Masukkan "bukan-url" → save                 | Error validasi format URL          |       |
| 9   | Edit headline             | Ubah headline/tagline                       | Tersimpan, muncul di profil publik |       |

---

## C. Profil Publik

| #   | Test Case                   | Steps                                   | Expected Result                                   | Pass? |
| --- | --------------------------- | --------------------------------------- | ------------------------------------------------- | ----- |
| 10  | Lihat profil freelancer     | GET /api/v1/users/:freelancerId/profile | Data profil publik tampil (skills, headline, dll) |       |
| 11  | Lihat profil tanpa login    | Akses profil publik tanpa auth          | Data tampil (publik endpoint)                     |       |
| 12  | Lihat profil yang tidak ada | GET /api/v1/users/id-tidak-ada/profile  | Response 404                                      |       |
| 13  | Password tidak terexpose    | GET /api/v1/profile                     | Response tidak mengandung field password          |       |

---

## D. GET /profile (Profil Sendiri)

| #   | Test Case            | Steps                                          | Expected Result             | Pass? |
| --- | -------------------- | ---------------------------------------------- | --------------------------- | ----- |
| 14  | Ambil profil sendiri | Login → GET /api/v1/profile                    | Data lengkap profil sendiri |       |
| 15  | Tanpa token          | GET /api/v1/profile tanpa Authorization header | Response 401                |       |
