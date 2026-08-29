# 📅 Plan: Platform Gig Lokal (SIKAGIG)

> Roadmap pengerjaan project Sikagig
> **Stack**: React.js + JavaScript + Tailwind CSS (frontend) | Laravel + MySQL (backend)
> **Auth**: Email + OTP saja — tidak ada password, tidak ada Google OAuth
> **Role**: `user` (bisa posting & mengerjakan gig) | `super_admin`
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

> **Owner: Nugi** (auth) — dibantu semua untuk migration

- [x] Instalasi Laravel + konfigurasi awal
- [ ] Import `sikagig.sql` ke MySQL → verifikasi semua tabel terbuat
- [ ] Setup Laravel Sanctum
- [ ] Setup mail driver (Mailtrap untuk dev)
- [ ] Migration: `users`, `otp_codes`, `profiles`, `suspend_logs`, `categories`, `wallets`, `gigs`, `proposals`, `escrows`, `payments`, `notifications`, `conversations`, `messages`
- [ ] Seed: `CategorySeeder`, `UserSeeder`
- [ ] Endpoint `POST /api/auth/request-otp` — kirim OTP ke email
- [ ] Endpoint `POST /api/auth/verify-otp` — verifikasi OTP → return Sanctum token
- [ ] Endpoint `POST /api/auth/logout` — revoke token
- [ ] Endpoint `GET /api/auth/me` — data user yang sedang login
- [ ] Middleware `auth:sanctum`
- [ ] Middleware suspend check (cek `is_suspended` setelah OTP valid)
- [ ] Test auth flow via Postman: request OTP → verify → login

### Phase 4 — Web App Auth OTP (Hari 10-12)

> **Owner: Nugi**

- [ ] Setup Axios instance (`services/api.js`) + interceptor token
- [ ] Halaman input email (`/auth/email`) — satu input email
- [ ] Halaman input OTP (`/auth/otp`) — 6 kotak digit + countdown timer
- [ ] Protected route (`ProtectedRoute.jsx`)
- [ ] Simpan token di `localStorage` + `AuthContext`
- [ ] Logout (revoke token + clear state)
- [ ] Tombol "Kirim ulang OTP" setelah 60 detik

### Phase 5 — Komponen UI Dasar (Hari 3-10, paralel)

> **Owner: Yasmin** — dikerjakan paralel dari sprint 1

- [ ] `Button.jsx` — primary, secondary, ghost, danger + loading state
- [ ] `Input.jsx` — text, email + error state + label
- [ ] `Textarea.jsx`, `Select.jsx`
- [ ] `Card.jsx`, `Modal.jsx`, `Badge.jsx`
- [ ] `Avatar.jsx`, `Spinner.jsx`
- [ ] `EmptyState.jsx`, `Skeleton.jsx`, `Toast.jsx`
- [ ] `Navbar.jsx` — navigasi + bell notif + avatar user
- [ ] `AppLayout.jsx`, `Footer.jsx`

### Phase 6 — CRUD Gig + Guard Profil (Hari 13-17)

> **Owner: Ray**

- [ ] Backend: Guard middleware `ProfileComplete` — cek `is_profile_complete` sebelum buat gig
- [ ] Backend: Guard tambahan saat kirim proposal — cek `nim IS NOT NULL` dan `faculty IS NOT NULL`
- [ ] Backend: `GET /api/gigs` — list publik + filter kategori (tanpa guard)
- [ ] Backend: `GET /api/gigs/{id}` — detail gig
- [ ] Backend: `POST /api/gigs` — buat gig (`is_profile_complete = 1`)
- [ ] Backend: `PUT /api/gigs/{id}` — edit gig (pemilik only)
- [ ] Backend: `DELETE /api/gigs/{id}` — hapus gig (pemilik only)
- [ ] Backend: `GET /api/categories` — daftar kategori
- [ ] Frontend: Halaman detail gig
- [ ] Frontend: Form buat gig
- [ ] Frontend: Form edit gig
- [ ] Frontend: Halaman gig milik saya
- [ ] Frontend: `ProfileIncompleteModal.jsx` — popup "Lengkapi Profil Dulu!"

### Phase 7 — Proposal (Hari 17-20)

> **Owner: Ray**

- [ ] Backend: `POST /api/gigs/{id}/proposals` — kirim proposal (`is_profile_complete = 1` + `nim IS NOT NULL` + `faculty IS NOT NULL` + tidak suspended)
- [ ] Backend: Guard user tidak bisa melamar gig sendiri
- [ ] Backend: `GET /api/proposals` — daftar proposal saya
- [ ] Backend: `GET /api/proposals/{id}` — detail proposal
- [ ] Backend: `PATCH /api/proposals/{id}/status` — terima/tolak + pilih metode bayar
- [ ] Backend: `DELETE /api/proposals/{id}` — withdraw
- [ ] **Backend: Saat proposal diterima → otomatis buat `escrows` record + buat `conversations` record**
- [ ] Frontend: Form kirim proposal
- [ ] Frontend: List proposal masuk (ke gig saya)
- [ ] Frontend: Detail proposal + modal terima + pilih metode bayar

### Phase 8 — Profil & Onboarding (Hari 13-17, paralel dengan Phase 6)

> **Owner: Yasmin**

- [ ] Backend: `GET /api/profile` — profil saya
- [ ] Backend: `PUT /api/profile` — update profil + auto-set `is_profile_complete`
- [ ] Backend: `GET /api/users/{id}/profile` — profil publik
- [ ] Backend: `GET /api/activity` — gig & proposal aktif milik user
- [ ] Frontend: Halaman onboarding (isi profil pertama kali)
- [ ] Frontend: Halaman edit profil
- [ ] Frontend: Halaman profil publik
- [ ] Frontend: Halaman aktivitas (tab gig aktif + tab proposal aktif)
- [ ] Frontend: Dashboard ringkasan

### Phase 9 — Escrow & Pembayaran (Hari 21-24)

> **Owner: Nando**

- [ ] Backend: `GET /api/escrows/{id}` — detail escrow
- [ ] Backend: `POST /api/escrows/{id}/deposit` — deposit (non-cash + upload bukti)
- [ ] Backend: `POST /api/escrows/{id}/confirm-cash` — konfirmasi bayar cash
- [ ] Backend: `POST /api/escrows/{id}/release` — release dana setelah gig selesai
- [ ] Backend: `POST /api/escrows/{id}/refund` — refund jika gig dibatalkan
- [ ] Backend: `GET /api/wallet` — saldo wallet saya
- [ ] Backend: `GET /api/wallet/history` — riwayat transaksi wallet
- [ ] **Backend: Logic settlement** — setelah release, tambah saldo wallet (non-cash only, cash skip)
- [ ] Frontend: Halaman status escrow + step indicator
- [ ] Frontend: Form deposit + upload bukti bayar
- [ ] Frontend: Konfirmasi bayar cash
- [ ] Frontend: Tombol "Release Dana"
- [ ] Frontend: Halaman wallet + saldo
- [ ] Frontend: Riwayat transaksi

### Phase 10 — Notifikasi & Homepage (Hari 21-25)

> **Owner: Nando**

- [ ] Backend: Migration tabel `notifications`
- [ ] Backend: `GET /api/notifications` — daftar notifikasi user
- [ ] Backend: `PATCH /api/notifications/{id}/read` — tandai baca
- [ ] Backend: `PATCH /api/notifications/read-all` — tandai semua baca
- [ ] Backend: Kirim notif saat: proposal masuk, proposal diterima/ditolak, escrow released
- [ ] Frontend: Panel notifikasi (dropdown bell icon di navbar)
- [ ] Frontend: Homepage setelah login (feed gig + ringkasan akun)

### Phase 11 — Admin Panel (Hari 25-27)

> **Owner: Nando**

- [ ] Backend: `GET /api/admin/users` — list semua user + status (super_admin only)
- [ ] Backend: `POST /api/admin/users/{id}/suspend` — suspend + catat alasan
- [ ] Backend: `POST /api/admin/users/{id}/unsuspend` — unsuspend
- [ ] Backend: `GET /api/admin/suspend-logs` — riwayat suspend
- [ ] Frontend: Panel admin — list user + badge status
- [ ] Frontend: Modal konfirmasi suspend + input alasan

### Phase 12 — Chat (Hari 22-26, paralel)

> **Owner: Nugi**

- [ ] Backend: Migration `conversations`, `messages` (sudah ada di SQL)
- [ ] Backend: `GET /api/conversations` — inbox percakapan
- [ ] Backend: `GET /api/conversations/{id}/messages` — history pesan
- [ ] Backend: `POST /api/conversations/{id}/messages` — kirim pesan
- [ ] Frontend: Halaman chat inbox
- [ ] Frontend: Halaman chat room (bubble + input)
- [ ] Frontend: Explore page — browse gig publik + filter kategori

### Phase 13 — Explore (Hari 10-13)

> **Owner: Nugi** — bisa dikerjakan setelah auth selesai

- [ ] Frontend: `ExplorePage.jsx` — list gig + filter kategori
- [ ] Frontend: `CategoryFilter.jsx`, `GigCard.jsx`
- [ ] Gunakan `GET /api/gigs` (Ray yang buat backend-nya)

### Phase 14 — Testing & Polish (Hari 28-30)

- [ ] Test flow end-to-end (login → buat gig → proposal → escrow → release)
- [ ] Test guard profil belum lengkap
- [ ] Test user tidak bisa melamar gig sendiri
- [ ] Test escrow cash vs non-cash
- [ ] Test suspend flow
- [ ] Test responsive 375px, 768px, 1280px
- [ ] Fix bug, cleanup `console.log`
- [ ] Loading state, error state, empty state semua halaman
- [ ] Final styling polish

---

## B. Pembagian Modul

Detail lengkap lihat `docs/PEMBAGIAN_MODUL.md`.

### Nugi — Login, Chat & Explore

| Deliverable                                   | File                                      |
| --------------------------------------------- | ----------------------------------------- |
| Auth OTP (request + verify + logout + me)     | `Controllers/AuthController.php`          |
| Chat (conversations + messages)               | `Controllers/ChatController.php`          |
| Halaman auth (email, OTP)                     | `pages/auth/`                             |
| Explore + filter kategori                     | `pages/explore/`                          |
| Chat inbox + chat room                        | `pages/chat/`                             |
| Auth context, protected route, Axios instance | `contexts/`, `routes/`, `services/api.js` |

### Nando — Pembayaran, Notifikasi & Homepage

| Deliverable                                     | File                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Escrow (deposit, release, refund, confirm-cash) | `Controllers/EscrowController.php`                               |
| Wallet (saldo + riwayat)                        | `Controllers/WalletController.php`                               |
| Notifikasi                                      | `Controllers/NotificationController.php`                         |
| Admin suspend/unsuspend                         | `Controllers/AdminController.php`                                |
| Homepage, payment, wallet, notif, admin         | `pages/home/`, `pages/payment/`, `pages/wallet/`, `pages/admin/` |

### Ray — CRUD Gig & Proposal

| Deliverable                              | File                                 |
| ---------------------------------------- | ------------------------------------ |
| CRUD gig + guard profil                  | `Controllers/GigController.php`      |
| Proposal (kirim, terima/tolak, withdraw) | `Controllers/ProposalController.php` |
| Kategori                                 | `Controllers/CategoryController.php` |
| Guard middleware                         | `Middleware/ProfileComplete.php`     |
| Halaman gig + proposal                   | `pages/gigs/`, `pages/proposals/`    |

### Yasmin — Aktivitas & Profil

| Deliverable                            | File                                   |
| -------------------------------------- | -------------------------------------- |
| CRUD profil + auto is_profile_complete | `Controllers/ProfileController.php`    |
| Onboarding, edit profil, profil publik | `pages/profile/`, `pages/onboarding/`  |
| Aktivitas + dashboard                  | `pages/activity/`, `pages/dashboard/`  |
| Komponen UI dasar                      | `components/ui/`, `components/layout/` |

---

## C. Dependency Flow

```
Yasmin (Komponen UI dasar)
  → Sprint 1 — Button, Input, Card, Modal, Navbar selesai duluan
        ↓
Nugi (Auth OTP)
  → Semua anggota butuh token dari sini
        ↓
Ray (Gig + Proposal)
  → Butuh token Nugi, profil dari Yasmin
  → Saat proposal accepted: auto-buat escrow + conversation
        ↓
Nando (Escrow + Notif)
  → Escrow dibuat otomatis oleh Ray
  → Notif dikirim dari event escrow + proposal
        ↓
Yasmin (Aktivitas + Dashboard)
  → Gabungkan data gig (Ray) + proposal (Ray) + wallet (Nando)

Nugi (Explore + Chat)
  → Explore: pakai GET /api/gigs milik Ray
  → Chat: dibuat saat Ray accept proposal
```

---

## D. Tech Stack

| Layer                | Teknologi                                           |
| -------------------- | --------------------------------------------------- |
| **Landing**          | React.js + JavaScript + Vite + Tailwind CSS         |
| **Web App**          | React.js + JavaScript + Vite + Tailwind CSS + Axios |
| **State Management** | React Context API                                   |
| **Backend**          | Laravel + PHP                                       |
| **Database**         | MySQL                                               |
| **Auth**             | Laravel Sanctum + OTP via Email (Mailtrap/SMTP)     |
| **Validasi Backend** | Laravel Form Request                                |
| **Monorepo**         | pnpm workspace                                      |

---

## E. API Endpoints Ringkasan

### Auth (Nugi)

```
POST  /api/auth/request-otp      → kirim OTP ke email
POST  /api/auth/verify-otp       → verifikasi OTP → return Sanctum token
POST  /api/auth/logout            → revoke token
GET   /api/auth/me                → data user yang login
```

### Gig & Proposal (Ray)

```
GET    /api/gigs                           → list publik + filter
GET    /api/gigs/{id}                      → detail gig
POST   /api/gigs                           → buat gig (is_profile_complete = 1)
PUT    /api/gigs/{id}                      → edit gig (pemilik only)
DELETE /api/gigs/{id}                      → hapus gig (pemilik only)

POST   /api/gigs/{id}/proposals            → kirim proposal (is_profile_complete + nim + faculty)
GET    /api/proposals
GET    /api/proposals/{id}
PATCH  /api/proposals/{id}/status          → terima/tolak + pilih metode bayar
DELETE /api/proposals/{id}                 → withdraw

GET    /api/categories
```

### Profil & Aktivitas (Yasmin)

```
GET    /api/profile
PUT    /api/profile
GET    /api/users/{id}/profile
GET    /api/activity
```

### Escrow, Wallet & Notif (Nando)

```
GET    /api/escrows/{id}
POST   /api/escrows/{id}/deposit
POST   /api/escrows/{id}/confirm-cash
POST   /api/escrows/{id}/release
POST   /api/escrows/{id}/refund

GET    /api/wallet
GET    /api/wallet/history

GET    /api/notifications
PATCH  /api/notifications/{id}/read
PATCH  /api/notifications/read-all
```

### Admin (Nando)

```
GET    /api/admin/users
POST   /api/admin/users/{id}/suspend
POST   /api/admin/users/{id}/unsuspend
GET    /api/admin/suspend-logs
```

### Chat (Nugi)

```
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/{id}/messages
POST   /api/conversations/{id}/messages
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

| Risk                               | Mitigation                                                       |
| ---------------------------------- | ---------------------------------------------------------------- |
| CORS error frontend ↔ API          | Setup `config/cors.php`, allow `localhost:5174`, test dari awal  |
| Token tidak ter-attach             | Axios interceptor auto-attach `Authorization: Bearer`            |
| Escrow ganda per proposal          | `UNIQUE(proposal_id)` di tabel `escrows`                         |
| Settlement cash dobel ke wallet    | Check `payment_method === 'cash'` sebelum update wallet          |
| User melamar gig sendiri           | Backend: `$proposal->user_id !== $gig->client_id`                |
| Proposal dikirim tanpa nim/faculty | Guard di `ProposalController` sebelum INSERT                     |
| Migration konflik                  | Jangan edit migration yang sudah dijalankan, buat migration baru |
| Endpoint belum siap                | Gunakan mock data di frontend dulu                               |

---

## H. Aturan Tim

1. Branch dari `develop`, format: `feat/[nama]-[fitur]`
   Contoh: `feat/nugi-auth-otp`, `feat/ray-gig-crud`
2. Jangan commit `.env` — pakai `.env.example`
3. JavaScript konsisten, tidak boleh tiba-tiba pakai TypeScript
4. Pisahkan controller (HTTP) ≠ model/logic bisnis ≠ route
5. State global via Context API, bukan props drilling > 2 level
6. Buat loading, error, empty state di setiap halaman
7. Tidak commit `node_modules/` dan `vendor/`
8. Commit message deskriptif: `feat: add escrow release endpoint`

---

**Next Step**: Import `sikagig.sql` ke MySQL → setup `.env` di `apps/api` → `php artisan migrate --seed` → test auth OTP.
