# 📋 Foundation: Platform Gig Lokal (SIKAGIG)

> **Deskripsi**: Platform yang mempertemukan pengguna yang butuh bantuan
> dengan pengguna yang siap mengerjakan. Satu akun bisa dua peran.
> **Domain**: Marketplace Jasa / Platform Gig Lokal
> **Kelompok**: 4 Anggota — Nugi, Nando, Ray, Yasmin

---

## A. Spesifikasi Final

| Aspek           | Detail                                                     |
| --------------- | ---------------------------------------------------------- |
| **Total Tabel** | 14 tabel MySQL                                             |
| **Role**        | 2 — `user` (bisa posting & mengerjakan gig), `super_admin` |
| **Stack**       | React.js + JavaScript + Tailwind CSS + Laravel + MySQL     |
| **Monorepo**    | pnpm workspace (landing, web, api)                         |

### Fitur Wajib (MVP)

- **2 role**: `user` (pengguna biasa, bisa jadi pemberi kerja sekaligus pengerjaan), `super_admin`
- **Login wajib via email + OTP** — tidak ada password konvensional, tidak ada Google OAuth
- User bisa **browse gig** segera setelah login, tanpa perlu lengkapi profil dulu
- User harus **lengkapi profil** (minimal `name`) sebelum bisa posting gig
- User harus **lengkapi profil + isi NIM + Fakultas** sebelum bisa kirim proposal
- Foto profil **opsional** untuk semua user
- **CRUD lengkap**: Gig dan Proposal
- State machine gig: `open → in_progress → completed / cancelled`
- State machine proposal: `pending → accepted / rejected / withdrawn`
- Satu user hanya boleh melamar satu kali per gig
- User tidak bisa melamar gig miliknya sendiri
- Autentikasi via Laravel Sanctum (token per sesi)
- **Super Admin bisa suspend/unsuspend akun user** + audit trail di `suspend_logs`
- **User yang disuspend tidak bisa login atau akses fitur gig**
- **Sistem Escrow**: dana ditahan platform selama gig berlangsung
- **Metode pembayaran**: Transfer Bank, E-Wallet, Cash / Bayar di Tempat
- **Notifikasi in-app**: proposal masuk, proposal diterima/ditolak, escrow released
- **Chat**: pesan antar pemberi kerja dan pengerjaan (dibuka setelah proposal diterima)

### Fitur Lanjutan (Post-MVP)

- ⭐ Rating & review setelah transaksi
- 🔔 Notifikasi real-time (Laravel Echo / Reverb)
- 🔒 Dispute / komplain untuk sengketa

---

## B. Daftar Tabel (14 Tabel MySQL)

| #   | Tabel                    | Fungsi                                                                    |
| --- | ------------------------ | ------------------------------------------------------------------------- |
| 1   | `users`                  | Akun semua pengguna. Login via email + OTP. Role: `user` \| `super_admin` |
| 2   | `otp_codes`              | Kode OTP 6 digit, expired 10 menit, sekali pakai                          |
| 3   | `profiles`               | Data profil. `is_profile_complete` jadi penjaga aksi buat/ambil gig       |
| 4   | `suspend_logs`           | Audit trail suspend/unsuspend oleh super_admin                            |
| 5   | `categories`             | Master kategori gig                                                       |
| 6   | `wallets`                | Saldo user (semua user bisa punya wallet)                                 |
| 7   | `notifications`          | Notifikasi in-app per user                                                |
| 8   | `gigs`                   | Postingan pekerjaan                                                       |
| 9   | `proposals`              | Lamaran user ke gig                                                       |
| 10  | `escrows`                | Dana yang ditahan platform per deal                                       |
| 11  | `payments`               | Log transaksi keuangan                                                    |
| 12  | `conversations`          | Sesi percakapan antara pemberi kerja dan pengerjaan (1:1 per proposal)    |
| 13  | `messages`               | Pesan dalam satu percakapan                                               |
| 14  | `personal_access_tokens` | Token Sanctum                                                             |

---

## C. Flow Sistem

### 1. Flow Login / Register

```
[User] Buka app → masukkan email
    ↓
[Backend] Email terdaftar? → kirim OTP (purpose: login)
          Email baru?      → kirim OTP (purpose: register)
    ↓
[User] Masukkan OTP (6 digit, 10 menit)
    ↓ OTP valid
[Backend] Cek is_suspended = 1?
    ↓ ya  → tolak login, tampilkan alasan suspend
    ↓ tidak → generate Sanctum token → return token + data user
[Frontend] Simpan token di localStorage → redirect ke explore/home

Untuk register: setelah OTP valid → buat user baru + profil kosong → redirect ke onboarding
```

### 2. Flow OTP

```
Request OTP
    ↓
Backend: hapus OTP lama yang belum dipakai untuk email ini
Backend: generate 6 digit random
Backend: simpan ke otp_codes {email, otp, purpose, expires_at = +10 menit}
Backend: kirim email via Laravel Mail / Mailtrap
    ↓
User masukkan OTP
    ↓
Backend: cek otp_codes WHERE email=? AND otp=? AND is_used=0 AND expires_at>NOW()
    ↓ tidak valid / expired → error "OTP tidak valid atau sudah kedaluwarsa"
    ↓ valid → set is_used=1 → proses login/register
```

### 3. Flow Posting Gig (Pemberi Kerja)

```
[User] Coba buat gig
    ↓
[Backend] Cek is_profile_complete = 1?
    ↓ tidak → HTTP 403 {error: "profile_incomplete"}
    → [Frontend] popup "Lengkapi Profil Dulu"
    → [User] redirect ke /profile/edit → isi minimal Nama
    ↓ ya
[User] Isi form gig (judul, deskripsi, budget, kategori, deadline)
    ↓
[Backend] INSERT gig → status: open
```

### 4. Flow Kirim Proposal (Pengerjaan)

```
[User] Lihat gig → klik "Ambil Gig"
    ↓
[Backend] Cek:
  1. is_profile_complete = 1?
  2. nim IS NOT NULL?
  3. faculty IS NOT NULL?
  4. is_suspended = 0?
  5. user_id !== gig.client_id? (tidak melamar gig sendiri)
    ↓ syarat tidak terpenuhi → HTTP 403 dengan flag error spesifik
    → [Frontend] tampilkan popup sesuai flag:
       "profile_incomplete"          → popup lengkapi profil
       "nim_required"                → popup isi NIM & Fakultas
       "suspended"                   → tampilkan alasan suspend
       "cannot_apply_own_gig"        → tampilkan pesan error
    ↓ semua ok
[User] Isi form proposal (cover letter, tawaran harga)
    ↓
[Backend] INSERT proposal → status: pending
          Kirim notifikasi ke pemilik gig: "proposal_received"
```

### 5. Flow Terima Proposal + Buat Escrow + Buka Chat

```
[Pemberi Kerja] Lihat proposal masuk → pilih satu → klik "Terima"
    ↓
[User] Pilih metode bayar: Transfer Bank / E-Wallet / Cash
    ↓
[Backend] UPDATE proposals SET status='accepted'
          UPDATE proposals lain (gig yang sama) SET status='rejected'
          UPDATE gigs SET status='in_progress'

          Buat escrow:
            Non-cash → status='awaiting_payment'
            Cash     → status='holding', held_at=NOW()

          Buat conversation (firstOrCreate):
            {proposal_id, gig_id, client_id, worker_id}

          Kirim notifikasi:
            ke worker → "proposal_accepted"
            ke worker yg ditolak → "proposal_rejected"
```

### 6. Flow Escrow & Pembayaran

```
Non-Cash (Transfer/E-Wallet):
  [Client] Upload bukti bayar → POST /escrows/{id}/deposit
      ↓
  [Backend] escrow.status = 'holding', held_at = NOW()
  [Gig dikerjakan...]
  [Client] Konfirmasi selesai → POST /escrows/{id}/release
      ↓
  [Backend] escrow.status = 'released', released_at = NOW()
            escrow.status = 'settled',  settled_at  = NOW()
            wallets.balance += escrow.amount  ← tambah saldo worker
            Kirim notifikasi: "escrow_released"

Cash:
  [Escrow sudah 'holding' sejak proposal diterima]
  [Gig dikerjakan, bayar langsung di tempat...]
  [Client] Konfirmasi → POST /escrows/{id}/confirm-cash
      ↓
  [Backend] escrow.status = 'released', released_at = NOW()
            wallet TIDAK bertambah (bayar di luar platform)
```

### 7. Flow Suspend (Super Admin)

```
[Super Admin] Login → panel admin → pilih user → klik "Suspend"
    ↓
[Admin] Isi alasan → konfirmasi
    ↓
[Backend] UPDATE users SET is_suspended=1, suspended_at=NOW(), suspended_reason=?
          INSERT suspend_logs {target_user_id, admin_id, action='suspend', reason}
          DELETE personal_access_tokens WHERE tokenable_id = user_id
    ↓
User yang disuspend:
  - Token semua di-revoke → otomatis logout
  - Tidak bisa login (cek is_suspended setelah OTP valid)
  - Tidak bisa posting gig / kirim proposal / kirim pesan
```

---

## D. Guard `is_profile_complete` — Detail

| Aksi                 | Syarat Minimum                                                        |
| -------------------- | --------------------------------------------------------------------- |
| Browse gig (explore) | Tidak perlu — akses bebas setelah login                               |
| Posting gig          | `is_profile_complete = 1` (name terisi)                               |
| Kirim proposal       | `is_profile_complete = 1` + `nim IS NOT NULL` + `faculty IS NOT NULL` |
| Kirim pesan (chat)   | Sudah punya conversation (otomatis dari proposal diterima)            |

**Logic auto-set `is_profile_complete`** di `ProfileController`:

```php
$isComplete = !empty($profile->name);
$profile->update(['is_profile_complete' => $isComplete ? 1 : 0]);
```

---

## E. Glossary

### Status Gig

| Status        | Arti              | Trigger               |
| ------------- | ----------------- | --------------------- |
| `open`        | Menerima proposal | Dibuat pertama kali   |
| `in_progress` | Sedang dikerjakan | Proposal diterima     |
| `completed`   | Selesai           | Client tandai selesai |
| `cancelled`   | Dibatalkan        | Client batalkan       |

### Status Proposal

| Status      | Arti     | Trigger                               |
| ----------- | -------- | ------------------------------------- |
| `pending`   | Menunggu | Setelah dikirim                       |
| `accepted`  | Diterima | Client terima                         |
| `rejected`  | Ditolak  | Client tolak / proposal lain diterima |
| `withdrawn` | Ditarik  | User tarik kembali                    |

### Status Escrow

| Status             | Arti                                     |
| ------------------ | ---------------------------------------- |
| `awaiting_payment` | Menunggu deposit client (non-cash saja)  |
| `holding`          | Dana di-hold / cash dikonfirmasi         |
| `released`         | Client konfirmasi gig selesai            |
| `settled`          | Dana masuk wallet worker (non-cash saja) |
| `refunded`         | Dana dikembalikan ke client              |
| `disputed`         | Ada sengketa (post-MVP)                  |

### Tipe Notifikasi

| Type                | Dikirim ke | Trigger                      |
| ------------------- | ---------- | ---------------------------- |
| `proposal_received` | Client     | Ada proposal masuk ke gignya |
| `proposal_accepted` | Worker     | Proposalnya diterima         |
| `proposal_rejected` | Worker     | Proposalnya ditolak          |
| `escrow_released`   | Worker     | Client release dana          |

---

## F. Distribusi Fitur Per Anggota

| Anggota    | Fokus                                     | Layer                                                                                                                                                                                             |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nugi**   | Login OTP + Chat + Explore                | `Controllers/AuthController`, `Controllers/ChatController`, `pages/auth`, `pages/explore`, `pages/chat`                                                                                           |
| **Nando**  | Pembayaran Escrow + Notifikasi + Homepage | `Controllers/EscrowController`, `Controllers/WalletController`, `Controllers/NotificationController`, `Controllers/AdminController`, `pages/payment`, `pages/wallet`, `pages/home`, `pages/admin` |
| **Ray**    | CRUD Gig + Page Gig + Proposal            | `Controllers/GigController`, `Controllers/ProposalController`, `pages/gigs`, `pages/proposals`                                                                                                    |
| **Yasmin** | Aktivitas + Profil + Komponen UI dasar    | `Controllers/ProfileController`, `pages/profile`, `pages/onboarding`, `pages/activity`, `pages/dashboard`, `components/ui`, `components/layout`                                                   |

---

## G. Seed Data

### Kategori (7)

```
tugas | belanja | antar-jemput | riset | cod-antri | jasa | lainnya
```

### Akun Dummy (testing OTP)

| Email                   | Role        | Profil                         | Keterangan                                  |
| ----------------------- | ----------- | ------------------------------ | ------------------------------------------- |
| `admin@sikagig.com`     | super_admin | lengkap                        | Akun admin                                  |
| `budi@example.com`      | user        | lengkap (name + nim + faculty) | Bisa posting gig DAN kirim proposal         |
| `rina@example.com`      | user        | lengkap (name) tapi nim kosong | Bisa posting gig, BELUM bisa kirim proposal |
| `hendra@example.com`    | user        | belum lengkap (name NULL)      | Kena popup di semua aksi                    |
| `suspended@example.com` | user        | lengkap                        | **Disuspend**, tidak bisa login             |

OTP Testing (langsung pakai tanpa kirim email):

- `budi@example.com` → `123456`
- `rina@example.com` → `234567`
- email baru → `345678`
