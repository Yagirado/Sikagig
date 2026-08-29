# Use Case Diagram — SIKAGIG

> Platform gig lokal yang mempertemukan juragan (Client) dengan sika (Freelancer).

---

## Diagram (Teks)

```
┌──────────────────────────────────────────────────────────┐
│                     SISTEM SIKAGIG                        │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │   AUTH (semua pengguna)  │                            │
│  │  ○ Register              │                            │
│  │  ○ Login                 │                            │
│  │  ○ Logout                │                            │
│  │  ○ Onboarding Profil     │                            │
│  │  ○ Edit Profil           │                            │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │  MANAJEMEN GIG (Client)  │                            │
│  │  ○ Buat Gig              │                            │
│  │  ○ Edit Gig              │                            │
│  │  ○ Hapus Gig             │                            │
│  │  ○ Lihat Proposal Masuk  │                            │
│  │  ○ Terima Proposal       │                            │
│  │  ○ Tolak Proposal        │                            │
│  │  ○ Konfirmasi Gig Selesai│                            │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │ CARI & LAMAR (Freelancer)│                            │
│  │  ○ Jelajahi Daftar Gig   │                            │
│  │  ○ Filter Gig            │                            │
│  │  ○ Lihat Detail Gig      │                            │
│  │  ○ Kirim Proposal        │                            │
│  │  ○ Tarik Proposal        │                            │
│  │  ○ Lihat Status Proposal │                            │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────┐                            │
│  │   PUBLIK (tanpa login)   │                            │
│  │  ○ Lihat Landing Page    │                            │
│  │  ○ Lihat Daftar Gig      │                            │
│  │  ○ Lihat Detail Gig      │                            │
│  │  ○ Lihat Profil Publik   │                            │
│  └──────────────────────────┘                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
        ▲                   ▲
   ┌────┴────┐         ┌────┴──────┐
   │ Client  │         │Freelancer │
   │(Juragan)│         │  (Sika)   │
   └─────────┘         └───────────┘
```

---

## Aktor

| Aktor                 | Deskripsi                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Pengunjung**        | Pengguna yang belum login — bisa melihat landing page, daftar gig, dan profil publik |
| **Client (Juragan)**  | Pengguna dengan role CLIENT — yang membutuhkan jasa dan memposting gig               |
| **Freelancer (Sika)** | Pengguna dengan role FREELANCER — yang menawarkan jasa dan melamar gig               |

---

## Use Case Per Aktor

### Pengunjung (Tanpa Login)

| ID    | Use Case            | Keterangan                                      |
| ----- | ------------------- | ----------------------------------------------- |
| UC-01 | Lihat Landing Page  | Halaman marketing utama                         |
| UC-02 | Lihat Daftar Gig    | Tanpa perlu akun                                |
| UC-03 | Lihat Detail Gig    | Tanpa perlu akun                                |
| UC-04 | Lihat Profil Publik | Profil freelancer yang bisa dilihat semua orang |
| UC-05 | Register            | Pilih role (Client atau Freelancer)             |
| UC-06 | Login               | Masuk ke akun                                   |

### Client (Juragan)

| ID    | Use Case                 | Keterangan                                    |
| ----- | ------------------------ | --------------------------------------------- |
| UC-07 | Onboarding Profil Client | Isi company, industry setelah register        |
| UC-08 | Buat Gig                 | Posting pekerjaan baru                        |
| UC-09 | Edit Gig                 | Ubah detail gig yang belum `IN_PROGRESS`      |
| UC-10 | Hapus Gig                | Hapus gig yang belum ada proposal             |
| UC-11 | Lihat Proposal Masuk     | Lihat semua proposal untuk gig miliknya       |
| UC-12 | Terima Proposal          | Status proposal → ACCEPTED, gig → IN_PROGRESS |
| UC-13 | Tolak Proposal           | Status proposal → REJECTED                    |
| UC-14 | Konfirmasi Gig Selesai   | Gig → COMPLETED                               |
| UC-15 | Dashboard Client         | Ringkasan gig aktif dan proposal masuk        |
| UC-16 | Edit Profil Client       | Ubah data profil                              |
| UC-17 | Logout                   | Keluar dari sesi                              |

### Freelancer (Sika)

| ID    | Use Case                     | Keterangan                                        |
| ----- | ---------------------------- | ------------------------------------------------- |
| UC-18 | Onboarding Profil Freelancer | Isi skills, headline, experience level, portfolio |
| UC-19 | Jelajahi Daftar Gig          | Lihat semua gig yang `OPEN`                       |
| UC-20 | Filter Gig                   | Filter berdasarkan kategori                       |
| UC-21 | Kirim Proposal               | Lamar gig dengan cover letter + bid amount        |
| UC-22 | Tarik Proposal               | Withdraw proposal yang masih `PENDING`            |
| UC-23 | Lihat Status Proposal        | Pantau proposal yang sudah dikirim                |
| UC-24 | Dashboard Freelancer         | Ringkasan proposal saya dan gig yang dikerjakan   |
| UC-25 | Edit Profil Freelancer       | Ubah skills, headline, portfolio                  |
| UC-26 | Logout                       | Keluar dari sesi                                  |

---

## Relasi Use Case

### Include

| Use Case                | Includes                     | Keterangan       |
| ----------------------- | ---------------------------- | ---------------- |
| Buat Gig (UC-08)        | Login (UC-06)                | Harus login dulu |
| Kirim Proposal (UC-21)  | Login (UC-06)                | Harus login dulu |
| Terima Proposal (UC-12) | Lihat Proposal Masuk (UC-11) | Harus lihat dulu |

### Extend

| Use Case                       | Extends                 | Kondisi                             |
| ------------------------------ | ----------------------- | ----------------------------------- |
| Konfirmasi Gig Selesai (UC-14) | Terima Proposal (UC-12) | Hanya setelah ada proposal diterima |
| Tarik Proposal (UC-22)         | Kirim Proposal (UC-21)  | Hanya saat status masih PENDING     |

---

## Aturan Akses

| Role       | Bisa                                  | Tidak Bisa                          |
| ---------- | ------------------------------------- | ----------------------------------- |
| Pengunjung | UC-01 s/d UC-06                       | Semua UC yang butuh login           |
| Client     | Semua UC pengunjung + UC-07 s/d UC-17 | Kirim proposal, lihat proposal saya |
| Freelancer | Semua UC pengunjung + UC-18 s/d UC-26 | Buat gig, terima/tolak proposal     |
