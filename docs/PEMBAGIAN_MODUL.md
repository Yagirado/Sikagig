# 📋 Pembagian Modul Tim Sikagig

> **Stack**: React.js + Tailwind CSS (frontend) | Laravel + MySQL (backend)
> **Monorepo**: pnpm workspace
> **Role DB**: `user` (bisa posting & mengerjakan gig) | `super_admin`

---

## Ringkasan Pembagian

| Anggota    | Modul                              | Domain             |
| ---------- | ---------------------------------- | ------------------ |
| **Nugi**   | Login + Chat + Explore             | Backend + Frontend |
| **Nando**  | Pembayaran + Notifikasi + Homepage | Backend + Frontend |
| **Ray**    | CRUD Gig + Page Gig                | Backend + Frontend |
| **Yasmin** | Aktivitas + Profil                 | Backend + Frontend |

---

## 👤 Nugi — Login, Chat & Explore

### Scope

- Sistem autentikasi OTP via email (login + register)
- Halaman explore / browse gig publik
- Fitur chat real-time antar pengguna

### Backend — Laravel API

| Endpoint                                | Keterangan                                                   |
| --------------------------------------- | ------------------------------------------------------------ |
| `POST /api/auth/request-otp`            | Kirim OTP ke email                                           |
| `POST /api/auth/verify-otp`             | Verifikasi OTP → return Sanctum token                        |
| `POST /api/auth/logout`                 | Revoke token                                                 |
| `GET  /api/auth/me`                     | Data user yang sedang login                                  |
| `GET  /api/gigs`                        | List gig publik + filter kategori (bisa diakses tanpa login) |
| `GET  /api/categories`                  | Daftar kategori untuk filter explore                         |
| `GET  /api/conversations`               | Daftar inbox percakapan user                                 |
| `POST /api/conversations`               | Mulai percakapan baru                                        |
| `GET  /api/conversations/{id}/messages` | Ambil pesan dalam satu percakapan                            |
| `POST /api/conversations/{id}/messages` | Kirim pesan                                                  |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── AuthController.php        ← request-otp, verify-otp, logout, me
│   ├── ChatController.php        ← conversations + messages
│   └── CategoryController.php   ← list kategori (dibagi pakai dengan Ray)
├── app/Models/
│   ├── User.php
│   ├── OtpCode.php
│   ├── Conversation.php
│   └── Message.php
├── database/migrations/
│   ├── ..._create_users_table.php
│   ├── ..._create_otp_codes_table.php
│   ├── ..._create_conversations_table.php
│   └── ..._create_messages_table.php
├── database/seeders/
│   └── UserSeeder.php
└── routes/api.php                ← auth + chat + explore (GET /gigs read-only)
```

### Frontend — React Web App

| Halaman / Komponen            | File                                    |
| ----------------------------- | --------------------------------------- |
| Halaman input email           | `pages/auth/EmailPage.jsx`              |
| Halaman input + countdown OTP | `pages/auth/OtpPage.jsx`                |
| Auth context + token storage  | `contexts/AuthContext.jsx`              |
| Protected route wrapper       | `routes/ProtectedRoute.jsx`             |
| Axios instance + interceptor  | `services/api.js`                       |
| Service auth                  | `services/auth.service.js`              |
| Service chat                  | `services/chat.service.js`              |
| Hook useAuth                  | `hooks/useAuth.js`                      |
| Halaman explore (browse gig)  | `pages/explore/ExplorePage.jsx`         |
| Filter kategori               | `components/explore/CategoryFilter.jsx` |
| Card gig di explore           | `components/explore/GigCard.jsx`        |
| Halaman chat inbox            | `pages/chat/ChatInboxPage.jsx`          |
| Halaman chat room             | `pages/chat/ChatRoomPage.jsx`           |
| Komponen bubble pesan         | `components/chat/MessageBubble.jsx`     |

### Catatan

- `GET /api/gigs` dipakai bersama Ray — Nugi handle tampilan explore-nya, Ray handle halaman detail & CRUD
- Autentikasi pakai **Laravel Sanctum** (bukan JWT/password) — token di-store di `localStorage`
- Guard profil belum lengkap **bukan** tanggung jawab Nugi, itu di Ray (gig) dan Yasmin (profil)

---

## 💳 Nando — Pembayaran, Notifikasi & Homepage

### Scope

- Sistem escrow (deposit, hold, release, refund)
- Metode bayar: bank transfer, e-wallet, cash
- Wallet user (saldo + riwayat transaksi)
- Notifikasi in-app (panel bell icon)
- Admin: suspend/unsuspend user
- Homepage setelah login (feed gig + ringkasan)

### Backend — Laravel API

| Endpoint                               | Keterangan                                |
| -------------------------------------- | ----------------------------------------- |
| `GET  /api/escrows/{id}`               | Detail escrow                             |
| `POST /api/escrows/{id}/deposit`       | Deposit (transfer/ewallet + upload bukti) |
| `POST /api/escrows/{id}/confirm-cash`  | Konfirmasi bayar cash                     |
| `POST /api/escrows/{id}/release`       | Release dana setelah gig selesai          |
| `POST /api/escrows/{id}/refund`        | Refund jika gig dibatalkan                |
| `GET  /api/wallet`                     | Cek saldo wallet saya                     |
| `GET  /api/wallet/history`             | Riwayat transaksi wallet                  |
| `GET  /api/notifications`              | Daftar notifikasi user                    |
| `PATCH /api/notifications/{id}/read`   | Tandai notifikasi sudah dibaca            |
| `PATCH /api/notifications/read-all`    | Tandai semua sudah dibaca                 |
| `GET  /api/admin/users`                | Daftar user (super_admin only)            |
| `POST /api/admin/users/{id}/suspend`   | Suspend user                              |
| `POST /api/admin/users/{id}/unsuspend` | Unsuspend user                            |
| `GET  /api/admin/suspend-logs`         | Riwayat suspend                           |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── EscrowController.php        ← deposit, release, refund, confirm-cash
│   ├── WalletController.php        ← saldo + riwayat
│   ├── NotificationController.php  ← list + tandai baca
│   └── AdminController.php         ← suspend/unsuspend + logs
├── app/Models/
│   ├── Escrow.php
│   ├── Payment.php
│   ├── Wallet.php
│   ├── Notification.php
│   └── SuspendLog.php
├── database/migrations/
│   ├── ..._create_escrows_table.php
│   ├── ..._create_payments_table.php
│   ├── ..._create_wallets_table.php
│   ├── ..._create_notifications_table.php
│   └── ..._create_suspend_logs_table.php
└── routes/api.php                  ← escrow + wallet + notif + admin routes
```

**Business Logic Escrow:**

```
Cash:
  confirm-cash → status = "holding"
  release      → status = "released"  ← TIDAK nambah saldo wallet

Non-Cash (transfer/ewallet):
  deposit  → status = "holding"  (simpan bukti bayar)
  release  → status = "released" → tambah saldo wallet worker

Refund:
  refund   → status = "refunded" → kembalikan ke client (non-cash only)
```

### Frontend — React Web App

| Halaman / Komponen               | File                                      |
| -------------------------------- | ----------------------------------------- |
| Homepage setelah login           | `pages/home/HomePage.jsx`                 |
| Feed gig di homepage             | `components/home/GigFeed.jsx`             |
| Status escrow + step indicator   | `pages/payment/EscrowStatusPage.jsx`      |
| Form deposit + upload bukti      | `pages/payment/DepositPage.jsx`           |
| Konfirmasi bayar cash            | `pages/payment/CashConfirmPage.jsx`       |
| Halaman release dana             | `pages/payment/ReleaseFundsPage.jsx`      |
| Halaman wallet + saldo           | `pages/wallet/WalletPage.jsx`             |
| Riwayat transaksi                | `pages/wallet/WalletHistoryPage.jsx`      |
| Panel notifikasi (dropdown bell) | `components/notifications/NotifPanel.jsx` |
| Item notifikasi                  | `components/notifications/NotifItem.jsx`  |
| Panel admin — daftar user        | `pages/admin/UserListPage.jsx`            |
| Modal suspend user               | `pages/admin/SuspendModal.jsx`            |
| Service escrow                   | `services/escrow.service.js`              |
| Service wallet                   | `services/wallet.service.js`              |
| Service notifikasi               | `services/notification.service.js`        |
| Hook useWallet                   | `hooks/useWallet.js`                      |
| Hook useNotifications            | `hooks/useNotifications.js`               |

---

## 🛠️ Ray — CRUD Gig & Page Gig

### Scope

- CRUD Gig (buat, edit, hapus, detail)
- Halaman detail gig publik
- Proposal: kirim, terima, tolak, withdraw
- Guard profil belum lengkap saat buat gig / kirim proposal
- Paginasi / infinite scroll daftar gig

### Backend — Laravel API

| Endpoint                           | Keterangan                                             |
| ---------------------------------- | ------------------------------------------------------ |
| `GET  /api/gigs`                   | List gig publik + filter + paginasi                    |
| `GET  /api/gigs/{id}`              | Detail gig + list proposal masuk                       |
| `POST /api/gigs`                   | Buat gig (`is_profile_complete = 1`)                   |
| `PUT  /api/gigs/{id}`              | Edit gig (pemilik only)                                |
| `DELETE /api/gigs/{id}`            | Hapus gig (pemilik only)                               |
| `POST /api/gigs/{id}/proposals`    | Kirim proposal (`is_profile_complete + nim + faculty`) |
| `GET  /api/proposals`              | Daftar proposal saya                                   |
| `GET  /api/proposals/{id}`         | Detail proposal                                        |
| `PATCH /api/proposals/{id}/status` | Terima / tolak + pilih metode bayar                    |
| `DELETE /api/proposals/{id}`       | Withdraw proposal                                      |
| `GET  /api/categories`             | Daftar kategori (shared dengan Nugi)                   |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   ├── GigController.php           ← CRUD gig
│   ├── ProposalController.php      ← kirim, terima/tolak, withdraw
│   └── CategoryController.php     ← shared dengan Nugi
├── app/Models/
│   ├── Gig.php
│   ├── Proposal.php
│   └── Category.php
├── app/Http/Middleware/
│   └── ProfileComplete.php         ← guard is_profile_complete
├── database/migrations/
│   ├── ..._create_categories_table.php
│   ├── ..._create_gigs_table.php
│   └── ..._create_proposals_table.php
├── database/seeders/
│   ├── CategorySeeder.php
│   └── GigSeeder.php
└── routes/api.php                  ← gig + proposal + category routes
```

**Note Penting:**

- Saat proposal **diterima** (`status = accepted`) → otomatis insert ke tabel `escrows`
- Guard: user tidak bisa melamar gig miliknya sendiri (`user_id != gig.client_id`)
- Guard: user dengan `nim = NULL` atau `faculty = NULL` → 403 saat kirim proposal

### Frontend — React Web App

| Halaman / Komponen                | File                                           |
| --------------------------------- | ---------------------------------------------- |
| Detail gig                        | `pages/gigs/GigDetailPage.jsx`                 |
| Form buat gig                     | `pages/gigs/CreateGigPage.jsx`                 |
| Form edit gig                     | `pages/gigs/EditGigPage.jsx`                   |
| Gig milik saya                    | `pages/gigs/MyGigsPage.jsx`                    |
| Form kirim proposal               | `pages/proposals/SendProposalPage.jsx`         |
| Proposal masuk (ke gig saya)      | `pages/proposals/IncomingProposalsPage.jsx`    |
| Detail proposal                   | `pages/proposals/ProposalDetailPage.jsx`       |
| Modal terima + pilih metode bayar | `pages/proposals/AcceptProposalModal.jsx`      |
| Modal "Lengkapi Profil Dulu"      | `components/shared/ProfileIncompleteModal.jsx` |
| Service gig                       | `services/gig.service.js`                      |
| Service proposal                  | `services/proposal.service.js`                 |
| Hook useGigs                      | `hooks/useGigs.js`                             |
| Hook useProposals                 | `hooks/useProposals.js`                        |

---

## 🎨 Yasmin — Aktivitas & Profil

### Scope

- Halaman profil (edit + profil publik)
- Onboarding setelah register (isi nama, nim, fakultas)
- Halaman aktivitas: semua gig & proposal yang sedang berjalan
- Dashboard ringkasan (gig aktif, proposal menunggu, saldo)
- Komponen UI dasar yang dipakai semua halaman

### Backend — Laravel API

| Endpoint                       | Keterangan                                     |
| ------------------------------ | ---------------------------------------------- |
| `GET  /api/profile`            | Profil saya                                    |
| `PUT  /api/profile`            | Update profil + auto-set `is_profile_complete` |
| `GET  /api/users/{id}/profile` | Profil publik user lain                        |
| `GET  /api/activity`           | Semua gig & proposal aktif milik user          |

**File Backend:**

```
apps/api/
├── app/Http/Controllers/
│   └── ProfileController.php       ← CRUD profil + auto is_profile_complete
├── app/Models/
│   └── Profile.php
├── database/migrations/
│   └── ..._create_profiles_table.php
├── database/seeders/
│   └── ProfileSeeder.php
└── routes/api.php                  ← profile routes
```

**Logic `is_profile_complete`:**

```
is_profile_complete = 1  jika  name IS NOT NULL
                              (cukup untuk buat gig)

Untuk kirim proposal (dicek di ProposalController — Ray):
  is_profile_complete = 1 AND nim IS NOT NULL AND faculty IS NOT NULL
```

### Frontend — React Web App

| Halaman / Komponen                   | File                                         |
| ------------------------------------ | -------------------------------------------- |
| Onboarding (isi profil pertama kali) | `pages/onboarding/OnboardingPage.jsx`        |
| Edit profil                          | `pages/profile/EditProfilePage.jsx`          |
| Profil publik user lain              | `pages/profile/PublicProfilePage.jsx`        |
| Halaman aktivitas                    | `pages/activity/ActivityPage.jsx`            |
| Tab gig aktif di aktivitas           | `components/activity/ActiveGigsTab.jsx`      |
| Tab proposal aktif di aktivitas      | `components/activity/ActiveProposalsTab.jsx` |
| Dashboard ringkasan                  | `pages/dashboard/DashboardPage.jsx`          |
| Card ringkasan di dashboard          | `components/dashboard/SummaryCard.jsx`       |
| Service profil                       | `services/profile.service.js`                |
| Hook useProfile                      | `hooks/useProfile.js`                        |

### Komponen UI Dasar (Yasmin yang buat, dipakai semua)

```
apps/web/src/components/ui/
├── Button.jsx       ← primary, secondary, ghost, danger + loading state
├── Input.jsx        ← text, email + error state + label
├── Textarea.jsx
├── Select.jsx
├── Card.jsx
├── Modal.jsx        ← base modal dengan overlay + close button
├── Badge.jsx        ← warna sesuai status gig/proposal
├── Avatar.jsx       ← gambar + fallback inisial
├── Spinner.jsx
├── EmptyState.jsx   ← tampilan saat data kosong
├── Skeleton.jsx     ← loading skeleton card
└── Toast.jsx        ← notifikasi global (sukses/gagal)

apps/web/src/components/layout/
├── Navbar.jsx       ← navigasi + bell notif + avatar
├── AppLayout.jsx    ← wrapper halaman
└── Footer.jsx
```

> **Penting**: Yasmin selesaikan komponen UI ini di awal sprint agar Nugi, Nando, dan Ray bisa langsung pakai.

---

## 🔗 Dependency Flow

```
Yasmin (Komponen UI)
  → Sprint 1 — paralel dengan backend setup
  → Button, Input, Card, Modal, Navbar harus selesai duluan
        ↓
Nugi (Auth + Explore + Chat)
  → Auth endpoint + halaman login selesai dulu
  → Semua anggota butuh token dari sini
        ↓
Ray (Gig + Proposal)
  → Backend gig + proposal
  → Butuh token dari Nugi, profil dari Yasmin
        ↓
Nando (Escrow + Notif + Homepage)
  → Escrow dibuat otomatis saat Ray accept proposal
  → Notif dikirim dari escrow event
        ↓
Yasmin (Aktivitas + Dashboard)
  → Gabungkan data gig (Ray) + proposal (Ray) + escrow (Nando)
```

---

## 📁 Ownership File

| Path                                              | Owner               |
| ------------------------------------------------- | ------------------- |
| `apps/api/Controllers/AuthController.php`         | Nugi                |
| `apps/api/Controllers/ChatController.php`         | Nugi                |
| `apps/api/Controllers/GigController.php`          | Ray                 |
| `apps/api/Controllers/ProposalController.php`     | Ray                 |
| `apps/api/Controllers/CategoryController.php`     | Ray + Nugi (shared) |
| `apps/api/Controllers/EscrowController.php`       | Nando               |
| `apps/api/Controllers/WalletController.php`       | Nando               |
| `apps/api/Controllers/NotificationController.php` | Nando               |
| `apps/api/Controllers/AdminController.php`        | Nando               |
| `apps/api/Controllers/ProfileController.php`      | Yasmin              |
| `apps/web/src/pages/auth/`                        | Nugi                |
| `apps/web/src/pages/explore/`                     | Nugi                |
| `apps/web/src/pages/chat/`                        | Nugi                |
| `apps/web/src/pages/home/`                        | Nando               |
| `apps/web/src/pages/payment/`                     | Nando               |
| `apps/web/src/pages/wallet/`                      | Nando               |
| `apps/web/src/pages/admin/`                       | Nando               |
| `apps/web/src/pages/gigs/`                        | Ray                 |
| `apps/web/src/pages/proposals/`                   | Ray                 |
| `apps/web/src/pages/profile/`                     | Yasmin              |
| `apps/web/src/pages/onboarding/`                  | Yasmin              |
| `apps/web/src/pages/activity/`                    | Yasmin              |
| `apps/web/src/pages/dashboard/`                   | Yasmin              |
| `apps/web/src/components/ui/`                     | Yasmin              |
| `apps/web/src/components/layout/`                 | Yasmin              |

---

## ⚠️ Aturan Kerja Tim

1. **Branch** dari `develop`, format `feat/[nama]-[fitur]`
   Contoh: `feat/nugi-auth-otp`, `feat/ray-gig-crud`, `feat/nando-escrow`

2. **Jangan edit file milik orang lain** tanpa koordinasi

3. **Komponen UI dari Yasmin** — import dari `components/ui/`, jangan bikin ulang

4. **Mock data** jika endpoint belum siap — jangan nunggu

5. **Commit message** format:
   `feat: add escrow release endpoint`
   `fix: otp countdown reset bug`
   `ui: profile incomplete modal`

6. Jangan commit `.env`, `node_modules/`, `vendor/`

7. Setiap halaman wajib punya **loading state**, **error state**, **empty state**

8. Test responsif minimal: **375px** · **768px** · **1280px**
