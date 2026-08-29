# Manual Test Checklist: Gig & Proposal — SIKAGIG

> Pastikan ada akun CLIENT dan FREELANCER aktif sebelum testing.
> Akun dummy: `juragan@example.com` / `sika@example.com` (password: `password`)

---

## A. CRUD Gig (Client)

### Buat Gig

| #   | Test Case               | Steps                                         | Expected                                          | Pass? |
| --- | ----------------------- | --------------------------------------------- | ------------------------------------------------- | ----- |
| 1   | Buat gig valid          | Login client → isi semua field → submit       | Gig tersimpan status `open`, muncul di list       |       |
| 2   | Buat gig onsite         | Centang `isOnsite` + isi lokasi → submit      | Gig tersimpan dengan `is_onsite=1`, lokasi terisi |       |
| 3   | Buat gig tanpa kategori | Submit tanpa pilih kategori                   | Error validasi                                    |       |
| 4   | Budget negatif / 0      | Masukkan budget `0` → submit                  | Error validasi                                    |       |
| 5   | Onsite tanpa lokasi     | Centang `isOnsite`, kosongkan lokasi → submit | Error validasi                                    |       |
| 6   | Deadline di masa lalu   | Pilih tanggal kemarin → submit                | Error validasi                                    |       |

### Edit & Hapus Gig

| #   | Test Case                       | Steps                                  | Expected                                     | Pass? |
| --- | ------------------------------- | -------------------------------------- | -------------------------------------------- | ----- |
| 7   | Edit gig `open`                 | Edit judul gig yang masih open         | Perubahan tersimpan                          |       |
| 8   | Edit gig `in_progress`          | Coba edit gig yang sudah in_progress   | Tombol edit tidak tersedia atau response 400 |       |
| 9   | Edit gig milik orang lain       | `PUT /api/gigs/{id_gig_orang_lain}`    | Response 403 Forbidden                       |       |
| 10  | Hapus gig `open` tanpa proposal | Hapus gig yang belum ada proposal      | Gig terhapus                                 |       |
| 11  | Hapus gig yang punya proposal   | Hapus gig yang sudah ada proposal      | Gig + proposal terhapus (cascade)            |       |
| 12  | Hapus gig milik orang lain      | `DELETE /api/gigs/{id_gig_orang_lain}` | Response 403 Forbidden                       |       |

---

## B. Browse Gig (Publik & Freelancer)

| #   | Test Case                            | Steps                                | Expected                             | Pass? |
| --- | ------------------------------------ | ------------------------------------ | ------------------------------------ | ----- |
| 13  | List gig tanpa login                 | Buka `/gigs` tanpa login             | Daftar gig `open` tampil             |       |
| 14  | Filter berdasarkan kategori          | Klik filter "Tugas & Akademik"       | Hanya gig kategori Tugas muncul      |       |
| 15  | Lihat detail gig                     | Klik salah satu gig                  | Halaman detail tampil lengkap        |       |
| 16  | Gig `in_progress` tidak bisa dilamar | Buka gig dengan status `in_progress` | Tombol "Kirim Proposal" tidak muncul |       |

---

## C. Kirim Proposal (Freelancer)

| #   | Test Case                 | Steps                                                                | Expected                                      | Pass? |
| --- | ------------------------- | -------------------------------------------------------------------- | --------------------------------------------- | ----- |
| 17  | Kirim proposal valid      | Login freelancer → buka gig `open` → isi cover letter + bid → submit | Proposal tersimpan status `pending`           |       |
| 18  | Melamar dua kali          | Submit proposal ke gig yang sudah dilamar                            | Error 409 "Sudah melamar gig ini"             |       |
| 19  | Melamar gig sendiri       | Client coba `POST /api/gigs/{id}/proposals`                          | Response 400 "Tidak bisa melamar gig sendiri" |       |
| 20  | Melamar gig `in_progress` | Kirim proposal ke gig in_progress                                    | Response 400 "Gig tidak menerima proposal"    |       |
| 21  | Cover letter kosong       | Submit tanpa cover letter                                            | Error validasi                                |       |
| 22  | Bid amount 0              | Submit dengan bidAmount = 0                                          | Error validasi                                |       |
| 23  | Bukan role freelancer     | Login sebagai client → `POST /api/gigs/1/proposals`                  | Response 403 Forbidden                        |       |

---

## D. Terima Proposal + Pilih Metode Bayar (Client)

| #   | Test Case                            | Steps                                          | Expected                                                                   | Pass? |
| --- | ------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- | ----- |
| 24  | Terima proposal — transfer           | Client terima proposal → pilih `bank_transfer` | Proposal `accepted`, gig → `in_progress`, escrow dibuat `awaiting_payment` |       |
| 25  | Terima proposal — ewallet            | Client terima proposal → pilih `ewallet`       | Sama seperti atas, method `ewallet`                                        |       |
| 26  | Terima proposal — **cash**           | Client terima proposal → pilih `cash`          | Proposal `accepted`, gig → `in_progress`, escrow langsung `holding`        |       |
| 27  | Tolak proposal                       | Client tolak proposal `pending`                | Proposal status `rejected`, gig tetap `open`                               |       |
| 28  | Terima proposal yang sudah accepted  | Coba terima proposal yang sudah `accepted`     | Response 400                                                               |       |
| 29  | Terima proposal milik gig orang lain | Client B coba terima proposal di gig Client A  | Response 403 Forbidden                                                     |       |

---

## E. Tarik Proposal (Freelancer)

| #   | Test Case                       | Steps                                            | Expected                                   | Pass? |
| --- | ------------------------------- | ------------------------------------------------ | ------------------------------------------ | ----- |
| 30  | Tarik proposal `pending`        | Freelancer withdraw proposal pending             | Status `withdrawn`                         |       |
| 31  | Tarik proposal `accepted`       | Coba withdraw proposal yang sudah accepted       | Response 400 "Proposal tidak bisa ditarik" |       |
| 32  | Tarik proposal milik orang lain | Freelancer A coba withdraw proposal Freelancer B | Response 403                               |       |

---

## F. Edge Cases

| #   | Test Case                          | Steps                                 | Expected                                   | Pass? |
| --- | ---------------------------------- | ------------------------------------- | ------------------------------------------ | ----- |
| 33  | Gig tidak ada                      | `GET /api/gigs/99999`                 | Response 404                               |       |
| 34  | 3 freelancer melamar gig yang sama | 3 akun berbeda melamar gig yang sama  | Semua berhasil, masing-masing 1 proposal   |       |
| 35  | Terima proposal → cek DB escrow    | Terima proposal → cek tabel `escrows` | Record escrow terbuat dengan FK yang benar |       |
