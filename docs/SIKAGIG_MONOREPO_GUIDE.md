# Sikagig — Monorepo Structure and Development Roadmap

Dokumen ini menjelaskan struktur folder final project **Sikagig**, pembagian tugas tim, desain database, dan urutan pengerjaan yang disarankan.

Sikagig adalah platform gig lokal. Satu akun bisa **posting gig** (sebagai pemberi kerja) sekaligus **mengerjakan gig** (sebagai pengerjaan) — tidak ada pemisahan role client/freelancer.

---

# 1. Tim dan Pembagian Tugas

Kelompok terdiri dari **4 orang**. Detail lengkap ada di `docs/PEMBAGIAN_MODUL.md`.

## Nugi — Login, Chat & Explore

**Tanggung jawab:**

- Sistem autentikasi OTP via email (login + register)
- Halaman explore / browse gig publik
- Fitur chat real-time antar pengguna

**File utama:**

```
apps/api/Controllers/AuthController.php
apps/api/Controllers/ChatController.php
apps/web/src/pages/auth/
apps/web/src/pages/explore/
apps/web/src/pages/chat/
apps/web/src/contexts/AuthContext.jsx
apps/web/src/services/auth.service.js
```

**Deliverable:**

- Login via OTP berfungsi, token tersimpan
- Halaman explore menampilkan daftar gig
- Chat inbox + chat room berjalan

---

## Nando — Pembayaran, Notifikasi & Homepage

**Tanggung jawab:**

- Sistem escrow (deposit, hold, release, refund)
- Wallet user (saldo + riwayat)
- Notifikasi in-app
- Panel admin suspend/unsuspend
- Homepage setelah login

**File utama:**

```
apps/api/Controllers/EscrowController.php
apps/api/Controllers/WalletController.php
apps/api/Controllers/NotificationController.php
apps/api/Controllers/AdminController.php
apps/web/src/pages/home/
apps/web/src/pages/payment/
apps/web/src/pages/wallet/
apps/web/src/pages/admin/
apps/web/src/components/notifications/
```

**Deliverable:**

- Flow escrow berjalan (deposit → holding → release)
- Notif muncul di bell icon
- Homepage menampilkan feed gig

---

## Ray — CRUD Gig & Page Gig

**Tanggung jawab:**

- CRUD Gig (buat, edit, hapus, detail)
- Proposal (kirim, terima, tolak, withdraw)
- Guard profil belum lengkap
- Auto-create escrow saat proposal diterima

**File utama:**

```
apps/api/Controllers/GigController.php
apps/api/Controllers/ProposalController.php
apps/api/Middleware/ProfileComplete.php
apps/web/src/pages/gigs/
apps/web/src/pages/proposals/
```

**Deliverable:**

- CRUD gig berjalan dari frontend
- Proposal flow berjalan (kirim → terima/tolak)
- Escrow otomatis terbuat saat proposal diterima

---

## Yasmin — Aktivitas & Profil

**Tanggung jawab:**

- CRUD profil + onboarding
- Halaman aktivitas (gig & proposal berjalan)
- Dashboard ringkasan
- **Komponen UI dasar** (Button, Input, Card, Modal, Navbar, dll)

**File utama:**

```
apps/api/Controllers/ProfileController.php
apps/web/src/pages/profile/
apps/web/src/pages/onboarding/
apps/web/src/pages/activity/
apps/web/src/pages/dashboard/
apps/web/src/components/ui/
apps/web/src/components/layout/
```

**Deliverable:**

- Profil bisa diedit, `is_profile_complete` terupdate otomatis
- Halaman aktivitas menampilkan gig + proposal aktif
- Komponen UI dasar tersedia di sprint pertama

---

## Koordinasi Tim

```
Yasmin  → Komponen UI dasar selesai duluan (sprint 1)
Nugi    → Auth endpoint + halaman login (semua butuh token dari sini)
Ray     → Gig + proposal (butuh token Nugi + profil Yasmin)
Nando   → Escrow + notif (butuh proposal accepted dari Ray)
Yasmin  → Dashboard + aktivitas (gabungkan data dari Ray + Nando)
```

**Urutan prioritas:**

```
1. Yasmin : komponen UI dasar (Button, Input, Card, Navbar)
2. Nugi   : auth OTP + halaman explore
3. Ray    : CRUD gig + proposal
4. Nando  : escrow + wallet + notifikasi
5. Yasmin : aktivitas + dashboard
```

---

# 2. Desain Database

Database menggunakan **MySQL 8** dengan **Laravel Eloquent** (bukan Prisma).
Schema lengkap ada di `apps/database/sikagig.sql`.

## Ringkasan Tabel

| Tabel           | Deskripsi                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| `users`         | Akun pengguna. Role: `user` \| `super_admin`. Login via OTP, tidak ada password. |
| `otp_codes`     | Kode OTP 6 digit, expired 10 menit, sekali pakai.                                |
| `profiles`      | Profil tiap user. `is_profile_complete = 1` wajib sebelum buat/ambil gig.        |
| `categories`    | Master kategori gig (tugas, belanja, antar-jemput, dll).                         |
| `gigs`          | Postingan gig. `client_id` = user yang posting.                                  |
| `proposals`     | Lamaran ke gig. `user_id` = user yang melamar (bukan `freelancer_id`).           |
| `escrows`       | Dana escrow per deal. `client_id` = pemberi kerja, `worker_id` = pengerjaan.     |
| `payments`      | Log transaksi keuangan per escrow.                                               |
| `wallets`       | Saldo user. Semua user bisa punya wallet.                                        |
| `notifications` | Notifikasi in-app.                                                               |
| `conversations` | Sesi percakapan antar dua user.                                                  |
| `messages`      | Pesan dalam satu conversation.                                                   |
| `suspend_logs`  | Audit trail suspend/unsuspend oleh super_admin.                                  |

## Role

```
user        → pengguna biasa. Bisa POSTING gig sekaligus MENGERJAKAN gig
              dalam satu akun yang sama. Tidak ada pemisahan client/freelancer.
super_admin → akses admin panel, bisa suspend/unsuspend user.
```

## Guard `is_profile_complete`

```
Buat gig  → is_profile_complete = 1 (cukup isi name)
Kirim proposal → is_profile_complete = 1 AND nim IS NOT NULL AND faculty IS NOT NULL
```

## Status Flow Escrow

```
Cash    : confirm-cash → holding → released   (saldo wallet TIDAK bertambah)
Non-Cash: deposit      → holding → released   (saldo wallet bertambah saat released)
Refund  :              → refunded             (non-cash only)
```

---

## Seed Data Awal

```sql
-- Kategori (ada di sikagig.sql)
INSERT INTO categories (name, slug) VALUES
  ('Tugas & Akademik', 'tugas'),
  ('Belanja & Titip',  'belanja'),
  ('Antar & Jemput',   'antar-jemput'),
  ('Riset & Survei',   'riset'),
  ('COD & Antri',      'cod-antri'),
  ('Jasa Freelance',   'jasa'),
  ('Lainnya',          'lainnya');
```

---

# 3. Arsitektur Project

```text
sikagig/
├── apps/
│   ├── landing/   → https://sikagig.id
│   ├── web/       → https://app.sikagig.id
│   └── api/       → https://api.sikagig.id
├── packages/
├── package.json
└── pnpm-workspace.yaml
```

---

# 4. Teknologi yang Digunakan

## Landing Page

```
React + TypeScript + Vite
Tailwind CSS
React Router
```

## Web App

```
React + TypeScript + Vite
Tailwind CSS
React Router
TanStack Query
React Hook Form + Zod
Axios
Lucide React
```

## Backend API

```
PHP + Laravel 12
MySQL 8
Laravel Sanctum (token auth)
Laravel Mail (OTP via email)
```

---

# 5. Struktur Folder Final

```text
sikagig/
├── apps/
│   ├── landing/
│   │   └── src/
│   │       ├── components/
│   │       ├── sections/
│   │       └── pages/
│   │
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   └── layout/
│   │       ├── pages/
│   │       │   ├── auth/
│   │       │   ├── onboarding/
│   │       │   ├── dashboard/
│   │       │   ├── gigs/
│   │       │   └── proposals/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── hooks/
│   │       └── types/
│   │
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── src/
│           ├── controllers/
│           ├── services/
│           ├── routes/
│           ├── middlewares/
│           └── schemas/
│
└── packages/
    ├── types/     → shared TypeScript types
    └── ui/        → shared components (nanti)
```

---

# 6. Urutan Pengerjaan

## Sprint 1 — Setup + Fondasi (Semua)

- Monorepo berjalan: `pnpm dev:web`, `pnpm dev:api` OK
- **Yasmin**: komponen UI dasar selesai (Button, Input, Card, Modal, Navbar)
- **Nugi**: auth endpoint (request-otp, verify-otp) + halaman login

## Sprint 2 — Explore & Gig

- **Nugi**: halaman explore berjalan, filter kategori
- **Ray**: CRUD gig endpoint + halaman buat/edit/detail gig

## Sprint 3 — Proposal & Profil

- **Yasmin**: profil endpoint + halaman edit profil + onboarding
- **Ray**: proposal endpoint + form kirim proposal + terima/tolak
- Auto-create escrow saat proposal diterima (Ray backend → trigger Nando)

## Sprint 4 — Pembayaran & Notifikasi

- **Nando**: escrow deposit/release/refund + wallet
- **Nando**: notifikasi in-app + homepage feed
- **Nando**: panel admin suspend/unsuspend

## Sprint 5 — Aktivitas, Chat & Dashboard

- **Yasmin**: halaman aktivitas + dashboard ringkasan
- **Nugi**: chat inbox + chat room

## Sprint 6 — Polish

- Responsivitas semua halaman (375px, 768px, 1280px)
- Empty state, error state, loading skeleton
- Bug fixes

---

# 7. API Endpoints

## Auth (Nugi)

```
POST  /api/auth/request-otp      → kirim OTP ke email
POST  /api/auth/verify-otp       → verifikasi OTP → return token
POST  /api/auth/logout            → revoke token
GET   /api/auth/me                → data user yang sedang login
```

## Gig (Ray)

```
GET    /api/gigs                  → list gig publik + filter kategori
GET    /api/gigs/{id}             → detail gig
POST   /api/gigs                  → buat gig (is_profile_complete = 1)
PUT    /api/gigs/{id}             → edit gig (pemilik only)
DELETE /api/gigs/{id}             → hapus gig (pemilik only)
```

## Proposal (Ray)

```
POST   /api/gigs/{id}/proposals   → kirim proposal (nim + faculty wajib ada)
GET    /api/proposals             → daftar proposal saya
GET    /api/proposals/{id}        → detail proposal
PATCH  /api/proposals/{id}/status → terima / tolak + pilih metode bayar
DELETE /api/proposals/{id}        → withdraw proposal
```

## Profil (Yasmin)

```
GET    /api/profile               → profil saya
PUT    /api/profile               → update profil
GET    /api/users/{id}/profile    → profil publik user lain
GET    /api/activity              → gig & proposal aktif milik saya
```

## Escrow & Wallet (Nando)

```
GET    /api/escrows/{id}                → detail escrow
POST   /api/escrows/{id}/deposit        → deposit (transfer/ewallet)
POST   /api/escrows/{id}/confirm-cash   → konfirmasi bayar cash
POST   /api/escrows/{id}/release        → release dana
POST   /api/escrows/{id}/refund         → refund

GET    /api/wallet                      → saldo wallet saya
GET    /api/wallet/history              → riwayat transaksi
```

## Notifikasi (Nando)

```
GET    /api/notifications               → daftar notifikasi
PATCH  /api/notifications/{id}/read    → tandai baca
PATCH  /api/notifications/read-all     → tandai semua baca
```

## Admin (Nando)

```
GET    /api/admin/users                 → daftar user (super_admin only)
POST   /api/admin/users/{id}/suspend    → suspend user
POST   /api/admin/users/{id}/unsuspend  → unsuspend user
GET    /api/admin/suspend-logs          → riwayat suspend
```

## Chat (Nugi)

```
GET    /api/conversations               → daftar inbox
POST   /api/conversations               → mulai percakapan baru
GET    /api/conversations/{id}/messages → ambil pesan
POST   /api/conversations/{id}/messages → kirim pesan
```

## Kategori (Ray + Nugi)

```
GET    /api/categories                  → daftar kategori
```

---

# 8. Environment Variables

## Web (`apps/web/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_LANDING_URL=http://localhost:5173
```

## API (`apps/api/.env.example`)

```env
APP_NAME=Sikagig
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sikagig
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5174

MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=no-reply@sikagig.com
MAIL_FROM_NAME=Sikagig
```

---

# 9. Development Ports

```
Landing → http://localhost:5173
Web     → http://localhost:5174
API     → http://localhost:8000  (Laravel artisan serve)
```

---

# 10. Aturan Pengembangan

1. **Jangan mulai sprint berikutnya** sebelum fondasi sprint ini selesai.
2. **Yasmin selesaikan komponen UI dasar duluan** sebelum anggota lain butuh.
3. **Nugi selesaikan auth** — semua anggota lain butuh token dari sini.
4. **Ray** auto-create escrow saat proposal accepted — koordinasi dengan Nando.
5. Gunakan `TypeScript strict`, hindari `any`.
6. Jangan commit `.env` — pakai `.env.example`.
7. Setiap halaman wajib punya **loading**, **error**, dan **empty state**.
8. Branch dari `develop`: format `feat/[nama]-[fitur]`
   Contoh: `feat/nugi-auth-otp`, `feat/ray-gig-crud`, `feat/nando-escrow`
9. Tidak ada role `client`/`freelancer` — satu user bisa keduanya.
   Bedakan peran berdasarkan konteks: `gig.client_id` vs `proposal.user_id`.
