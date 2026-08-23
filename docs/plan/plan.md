# 📅 Plan: Platform Gig Lokal (SIKAGIG)

> Roadmap pengerjaan project Sikagig
> **Stack**: React.js + JavaScript + Tailwind CSS (frontend) | Laravel + MySQL (backend)
> **Fitur tambahan**: Google OAuth, Escrow Payment, Cash / Bayar di Tempat
> **Referensi spec**: lihat `foundation.md`

---

## A. Roadmap Pengerjaan

> Timeline asumsi ~5 minggu. Sesuaikan dengan deadline aktual.

### Phase 1 — Setup Monorepo (Hari 1-2)

- [x] Init monorepo dengan pnpm workspace
- [x] Setup `apps/landing`, `apps/web`, `apps/api`
- [x] Konfigurasi `pnpm-workspace.yaml`
- [x] Setup Tailwind CSS di landing dan web
- [x] Verifikasi `pnpm dev:landing`, `pnpm dev:web`, `pnpm dev:api` berjalan
- [ ] Setup ESLint + Prettier
- [ ] Buat `.env.example` di semua app

### Phase 2 — Landing Page (Hari 3-5)

- [ ] Section hero (tagline + CTA utama)
- [ ] Section cara kerja (step-by-step)
- [ ] Section kategori gig
- [ ] Section testimonial / social proof
- [ ] Section CTA akhir
- [ ] Responsive mobile
- [ ] Tombol "Buka App" mengarah ke web app

### Phase 3 — Database & Auth Backend (Hari 6-9)

- [x] Instalasi Laravel + konfigurasi awal
- [ ] Import `sikagig.sql` ke MySQL → verifikasi semua tabel terbuat
- [ ] Setup Laravel Sanctum
- [ ] Setup mail driver (Mailgun / SMTP / Mailtrap untuk dev)
- [ ] Migration: `users`, `otp_codes`, `profiles`, `suspend_logs`, `categories`, `wallets`, `gigs`, `proposals`, `escrows`, `payments`
- [ ] Seed: `CategorySeeder`, `UserSeeder`
- [ ] Endpoint `POST /api/auth/request-otp` — kirim OTP ke email
- [ ] Endpoint `POST /api/auth/verify-otp` — verifikasi OTP → return token
- [ ] Endpoint `POST /api/auth/logout` — revoke token
- [ ] Endpoint `GET /api/user` — data user yang sedang login
- [ ] Middleware `auth:sanctum` + role check
- [ ] Middleware suspend check (cek `is_suspended` setelah OTP valid)
- [ ] Test auth flow via Postman: request OTP → verify → login

### Phase 4 — Web App Auth OTP (Hari 10-12)

- [ ] Setup Axios instance (`services/api.js`) + interceptor token
- [ ] Halaman masuk email (`/auth/email`) — satu input email
- [ ] Halaman masukkan OTP (`/auth/otp`) — 6 kotak digit + countdown timer
- [ ] Halaman pilih role (`/auth/role`) — muncul hanya saat akun baru
- [ ] Protected route (`ProtectedRoute.jsx`)
- [ ] Simpan token di `localStorage` + `AuthContext`
- [ ] Logout (revoke token + clear state)
- [ ] Tombol "Kirim ulang OTP" setelah 60 detik

### Phase 5 — CRUD Gig + Guard Profil (Hari 13-16)

- [ ] Backend: Guard middleware `ProfileComplete` — cek `is_profile_complete` sebelum buat gig / kirim proposal
- [ ] Backend: `GET /api/gigs` — list publik + filter kategori (tanpa guard)
- [ ] Backend: `GET /api/gigs/{id}` — detail gig (tanpa guard)
- [ ] Backend: `POST /api/gigs` — buat gig (client, wajib `is_profile_complete = 1`)
- [ ] Backend: `PUT /api/gigs/{id}` — edit gig (pemilik only)
- [ ] Backend: `DELETE /api/gigs/{id}` — hapus gig (pemilik only)
- [ ] Frontend: Halaman list gig + filter (akses bebas setelah login)
- [ ] Frontend: Halaman detail gig
- [ ] Frontend: Klik "Buat Gig" → cek profil → popup jika belum lengkap
- [ ] Frontend: Form buat gig (hanya tampil setelah profil lengkap)
- [ ] Frontend: Form edit gig
- [ ] **Frontend: Komponen `ProfileIncompleteModal.jsx`** — popup "Lengkapi Profil Dulu!"

### Phase 6 — Proposal + Profil (Hari 17-19)

- [ ] Backend: `POST /api/gigs/{gig}/proposals` (freelancer, wajib `is_profile_complete = 1`)
- [ ] Backend: `GET /api/proposals`
- [ ] Backend: `GET /api/proposals/{id}`
- [ ] Backend: `PATCH /api/proposals/{id}/status` — terima/tolak + pilih metode bayar
- [ ] Backend: `DELETE /api/proposals/{id}` — withdraw
- [ ] **Backend: Saat proposal diterima → otomatis buat `escrows` record**
- [ ] Backend: `GET /api/profile` — profil saya
- [ ] Backend: `PUT /api/profile` — update profil + auto-set `is_profile_complete`
- [ ] Backend: `GET /api/users/{id}/profile` — profil publik
- [ ] Frontend: Klik "Ambil Gig" → cek profil → popup jika belum lengkap
- [ ] Frontend: Form kirim proposal
- [ ] Frontend: List proposal masuk (client view)
- [ ] Frontend: List proposal saya (freelancer view)
- [ ] Frontend: Pilih metode bayar saat terima proposal
- [ ] Frontend: Halaman edit profil (form beda per role, foto opsional)
- [ ] Frontend: Halaman profil publik freelancer

### Phase 7 — Escrow & Pembayaran (Hari 20-23)

- [ ] Backend: `GET /api/escrows/{id}` — detail escrow
- [ ] Backend: `POST /api/escrows/{id}/deposit` — client deposit (non-cash)
- [ ] Backend: `POST /api/escrows/{id}/confirm-cash` — client konfirmasi bayar cash
- [ ] Backend: `POST /api/escrows/{id}/release` — client release dana setelah gig selesai
- [ ] Backend: `POST /api/escrows/{id}/refund` — refund jika gig dibatalkan
- [ ] Backend: `GET /api/wallet` — cek saldo wallet freelancer
- [ ] **Backend: Logic settlement** — setelah release, tambah saldo wallet freelancer (non-cash skip)
- [ ] Frontend: Halaman status escrow / pembayaran
- [ ] Frontend: Form konfirmasi pembayaran (client)
- [ ] Frontend: Tampilkan saldo wallet (freelancer dashboard)
- [ ] Frontend: Tombol "Release Dana" setelah gig selesai

### Phase 7b — Super Admin Panel (Hari 24-25)

- [ ] Backend: `GET /api/admin/freelancers` — list semua akun freelancer + status
- [ ] Backend: `POST /api/admin/users/{id}/suspend` — suspend freelancer + catat alasan
- [ ] Backend: `POST /api/admin/users/{id}/unsuspend` — unsuspend freelancer
- [ ] Backend: `GET /api/admin/suspend-logs` — riwayat suspend
- [ ] Frontend: Halaman admin panel (list freelancer + tombol suspend/unsuspend)
- [ ] Frontend: Modal konfirmasi suspend + input alasan

- [ ] Backend: `GET /api/profile`, `PUT /api/profile`
- [ ] Backend: `GET /api/users/{id}/profile`
- [ ] Frontend: Halaman edit profil (form beda per role)
- [ ] Frontend: Halaman profil publik freelancer
- [ ] Frontend: Dashboard client (gig aktif, proposal masuk, status escrow)
- [ ] Frontend: Dashboard freelancer (proposal saya, saldo wallet, gig dikerjakan)

### Phase 9 — Testing & Polish (Hari 27-29)

- [ ] Test flow end-to-end per role + escrow
- [ ] Test Google OAuth di browser
- [ ] Test edge cases (double apply, escrow ganda, refund setelah released)
- [ ] Test responsive 375px, 768px, 1280px
- [ ] Fix bug, cleanup `console.log`
- [ ] Loading state, error state, empty state semua halaman
- [ ] Final styling polish

### Phase 10 — Deployment (Hari 30-33)

- [ ] Deploy database MySQL (PlanetScale / Railway / hosting)
- [ ] Deploy API Laravel
- [ ] Deploy Web App & Landing (Vercel / Netlify)
- [ ] Setup Google OAuth redirect URI di Google Console (production URL)
- [ ] Test semua flow di production
- [ ] Tulis URL production di README.md

---

## B. Pembagian Modul

### Anggota 1 — Landing Page & Komponen UI

**Deliverable utama:**

- `apps/landing/src/` — semua section landing
- `apps/web/src/components/ui/` — Button, Input, Card, Modal, Badge, StatusBadge
- `apps/web/src/components/layout/` — Navbar, Footer, AppLayout

| Checklist            | File                                           |
| -------------------- | ---------------------------------------------- |
| Section hero + CTA   | `apps/landing/src/sections/Hero.jsx`           |
| Section cara kerja   | `apps/landing/src/sections/HowItWorks.jsx`     |
| Section kategori     | `apps/landing/src/sections/Categories.jsx`     |
| Section testimonial  | `apps/landing/src/sections/Testimonials.jsx`   |
| Section CTA penutup  | `apps/landing/src/sections/CtaSection.jsx`     |
| Komponen Button      | `apps/web/src/components/ui/Button.jsx`        |
| Komponen Input       | `apps/web/src/components/ui/Input.jsx`         |
| Komponen Card        | `apps/web/src/components/ui/Card.jsx`          |
| Komponen Badge       | `apps/web/src/components/ui/Badge.jsx`         |
| Komponen Modal       | `apps/web/src/components/ui/Modal.jsx`         |
| Komponen StatusBadge | `apps/web/src/components/ui/StatusBadge.jsx`   |
| Navbar app           | `apps/web/src/components/layout/Navbar.jsx`    |
| Layout app           | `apps/web/src/components/layout/AppLayout.jsx` |
| Responsivitas        | Semua file di atas                             |

---

### Anggota 2 — Web App Auth (email + Google) + CRUD Gig

**Deliverable utama:**

- `apps/web/src/pages/auth/` — Login, Register, Onboarding
- `apps/web/src/pages/gigs/` — List, Detail, Create, Edit
- `apps/web/src/routes/` — routing + protected route
- `apps/web/src/services/` + `hooks/`

| Checklist                             | File                                        |
| ------------------------------------- | ------------------------------------------- |
| Halaman login (email + Google button) | `pages/auth/LoginPage.jsx`                  |
| Halaman register + pilih role         | `pages/auth/RegisterPage.jsx`               |
| Callback handler Google OAuth         | `pages/auth/GoogleCallback.jsx`             |
| Onboarding client                     | `pages/onboarding/ClientOnboarding.jsx`     |
| Onboarding freelancer                 | `pages/onboarding/FreelancerOnboarding.jsx` |
| Protected route                       | `routes/ProtectedRoute.jsx`                 |
| Auth context                          | `contexts/AuthContext.jsx`                  |
| Axios instance + interceptor          | `services/api.js`                           |
| Service auth                          | `services/auth.service.js`                  |
| Hook useAuth                          | `hooks/useAuth.js`                          |
| Halaman list gig + filter             | `pages/gigs/GigListPage.jsx`                |
| Halaman detail gig                    | `pages/gigs/GigDetailPage.jsx`              |
| Form buat gig                         | `pages/gigs/CreateGigPage.jsx`              |
| Form edit gig                         | `pages/gigs/EditGigPage.jsx`                |
| Service gig                           | `services/gig.service.js`                   |
| Hook useGigs                          | `hooks/useGigs.js`                          |

---

### Anggota 3 — Proposal + Profil + Dashboard + Pembayaran Frontend

**Deliverable utama:**

- `apps/web/src/pages/proposals/`
- `apps/web/src/pages/payment/` — status escrow, konfirmasi bayar
- `apps/web/src/pages/profile/`
- `apps/web/src/pages/dashboard/`

| Checklist                                  | File                                        |
| ------------------------------------------ | ------------------------------------------- |
| Form kirim proposal                        | `pages/proposals/SendProposalPage.jsx`      |
| List proposal masuk (client)               | `pages/proposals/IncomingProposalsPage.jsx` |
| List proposal saya (freelancer)            | `pages/proposals/MyProposalsPage.jsx`       |
| Detail proposal                            | `pages/proposals/ProposalDetailPage.jsx`    |
| Pilih metode bayar saat terima proposal    | `pages/proposals/AcceptProposalModal.jsx`   |
| Halaman status escrow / pembayaran         | `pages/payment/EscrowStatusPage.jsx`        |
| Form konfirmasi deposit (transfer/ewallet) | `pages/payment/DepositPage.jsx`             |
| Form konfirmasi cash                       | `pages/payment/CashConfirmPage.jsx`         |
| Tombol release dana                        | `pages/payment/ReleaseFundsPage.jsx`        |
| Edit profil                                | `pages/profile/EditProfilePage.jsx`         |
| Profil publik                              | `pages/profile/PublicProfilePage.jsx`       |
| Dashboard client                           | `pages/dashboard/ClientDashboard.jsx`       |
| Dashboard freelancer (+ saldo wallet)      | `pages/dashboard/FreelancerDashboard.jsx`   |
| Service proposal                           | `services/proposal.service.js`              |
| Service escrow/payment                     | `services/escrow.service.js`                |
| Service wallet                             | `services/wallet.service.js`                |

---

### Anggota 4 — Backend API (Laravel) + Database (MySQL) + Escrow Logic

**Deliverable utama:**

- `apps/api/database/migrations/`
- `apps/api/database/seeders/`
- `apps/api/app/Http/Controllers/`
- `apps/api/app/Models/`
- `apps/api/routes/api.php`

| Checklist                     | File                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| Migration users (+ google_id) | `migrations/..._create_users_table.php`                                  |
| Migration profiles            | `migrations/..._create_profiles_table.php`                               |
| Migration categories          | `migrations/..._create_categories_table.php`                             |
| Migration gigs                | `migrations/..._create_gigs_table.php`                                   |
| Migration proposals           | `migrations/..._create_proposals_table.php`                              |
| Migration escrows             | `migrations/..._create_escrows_table.php`                                |
| Migration payments            | `migrations/..._create_payments_table.php`                               |
| Migration wallets             | `migrations/..._create_wallets_table.php`                                |
| Seeder kategori               | `seeders/CategorySeeder.php`                                             |
| Seeder user dummy             | `seeders/UserSeeder.php`                                                 |
| Auth controller (email)       | `Controllers/AuthController.php`                                         |
| Google OAuth controller       | `Controllers/GoogleAuthController.php`                                   |
| Gig controller                | `Controllers/GigController.php`                                          |
| Proposal controller           | `Controllers/ProposalController.php`                                     |
| Escrow controller             | `Controllers/EscrowController.php`                                       |
| Wallet controller             | `Controllers/WalletController.php`                                       |
| Profile controller            | `Controllers/ProfileController.php`                                      |
| Category controller           | `Controllers/CategoryController.php`                                     |
| Semua models                  | `Models/User, Profile, Gig, Proposal, Escrow, Payment, Wallet, Category` |
| Form Requests                 | `Requests/`                                                              |
| Routes                        | `routes/api.php`                                                         |
| Setup Sanctum + Socialite     | `config/services.php`, `config/sanctum.php`                              |
| Setup CORS                    | `config/cors.php`                                                        |

---

## C. Dependency Flow

```
Anggota 4 (Backend + DB)
  ↓ endpoint auth ready (hari ke-9)
  │
  ├── Anggota 2 (Auth + Gig) → mulai hari 10
  │
  ↓ endpoint gig + proposal ready (hari ke-19)
  │
  ├── Anggota 3 (Proposal + Escrow frontend) → mulai hari 17
  │
  ↓ escrow endpoint ready (hari ke-23)
  │
  ├── Anggota 3 (lanjut escrow/payment frontend)
  │
  ↓ semua endpoint ready (hari ke-26)
  └── Polish & testing → hari 27-29
```

```
Anggota 1 (Landing + UI)
  → Paralel dari hari 3
  → Komponen UI tersedia sebelum hari 10
```

---

## D. Tech Stack

| Layer                | Teknologi                                           |
| -------------------- | --------------------------------------------------- |
| **Landing**          | React.js + JavaScript + Vite + Tailwind CSS         |
| **Web App**          | React.js + JavaScript + Vite + Tailwind CSS + Axios |
| **State Management** | React Context API                                   |
| **Backend**          | Laravel 13 + PHP 8.3                                |
| **Database**         | MySQL                                               |
| **Auth**             | Laravel Sanctum + OTP via Email (Mailgun/SMTP)      |
| **Validasi Backend** | Laravel Form Request                                |
| **Monorepo**         | pnpm workspace                                      |

---

## E. API Endpoints Ringkasan

### Auth

```
POST  /api/auth/request-otp      → kirim OTP ke email (login atau register)
POST  /api/auth/verify-otp       → verifikasi OTP → return Sanctum token
POST  /api/auth/logout            (auth:sanctum) → revoke token
GET   /api/user                   (auth:sanctum) → data user yang login
```

### Gig (browse bebas, aksi butuh profil lengkap)

```
GET    /api/gigs                           (publik, tanpa auth pun bisa)
GET    /api/gigs/{id}                      (publik)
POST   /api/gigs                           (client, is_profile_complete = 1)
PUT    /api/gigs/{id}                      (pemilik only)
DELETE /api/gigs/{id}                      (pemilik only)
```

### Proposal (butuh profil lengkap + tidak suspended)

```
POST   /api/gigs/{gig}/proposals           (freelancer, is_profile_complete = 1)
GET    /api/proposals
GET    /api/proposals/{id}
PATCH  /api/proposals/{id}/status          (client: accept+method / reject)
DELETE /api/proposals/{id}                 (freelancer: withdraw)
```

### Admin

```
GET    /api/admin/freelancers              (super_admin)
POST   /api/admin/users/{id}/suspend       (super_admin)
POST   /api/admin/users/{id}/unsuspend     (super_admin)
GET    /api/admin/suspend-logs             (super_admin)
```

### Escrow & Pembayaran

```
GET    /api/escrows/{id}
POST   /api/escrows/{id}/deposit      (client: upload bukti / konfirmasi transfer)
POST   /api/escrows/{id}/confirm-cash (client: konfirmasi bayar di tempat)
POST   /api/escrows/{id}/release      (client: konfirmasi gig selesai)
POST   /api/escrows/{id}/refund       (client/admin: refund)
```

### Wallet & Profile

```
GET    /api/wallet                    (freelancer)
GET    /api/profile
PUT    /api/profile
GET    /api/users/{id}/profile
GET    /api/categories
```

---

## F. Development Ports

```
Landing → http://localhost:5173
Web     → http://localhost:5174
API     → http://localhost:8000  (php artisan serve)
```

---

## G. Risk & Mitigation

| Risk                            | Mitigation                                                                  |
| ------------------------------- | --------------------------------------------------------------------------- |
| Google OAuth redirect error     | Konfigurasi `GOOGLE_REDIRECT_URI` dengan benar di `.env` dan Google Console |
| CORS error frontend ↔ API       | Setup `config/cors.php`, allow `localhost:5174`, test dari awal             |
| Token tidak ter-attach          | Axios interceptor auto-attach `Authorization: Bearer`                       |
| Escrow ganda per proposal       | `UNIQUE(proposal_id)` di tabel `escrows`                                    |
| Settlement cash dobel ke wallet | Check `payment_method === 'cash'` sebelum update wallet                     |
| Migration konflik               | Jangan edit migration yang sudah dijalankan, buat migration baru            |
| Endpoint belum siap             | Gunakan mock data di frontend dulu                                          |

---

## H. Aturan Tim

1. Branch dari `develop`, format: `feat-[nama-fitur]`
2. Jangan commit `.env` — pakai `.env.example`
3. JavaScript konsisten, tidak boleh tiba-tiba pakai TypeScript
4. Pisahkan controller (HTTP) ≠ model/logic bisnis ≠ route
5. State global via Context API, bukan props drilling > 2 level
6. Buat loading, error, empty state di setiap halaman
7. Tidak commit `node_modules/` dan `vendor/`
8. Commit message deskriptif: `feat: add escrow release endpoint`

---

**Next Step**: Jalankan `sikagig.sql` ke MySQL → setup `.env` di `apps/api` → `php artisan migrate --seed` → test auth + Google OAuth.
