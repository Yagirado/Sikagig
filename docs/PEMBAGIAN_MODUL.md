# 📋 Pembagian Modul Tim Sikagig

> **Versi**: Final  
> **Stack**: React.js + Tailwind CSS (frontend) | Laravel + MySQL (backend)  
> **Monorepo**: pnpm workspace

---

## Ringkasan Pembagian

| Anggota | Fokus Utama | Domain |
|---------|-------------|--------|
| **Anggota 1** | Login / Auth + CRUD Profil + Fitur Chat | Backend + Frontend |
| **Anggota 2** | Fitur Pembayaran Escrow | Backend + Frontend |
| **Anggota 3** | CRUD Gig + Proposal | Backend + Frontend |
| **Anggota 4** | UI yang Kurang + Fitur Sisa | Frontend + Backend support |

---

## 👤 Anggota 1 — Auth, Profil & Chat

### Scope

- Sistem login (OTP via Email + Google OAuth)
- CRUD Profil (client & freelancer)
- Fitur Chat real-time antar pengguna
- UI halaman-halaman yang terkait modul ini

### Backend — Laravel API

| Endpoint | Keterangan |
|----------|------------|
| `POST /api/auth/request-otp` | Kirim OTP ke email |
| `POST /api/auth/verify-otp` | Verifikasi OTP → return token |
| `POST /api/auth/logout` | Revoke token |
| `GET /api/user` | Data user yang sedang login |
| `GET /api/profile` | Profil saya |
| `PUT /api/profile` | Update profil + auto-set `is_profile_complete` |
| `GET /api/users/{id}/profile` | Profil publik user lain |
| `GET /api/conversations` | Daftar percakapan user |
| `GET /api/conversations/{id}/messages` | Pesan dalam satu conversation |
| `POST /api/conversations/{id}/messages` | Kirim pesan |
| `POST /api/conversations` | Mulai percakapan baru |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── AuthController.php           ← OTP login + logout + me
│   ├── GoogleAuthController.php     ← Google OAuth callback
│   ├── ProfileController.php        ← CRUD profil
│   └── ChatController.php           ← conversations + messages
├── app/Models/
│   ├── User.php
│   ├── Profile.php
│   ├── OtpCode.php
│   ├── Conversation.php
│   └── Message.php
├── database/migrations/
│   ├── ..._create_users_table.php
│   ├── ..._create_otp_codes_table.php
│   ├── ..._create_profiles_table.php
│   ├── ..._create_conversations_table.php
│   └── ..._create_messages_table.php
├── database/seeders/
│   └── UserSeeder.php
└── routes/api.php                   ← auth + profile + chat routes
```

### Frontend — React Web App

| Halaman / Komponen | File |
|--------------------|------|
| Halaman input email | `pages/auth/EmailPage.jsx` |
| Halaman input OTP | `pages/auth/OtpPage.jsx` |
| Halaman pilih role (akun baru) | `pages/auth/RolePage.jsx` |
| Onboarding Client | `pages/onboarding/ClientOnboarding.jsx` |
| Onboarding Freelancer | `pages/onboarding/FreelancerOnboarding.jsx` |
| Edit profil | `pages/profile/EditProfilePage.jsx` |
| Profil publik | `pages/profile/PublicProfilePage.jsx` |
| Halaman chat (inbox) | `pages/chat/ChatInboxPage.jsx` |
| Detail percakapan | `pages/chat/ChatRoomPage.jsx` |
| Auth context | `contexts/AuthContext.jsx` |
| Protected route | `routes/ProtectedRoute.jsx` |
| Axios instance + interceptor | `services/api.js` |
| Service auth | `services/auth.service.js` |
| Service profil | `services/profile.service.js` |
| Service chat | `services/chat.service.js` |
| Hook useAuth | `hooks/useAuth.js` |

### UI yang Dibuat Anggota 1

- Halaman auth (email input, OTP input, role selector) — desain minimalis, clean
- Halaman onboarding — form step-by-step
- Halaman profil — edit + publik
- Halaman chat — inbox + bubble chat

---

## 💳 Anggota 2 — Pembayaran Escrow

### Scope

- Sistem escrow (deposit, hold, release, refund)
- Integrasi metode bayar: transfer bank, e-wallet, cash
- Wallet freelancer (saldo + riwayat)
- Admin: suspend/unsuspend freelancer
- UI semua halaman pembayaran

### Backend — Laravel API

| Endpoint | Keterangan |
|----------|------------|
| `GET /api/escrows/{id}` | Detail escrow |
| `POST /api/escrows/{id}/deposit` | Client deposit (transfer/ewallet) |
| `POST /api/escrows/{id}/confirm-cash` | Client konfirmasi bayar cash |
| `POST /api/escrows/{id}/release` | Client release dana setelah gig selesai |
| `POST /api/escrows/{id}/refund` | Refund jika gig dibatalkan |
| `GET /api/wallet` | Cek saldo wallet freelancer |
| `GET /api/wallet/history` | Riwayat transaksi wallet |
| `GET /api/admin/freelancers` | Daftar freelancer (super_admin) |
| `POST /api/admin/users/{id}/suspend` | Suspend freelancer |
| `POST /api/admin/users/{id}/unsuspend` | Unsuspend freelancer |
| `GET /api/admin/suspend-logs` | Riwayat suspend |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── EscrowController.php         ← deposit, release, refund, confirm-cash
│   ├── WalletController.php         ← saldo + riwayat
│   └── AdminController.php          ← suspend/unsuspend + logs
├── app/Models/
│   ├── Escrow.php
│   ├── Payment.php
│   ├── Wallet.php
│   └── SuspendLog.php
├── database/migrations/
│   ├── ..._create_escrows_table.php
│   ├── ..._create_payments_table.php
│   ├── ..._create_wallets_table.php
│   └── ..._create_suspend_logs_table.php
└── routes/api.php                   ← escrow + wallet + admin routes
```

**Business Logic Escrow:**

```
Metode Cash:
  confirm-cash → escrow.status = "held_cash"
  release      → escrow.status = "released" (TIDAK tambah saldo wallet)

Metode Non-Cash (transfer/ewallet):
  deposit → escrow.status = "held" (simpan bukti transfer)
  release → escrow.status = "released" → tambah saldo wallet freelancer

Refund:
  refund  → escrow.status = "refunded" → kembalikan ke client (jika bukan cash)
```

### Frontend — React Web App

| Halaman / Komponen | File |
|--------------------|------|
| Status escrow | `pages/payment/EscrowStatusPage.jsx` |
| Form deposit (transfer/ewallet) | `pages/payment/DepositPage.jsx` |
| Konfirmasi bayar cash | `pages/payment/CashConfirmPage.jsx` |
| Tombol release dana | `pages/payment/ReleaseFundsPage.jsx` |
| Halaman wallet freelancer | `pages/wallet/WalletPage.jsx` |
| Riwayat transaksi | `pages/wallet/WalletHistoryPage.jsx` |
| Panel admin — daftar freelancer | `pages/admin/FreelancerListPage.jsx` |
| Modal suspend | `pages/admin/SuspendModal.jsx` |
| Service escrow | `services/escrow.service.js` |
| Service wallet | `services/wallet.service.js` |
| Hook useEscrow | `hooks/useEscrow.js` |

### UI yang Dibuat Anggota 2

- Halaman escrow status — step indicator (Pending → Held → Released)
- Form deposit — upload bukti bayar
- Halaman wallet — balance card + riwayat
- Panel admin — tabel freelancer + badge status

---

## 🛠️ Anggota 3 — CRUD Gig & Proposal

### Scope

- CRUD Gig (buat, edit, hapus, list, detail)
- Proposal (kirim, terima, tolak, withdraw)
- Guard profil lengkap sebelum aksi
- Dashboard client & freelancer
- UI semua halaman gig dan proposal

### Backend — Laravel API

| Endpoint | Keterangan |
|----------|------------|
| `GET /api/gigs` | List gig publik + filter kategori |
| `GET /api/gigs/{id}` | Detail gig |
| `POST /api/gigs` | Buat gig (client, `is_profile_complete = 1`) |
| `PUT /api/gigs/{id}` | Edit gig (pemilik only) |
| `DELETE /api/gigs/{id}` | Hapus gig (pemilik only) |
| `POST /api/gigs/{gig}/proposals` | Kirim proposal (freelancer) |
| `GET /api/proposals` | Daftar proposal saya |
| `GET /api/proposals/{id}` | Detail proposal |
| `PATCH /api/proposals/{id}/status` | Terima/tolak + pilih metode bayar |
| `DELETE /api/proposals/{id}` | Withdraw proposal |
| `GET /api/categories` | Daftar kategori |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── GigController.php            ← CRUD gig
│   ├── ProposalController.php       ← kirim + terima/tolak
│   └── CategoryController.php      ← list kategori
├── app/Models/
│   ├── Gig.php
│   ├── Proposal.php
│   └── Category.php
├── app/Http/Middleware/
│   └── ProfileComplete.php          ← guard is_profile_complete
├── database/migrations/
│   ├── ..._create_categories_table.php
│   ├── ..._create_gigs_table.php
│   └── ..._create_proposals_table.php
├── database/seeders/
│   └── CategorySeeder.php
└── routes/api.php                   ← gig + proposal + category routes
```

**Note Penting:**
- Saat proposal **diterima** → otomatis buat record di tabel `escrows`
- Guard `ProfileComplete` middleware wajib dipasang di route `POST /api/gigs` dan `POST /api/gigs/{gig}/proposals`

### Frontend — React Web App

| Halaman / Komponen | File |
|--------------------|------|
| List gig + filter | `pages/gigs/GigListPage.jsx` |
| Detail gig | `pages/gigs/GigDetailPage.jsx` |
| Form buat gig | `pages/gigs/CreateGigPage.jsx` |
| Form edit gig | `pages/gigs/EditGigPage.jsx` |
| Kirim proposal | `pages/proposals/SendProposalPage.jsx` |
| Proposal masuk (client) | `pages/proposals/IncomingProposalsPage.jsx` |
| Proposal saya (freelancer) | `pages/proposals/MyProposalsPage.jsx` |
| Detail proposal | `pages/proposals/ProposalDetailPage.jsx` |
| Modal terima + pilih metode bayar | `pages/proposals/AcceptProposalModal.jsx` |
| Dashboard client | `pages/dashboard/ClientDashboard.jsx` |
| Dashboard freelancer | `pages/dashboard/FreelancerDashboard.jsx` |
| Modal "Lengkapi Profil Dulu" | `components/shared/ProfileIncompleteModal.jsx` |
| Service gig | `services/gig.service.js` |
| Service proposal | `services/proposal.service.js` |
| Hook useGigs | `hooks/useGigs.js` |
| Hook useProposals | `hooks/useProposals.js` |

### UI yang Dibuat Anggota 3

- GigListPage — card grid dengan filter kategori
- GigDetailPage — detail + tombol "Ambil Gig"
- Form buat/edit gig — multi-field dengan validasi
- Dashboard — ringkasan statistik (gig aktif, proposal masuk)

---

## 🎨 Anggota 4 — UI Kurang & Fitur Sisa

### Scope

- Komponen UI dasar (dipakai semua anggota)
- Landing page
- Navbar, layout, footer
- Bagian UI yang belum di-handle anggota lain
- Setup awal project: ESLint, Prettier, env files
- Memastikan responsivitas semua halaman

### Komponen UI Dasar (dipakai semua)

```
apps/web/src/components/ui/
├── Button.jsx          ← primary, secondary, ghost, danger
├── Input.jsx           ← text, email, password + error state
├── Textarea.jsx
├── Select.jsx
├── Card.jsx
├── Modal.jsx           ← base modal dengan overlay
├── Badge.jsx           ← warna sesuai status
├── StatusBadge.jsx     ← OPEN, IN_PROGRESS, COMPLETED, dll
├── Avatar.jsx
├── Spinner.jsx         ← loading indicator
├── EmptyState.jsx      ← tampilan saat data kosong
└── ErrorState.jsx      ← tampilan saat error

apps/web/src/components/layout/
├── Navbar.jsx          ← dengan navigasi dan avatar user
├── AppLayout.jsx       ← wrapper halaman dengan navbar + footer
├── Sidebar.jsx         ← sidebar dashboard (opsional)
└── Footer.jsx
```

### Landing Page

```
apps/landing/src/sections/
├── Hero.jsx            ← tagline + CTA utama
├── HowItWorks.jsx      ← 3-4 step cara kerja
├── Categories.jsx      ← grid kategori gig
├── Testimonials.jsx    ← social proof
└── CtaSection.jsx      ← penutup + tombol daftar
```

### UI Sisa / Pelengkap

| Halaman / Komponen | File |
|--------------------|------|
| Halaman 404 | `pages/NotFoundPage.jsx` |
| Halaman beranda setelah login | `pages/HomePage.jsx` |
| Halaman search gig | `pages/gigs/SearchResultPage.jsx` |
| Notifikasi global (toast) | `components/ui/Toast.jsx` |
| Error boundary | `components/ErrorBoundary.jsx` |
| Loading skeleton | `components/ui/Skeleton.jsx` |

### Setup & Infrastruktur

```
apps/web/
├── .eslintrc.js
├── .prettierrc
├── .env.example

apps/landing/
├── .eslintrc.js
├── .prettierrc
├── .env.example

apps/api/
├── .env.example
```

### UI yang Dibuat Anggota 4

- Semua komponen UI primitif (Button, Input, Card, Modal, dll)
- Landing page lengkap + responsive
- Navbar + layout shell app
- Empty state, error state, loading skeleton di semua halaman
- Responsivitas 375px, 768px, 1280px

---

## 🔗 Dependency Flow

```
Anggota 4 (UI Komponen)
  → Mulai dari hari 1 — paralel
  → Komponen tersedia sebelum anggota lain butuh
       ↓
Anggota 1 (Auth + Profil + Chat)
  → Backend auth hari 6-9
  → Frontend auth + chat hari 10-16
       ↓
Anggota 3 (Gig + Proposal)
  → Backend gig hari 10-14
  → Backend proposal hari 15-19
  → Frontend gig + proposal hari 13-20
       ↓
Anggota 2 (Escrow + Pembayaran)
  → Backend escrow hari 20-23 (butuh proposal diterima dari Anggota 3)
  → Frontend payment hari 21-25
       ↓
Anggota 4 (Polish)
  → Review semua halaman hari 26-29
  → Fix responsif, empty/error state
```

---

## 📁 Ownership File — Quick Reference

| File | Owner |
|------|-------|
| `apps/api/Controllers/AuthController.php` | Anggota 1 |
| `apps/api/Controllers/ProfileController.php` | Anggota 1 |
| `apps/api/Controllers/ChatController.php` | Anggota 1 |
| `apps/api/Controllers/GigController.php` | Anggota 3 |
| `apps/api/Controllers/ProposalController.php` | Anggota 3 |
| `apps/api/Controllers/EscrowController.php` | Anggota 2 |
| `apps/api/Controllers/WalletController.php` | Anggota 2 |
| `apps/api/Controllers/AdminController.php` | Anggota 2 |
| `apps/web/src/pages/auth/` | Anggota 1 |
| `apps/web/src/pages/chat/` | Anggota 1 |
| `apps/web/src/pages/profile/` | Anggota 1 |
| `apps/web/src/pages/gigs/` | Anggota 3 |
| `apps/web/src/pages/proposals/` | Anggota 3 |
| `apps/web/src/pages/dashboard/` | Anggota 3 |
| `apps/web/src/pages/payment/` | Anggota 2 |
| `apps/web/src/pages/wallet/` | Anggota 2 |
| `apps/web/src/pages/admin/` | Anggota 2 |
| `apps/web/src/components/ui/` | Anggota 4 |
| `apps/web/src/components/layout/` | Anggota 4 |
| `apps/landing/src/` | Anggota 4 |

---

## ⚠️ Aturan Kerja Tim

1. **Branch**: buat dari `develop`, format `feat/[nama-fitur]`  
   Contoh: `feat/auth-otp`, `feat/escrow-deposit`, `feat/gig-crud`

2. **Jangan edit file milik anggota lain** tanpa koordinasi

3. **Komponen UI** dari Anggota 4 harus selesai lebih dahulu — impor dari `components/ui/`, jangan buat ulang

4. **Mock data dulu** jika endpoint belum siap — jangan tunggu lama

5. **Commit message** deskriptif:  
   `feat: add escrow release endpoint`  
   `fix: otp countdown timer bug`  
   `ui: add empty state to gig list`

6. **Jangan commit** `.env`, `node_modules/`, `vendor/`

7. Setiap halaman wajib punya: **loading state**, **error state**, **empty state**

8. Test responsif minimal di: **375px** (mobile), **768px** (tablet), **1280px** (desktop)
