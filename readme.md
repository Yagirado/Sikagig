<p align="center">
  <h1 align="center">🎯 SIKAGIG</h1>
  <p align="center"><strong>Sika Gig — Platform Gig Lokal</strong></p>
  <p align="center">
    Platform yang mempertemukan <strong>juragan</strong> (yang butuh bantuan) dengan <strong>sika</strong> (yang siap mengerjakan).<br>
    Mulai dari joki tugas, beliin barang, tebengan, sampai order jasa freelance.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React.js-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Google_OAuth-Login-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google OAuth">
  <img src="https://img.shields.io/badge/Escrow-Payment-10B981?style=for-the-badge" alt="Escrow">
  <img src="https://img.shields.io/badge/pnpm-Monorepo-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://github.com/sikagig/sikagig/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI Status">
</p>

---

## Deskripsi Singkat

SIKAGIG adalah platform gig lokal berbasis web dengan arsitektur **monorepo** (pnpm workspace). Platform ini memiliki dua role: **Client (Juragan)** yang memposting pekerjaan dan **Freelancer (Sika)** yang melamar dan mengerjakannya. Dilengkapi sistem **escrow** untuk keamanan pembayaran, login via **Google OAuth**, dan opsi **bayar cash di tempat**.

**Status proyek**: 🔄 In Development

---

## Anggota Kelompok

| Nama      | Modul                                                   |
| --------- | ------------------------------------------------------- |
| Anggota 1 | Landing Page + Komponen UI                              |
| Anggota 2 | Web App Auth (email + Google) + CRUD Gig                |
| Anggota 3 | Proposal + Escrow/Payment + Dashboard                   |
| Anggota 4 | Backend API (Laravel) + Database (MySQL) + Escrow Logic |

---

## Demo Akun

| Role              | Email                  | Password   |
| ----------------- | ---------------------- | ---------- |
| Client (Juragan)  | `juragan@example.com`  | `password` |
| Freelancer (Sika) | `sika@example.com`     | `password` |
| Client 2          | `juragan2@example.com` | `password` |
| Freelancer 2      | `sika2@example.com`    | `password` |

---

## Fitur Utama

### Auth & Akun

- 🔐 **Login email/password** dengan Laravel Sanctum
- 🔑 **Login dengan Google** via OAuth 2.0 (Laravel Socialite)
- 👤 **Multi-role** — Client/Juragan dan Freelancer/Sika
- 📋 **Onboarding** berbeda per role setelah register

### Gig & Proposal

- 📌 **CRUD Gig** — client posting, edit, hapus pekerjaan
- 🔍 **Browse & Filter** gig publik tanpa perlu login
- 📨 **Proposal Flow** — freelancer lamar, client terima/tolak
- 🚫 **Unique Constraint** — satu freelancer satu kali per gig
- 🔄 **State Machine Gig** — `open → in_progress → completed / cancelled`

### Escrow & Pembayaran

- 🔒 **Sistem Escrow** — dana ditahan platform sampai gig selesai
- 💳 **Transfer Bank** — client deposit, escrow hold, dirilis setelah konfirmasi
- 📱 **E-Wallet (QRIS)** — GoPay, OVO, Dana, ShopeePay
- 💵 **Cash / Bayar di Tempat** — escrow sebagai bukti konfirmasi deal, bayar langsung
- 👛 **Wallet Freelancer** — saldo otomatis bertambah setelah gig settled (non-cash)
- 🔁 **Refund** — dana dikembalikan ke client jika gig dibatalkan

### Fitur Lanjutan (Post-MVP)

- 💬 Sistem pesan antar juragan dan sika
- ⭐ Rating & review setelah transaksi
- 🔔 Notifikasi real-time (Laravel Echo)
- 🔒 Dispute / komplain untuk kasus sengketa

---

## Alur Sistem

### Flow Escrow — Transfer / E-Wallet

```
Client buat Gig
  → Freelancer kirim Proposal
  → Client terima Proposal + pilih metode bayar (transfer/ewallet)
  → Escrow dibuat: awaiting_payment
  → Client deposit → Escrow: holding
  → Freelancer kerjakan Gig
  → Client konfirmasi selesai → Escrow: released
  → Dana otomatis masuk Wallet Freelancer → Escrow: settled
```

### Flow Escrow — Cash / Bayar di Tempat

```
Client buat Gig
  → Freelancer kirim Proposal
  → Client terima Proposal + pilih "Cash"
  → Escrow dibuat langsung: holding (tanpa deposit digital)
  → Freelancer kerjakan Gig
  → Client bayar langsung ke Freelancer
  → Client konfirmasi bayar cash → Escrow: released
  → Wallet Freelancer TIDAK bertambah (transaksi di luar platform)
```

### Flow Google OAuth

```
User klik "Login dengan Google"
  → Redirect ke halaman Google
  → Google kirim callback ke /api/auth/google/callback
  → Backend cek: google_id sudah ada? → login
                  belum ada? → buat akun baru → pilih role → onboarding
  → Frontend terima token dari URL → simpan → masuk dashboard
```

---

## Tech Stack

| Layer        | Teknologi                                             |
| ------------ | ----------------------------------------------------- |
| **Landing**  | React.js + JavaScript + Vite + Tailwind CSS 4         |
| **Web App**  | React.js + JavaScript + Vite + Tailwind CSS 4 + Axios |
| **State**    | React Context API                                     |
| **Backend**  | Laravel 13 + PHP 8.3                                  |
| **Database** | MySQL                                                 |
| **Auth**     | Laravel Sanctum + Laravel Socialite (Google OAuth)    |
| **Validasi** | Laravel Form Request                                  |
| **Monorepo** | pnpm 11 workspace                                     |

---

## Struktur Monorepo

```text
sikagig/
├── apps/
│   ├── landing/                   → Landing page publik
│   │   └── src/
│   │       ├── sections/          → Hero, HowItWorks, Categories, dll
│   │       └── components/
│   │
│   ├── web/                       → Web app
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/            → Button, Input, Card, Modal, Badge, StatusBadge
│   │       │   └── layout/        → Navbar, Footer, AppLayout
│   │       ├── contexts/          → AuthContext.jsx
│   │       ├── pages/
│   │       │   ├── auth/          → LoginPage, RegisterPage, GoogleCallback
│   │       │   ├── onboarding/    → ClientOnboarding, FreelancerOnboarding
│   │       │   ├── gigs/          → GigListPage, GigDetailPage, CreateGigPage, EditGigPage
│   │       │   ├── proposals/     → SendProposalPage, IncomingProposalsPage, MyProposalsPage
│   │       │   ├── payment/       → EscrowStatusPage, DepositPage, CashConfirmPage, ReleaseFundsPage
│   │       │   ├── profile/       → EditProfilePage, PublicProfilePage
│   │       │   └── dashboard/     → ClientDashboard, FreelancerDashboard
│   │       ├── routes/            → ProtectedRoute.jsx
│   │       └── services/          → api.js, auth.service.js, gig.service.js, escrow.service.js
│   │
│   ├── api/                       → REST API (Laravel)
│   │   ├── app/
│   │   │   ├── Http/Controllers/  → Auth, GoogleAuth, Gig, Proposal, Escrow, Wallet, Profile
│   │   │   ├── Http/Requests/     → Form Requests validasi
│   │   │   └── Models/            → User, Profile, Gig, Proposal, Escrow, Payment, Wallet, Category
│   │   ├── database/
│   │   │   ├── migrations/        → Schema tabel
│   │   │   └── seeders/           → CategorySeeder, UserSeeder
│   │   └── routes/
│   │       └── api.php
│   │
│   └── database/
│       └── sikagig.sql            → ⭐ Schema lengkap + seed data siap import
│
├── package.json                   → Root scripts
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

---

## Database (MySQL) — 9 Tabel

| #   | Tabel                    | Fungsi                                        |
| --- | ------------------------ | --------------------------------------------- |
| 1   | `users`                  | Akun pengguna (email/password + Google OAuth) |
| 2   | `profiles`               | Data profil setelah onboarding                |
| 3   | `categories`             | Master kategori gig (7 kategori)              |
| 4   | `gigs`                   | Postingan pekerjaan                           |
| 5   | `proposals`              | Lamaran freelancer ke gig                     |
| 6   | `escrows`                | Dana yang ditahan per deal                    |
| 7   | `payments`               | Log transaksi keuangan                        |
| 8   | `wallets`                | Saldo freelancer                              |
| 9   | `personal_access_tokens` | Token Sanctum                                 |

### Status Escrow

| Status             | Arti                                               |
| ------------------ | -------------------------------------------------- |
| `awaiting_payment` | Proposal diterima, client belum deposit (non-cash) |
| `holding`          | Dana di-hold / COD dikonfirmasi                    |
| `released`         | Client konfirmasi gig selesai                      |
| `settled`          | Dana masuk wallet freelancer                       |
| `refunded`         | Dana dikembalikan ke client                        |
| `disputed`         | Ada komplain (post-MVP)                            |

---

## API Endpoints

### Auth

```
POST  /api/register
POST  /api/login
POST  /api/logout                    (auth:sanctum)
GET   /api/user                      (auth:sanctum)
GET   /api/auth/google               → redirect ke Google
GET   /api/auth/google/callback      → return Sanctum token
```

### Gig & Proposal

```
GET    /api/gigs                           (publik)
GET    /api/gigs/{id}                      (publik)
POST   /api/gigs                           (client)
PUT    /api/gigs/{id}                      (pemilik)
DELETE /api/gigs/{id}                      (pemilik)
POST   /api/gigs/{gig}/proposals           (freelancer)
GET    /api/proposals
GET    /api/proposals/{id}
PATCH  /api/proposals/{id}/status          (client: accept+method / reject)
DELETE /api/proposals/{id}                 (freelancer: withdraw)
```

### Escrow & Wallet

```
GET   /api/escrows/{id}
POST  /api/escrows/{id}/deposit            (client: non-cash)
POST  /api/escrows/{id}/confirm-cash       (client: cash)
POST  /api/escrows/{id}/release            (client: konfirmasi selesai)
POST  /api/escrows/{id}/refund             (client)
GET   /api/wallet                          (freelancer)
```

### Profile & Category

```
GET   /api/profile
PUT   /api/profile
GET   /api/users/{id}/profile
GET   /api/categories
```

---

## CI Pipeline (GitHub Actions)

| Job                  | Deskripsi                     |
| -------------------- | ----------------------------- |
| **Lint & Typecheck** | ESLint semua workspace app    |
| **Build Landing**    | `pnpm --filter landing build` |
| **Build Web App**    | `pnpm --filter web build`     |

---

## Cara Instalasi Lokal

### Requirements

- Node.js 22+ & pnpm 11+
- PHP 8.3+ & Composer
- MySQL 8+

### Setup

```bash
# 1. Clone
git clone <repo-url> && cd sikagig

# 2. Install frontend dependencies
pnpm install

# 3. Buat database MySQL
mysql -u root -p -e "CREATE DATABASE sikagig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Import schema + seed data
mysql -u root -p sikagig < apps/database/sikagig.sql

# 5. Setup Laravel
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
# Edit .env: DB_DATABASE, DB_USERNAME, DB_PASSWORD
# Edit .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

# 6. Jalankan API
php artisan serve   # http://localhost:8000

# 7. Jalankan frontend (dari root)
cd ../..
cp apps/web/.env.example apps/web/.env
# Edit: VITE_API_BASE_URL=http://localhost:8000/api
pnpm dev:landing    # http://localhost:5173
pnpm dev:web        # http://localhost:5174
```

### Environment Variables Penting

**`apps/api/.env`**

```env
DB_CONNECTION=mysql
DB_DATABASE=sikagig
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

**`apps/web/.env`**

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_LANDING_URL=http://localhost:5173
```

---

## Branch Workflow

| Branch                | Tujuan                          |
| --------------------- | ------------------------------- |
| `main`                | Final / rilis                   |
| `develop`             | Integrasi semua fitur           |
| `feat-landing-page`   | Landing page                    |
| `feat-ui-components`  | Komponen UI                     |
| `feat-auth-flow`      | Auth frontend (email)           |
| `feat-google-oauth`   | Google OAuth frontend + backend |
| `feat-gig-crud`       | CRUD gig                        |
| `feat-proposal-flow`  | Proposal frontend               |
| `feat-escrow-payment` | Escrow & payment frontend       |
| `feat-dashboard`      | Dashboard                       |
| `feat-api-auth`       | Backend auth                    |
| `feat-api-gig`        | Backend gig                     |
| `feat-api-proposal`   | Backend proposal                |
| `feat-api-escrow`     | Backend escrow + wallet         |

---

## Status Pengerjaan

| Phase | Deskripsi                                    | Status         |
| ----- | -------------------------------------------- | -------------- |
| 1     | Setup monorepo                               | ✅ Selesai     |
| 2     | Landing page                                 | 🔄 In Progress |
| 3     | Database + Auth backend + Google OAuth       | 🔄 In Progress |
| 4     | Web app auth (email + Google)                | ⏳ Menunggu    |
| 5     | CRUD gig (backend + frontend)                | ⏳ Menunggu    |
| 6     | Proposal + terima/tolak + pilih metode bayar | ⏳ Menunggu    |
| 7     | Escrow + payment + wallet                    | ⏳ Menunggu    |
| 8     | Profil + dashboard                           | ⏳ Menunggu    |
| 9     | Testing & polish                             | ⏳ Menunggu    |
| 10    | Deployment                                   | ⏳ Menunggu    |

---

## Dokumentasi

| Folder                                          | Isi                                               |
| ----------------------------------------------- | ------------------------------------------------- |
| `docs/plan/foundation.md`                       | Spesifikasi lengkap: model, flow, role, glossary  |
| `docs/plan/plan.md`                             | Roadmap 10 phase + pembagian modul per anggota    |
| `docs/plan/team-workflow.md`                    | Git workflow, setup, konvensi, setup Google OAuth |
| `docs/plan/erd.md`                              | ERD detail semua 9 tabel + relasi Eloquent        |
| `docs/diagram/`                                 | Activity, use case, class diagram, ERD visual     |
| `docs/testing/auth-test-checklist.md`           | 36 test case auth + Google OAuth                  |
| `docs/testing/gig-proposal-test-checklist.md`   | 35 test case gig & proposal                       |
| `docs/testing/escrow-payment-test-checklist.md` | 35 test case escrow & pembayaran                  |

---

_Inspired by [sidegigx.id](https://sidegigx.id)_
