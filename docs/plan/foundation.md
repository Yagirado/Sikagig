# 📋 Foundation: Platform Gig Lokal (SIKAGIG)

> **Deskripsi**: Platform yang mempertemukan **juragan** (yang butuh bantuan) dengan **sika** (yang siap mengerjakan)
> **Domain**: Marketplace Jasa / Platform Gig Lokal
> **Kelompok**: 4 Anggota

---

## A. Spesifikasi Final

| Aspek           | Detail                                                 |
| --------------- | ------------------------------------------------------ |
| **Total Tabel** | 11 tabel MySQL                                         |
| **Role**        | 3 (Client / Juragan, Freelancer / Sika, Super Admin)   |
| **Stack**       | React.js + JavaScript + Tailwind CSS + Laravel + MySQL |
| **Monorepo**    | pnpm workspace (landing, web, api)                     |

### Fitur Wajib

- **3 role pengguna**: Client/Juragan, Freelancer/Sika, Super Admin
- **Login wajib via email + OTP** — tidak ada password konvensional, tidak ada Google OAuth
- **Sika bisa browse gig** segera setelah login, tanpa perlu lengkapi profil dulu
- **Sika harus lengkapi profil** (NIM, Nama Lengkap, Fakultas) sebelum bisa buat atau ambil gig — jika belum, tampilkan popup
- Foto profil **opsional** untuk semua role
- **CRUD lengkap**: Gig (client) dan Proposal (freelancer)
- State machine gig: `open → in_progress → completed / cancelled`
- State machine proposal: `pending → accepted / rejected / withdrawn`
- Validasi satu freelancer hanya boleh melamar sekali per gig
- Autentikasi via Laravel Sanctum (token per sesi)
- Middleware role-based authorization
- **Super Admin bisa suspend/unsuspend akun freelancer** + audit trail di `suspend_logs`
- **Freelancer yang disuspend tidak bisa login atau akses fitur gig**
- **Sistem Escrow**: dana ditahan platform selama gig berlangsung
- **Metode pembayaran**: Transfer Bank, E-Wallet (QRIS), Cash / Bayar di Tempat

### Fitur Lanjutan (Post-MVP)

- 💬 Sistem pesan antar juragan dan sika
- ⭐ Rating & review setelah transaksi
- 🔔 Notifikasi real-time (Laravel Echo)
- 🔒 Dispute / komplain untuk sengketa

---

## B. Daftar Tabel (11 Tabel MySQL)

| #   | Tabel                    | Fungsi                                                                          |
| --- | ------------------------ | ------------------------------------------------------------------------------- |
| 1   | `users`                  | Akun semua pengguna. Login via email + OTP. Role: client/freelancer/super_admin |
| 2   | `otp_codes`              | Kode OTP 6 digit, expired 10 menit, sekali pakai                                |
| 3   | `profiles`               | Data profil. `is_profile_complete` jadi penjaga akses buat/ambil gig            |
| 4   | `suspend_logs`           | Audit trail suspend/unsuspend oleh super_admin                                  |
| 5   | `categories`             | Master kategori gig                                                             |
| 6   | `wallets`                | Saldo freelancer (dibuat saat profil lengkap)                                   |
| 7   | `gigs`                   | Postingan pekerjaan                                                             |
| 8   | `proposals`              | Lamaran freelancer ke gig                                                       |
| 9   | `escrows`                | Dana yang ditahan platform per deal                                             |
| 10  | `payments`               | Log transaksi keuangan                                                          |
| 11  | `personal_access_tokens` | Token Sanctum                                                                   |

---

## C. Flow Sistem

### 1. Flow Utama Sika (Freelancer)

```
[Sika] Buka landing page
    ↓
Klik "Buka App"
    ↓
[App] Redirect ke halaman Login
    ↓ (belum punya akun)
Klik "Daftar" → pilih role FREELANCER → masukkan email
    ↓
[Backend] Kirim OTP 6 digit ke email (expires 10 menit)
    ↓
[Sika] Masukkan OTP → verifikasi
    ↓ OTP valid
[Backend] Buat akun baru → generate Sanctum token → login
    ↓
[App] Masuk ke halaman utama: daftar gig bisa LANGSUNG dilihat ✅
    ↓
[Sika] Klik gig yang menarik → lihat detail → klik "Ambil Gig"
    ↓
[Backend] Cek: is_profile_complete = 1?
    ↓ TIDAK (profil belum lengkap)
    → [Frontend] Tampilkan POPUP:
      "Lengkapi profilmu dulu!"
      "Kamu perlu mengisi NIM, Nama Lengkap, dan Fakultas
       sebelum bisa mengambil atau membuat gig."
      [Tombol: Lengkapi Sekarang]
    ↓ YA (profil sudah lengkap)
    → Lanjut kirim proposal
```

### 2. Flow Login (Akun Sudah Ada)

```
[User] Buka /login → masukkan email
    ↓
[Backend] Cek: email terdaftar?
    ↓ tidak → arahkan ke register
    ↓ ya → kirim OTP ke email
[User] Masukkan OTP
    ↓ OTP valid & belum expired
[Backend] Cek: is_suspended = 1? (untuk role freelancer)
    ↓ ya → tampilkan pesan "Akun Anda telah disuspend: [alasan]"
    ↓ tidak → generate Sanctum token → return token + data user
[Frontend] Simpan token → redirect ke halaman gig
```

### 3. Flow OTP

```
Request OTP
    ↓
Backend: hapus OTP lama yang belum dipakai untuk email ini
Backend: generate 6 digit random
Backend: simpan ke otp_codes {email, otp, purpose, expires_at = +10 menit}
Backend: kirim email via Laravel Mail / Mailgun / SMTP
    ↓
User masukkan OTP
    ↓
Backend: cek otp_codes WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
    ↓ tidak ditemukan / expired → error "OTP tidak valid atau sudah kedaluwarsa"
    ↓ valid → set is_used = 1 → proses login/register
```

### 4. Flow Lengkapi Profil (Sika)

```
[Sika] Coba ambil atau buat gig
    ↓
[Backend] Cek profiles.is_profile_complete
    ↓ = 0 (belum lengkap)
    → Return HTTP 403 {
        "error": "profile_incomplete",
        "message": "Lengkapi profilmu dulu sebelum melanjutkan."
      }
    → [Frontend] Tampilkan popup "Lengkapi Profil"
    → User klik "Lengkapi Sekarang" → redirect ke /profile/edit
    ↓
[Sika] Isi form profil:
    - Nama Lengkap     (WAJIB)
    - NIM              (WAJIB — khusus freelancer)
    - Fakultas         (WAJIB — khusus freelancer)
    - Foto Profil      (opsional)
    - Bio, Lokasi      (opsional)
    - Skills, Headline (opsional)
    ↓
[Backend] Validasi → jika semua field wajib terisi:
    UPDATE profiles SET is_profile_complete = 1
    (untuk freelancer: juga buat record wallet jika belum ada)
    ↓
[Frontend] Tampilkan notifikasi "Profil berhasil dilengkapi!"
           Redirect kembali ke halaman yang dituju
```

### 5. Flow Suspend (Super Admin → Freelancer)

```
[Super Admin] Login → buka panel admin → pilih akun freelancer
    ↓
Klik "Suspend Akun" → isi alasan → konfirmasi
    ↓
[Backend] UPDATE users SET is_suspended = 1, suspended_reason = ?, suspended_at = NOW()
          INSERT suspend_logs {target_user_id, admin_id, action='suspend', reason}
    ↓
Freelancer yang disuspend:
  - Tidak bisa login (cek is_suspended setelah OTP valid)
  - Token lama otomatis direvoke (DELETE personal_access_tokens WHERE tokenable_id = user_id)
  - Muncul pesan saat mencoba login: "Akun Anda telah disuspend: [alasan]"
```

### 6. Flow Gig Lifecycle + Escrow

```
[Client] Buat Gig (wajib is_profile_complete = 1) → status: open
    ↓
[Freelancer] Kirim Proposal (wajib is_profile_complete = 1, tidak suspended)
    ↓
[Client] Terima Proposal + pilih metode bayar
    ↓ Transfer / E-Wallet
        Escrow dibuat: awaiting_payment
        Client deposit → Escrow: holding
        Freelancer kerjakan gig
        Client konfirmasi selesai → Escrow: released → settled
        Dana masuk wallet freelancer
    ↓ Cash
        Escrow dibuat langsung: holding
        Freelancer kerjakan gig
        Bayar langsung di tempat
        Client konfirmasi → Escrow: released
        Wallet freelancer TIDAK bertambah
```

---

## D. Kelengkapan Profil — Detail

### Freelancer (Sika)

| Field            | Status    | Catatan                              |
| ---------------- | --------- | ------------------------------------ |
| Nama Lengkap     | **WAJIB** | Diisi saat pertama kali setup profil |
| NIM              | **WAJIB** | Nomor Induk Mahasiswa                |
| Fakultas         | **WAJIB** | Nama fakultas                        |
| Foto Profil      | opsional  | Bisa diisi kapan saja                |
| Bio              | opsional  |                                      |
| Lokasi           | opsional  |                                      |
| Skills           | opsional  |                                      |
| Headline         | opsional  |                                      |
| Experience Level | opsional  |                                      |
| Portfolio URL    | opsional  |                                      |

`is_profile_complete = 1` jika: **name + nim + faculty** semua tidak NULL dan tidak kosong.

### Client (Juragan)

| Field                          | Status    | Catatan |
| ------------------------------ | --------- | ------- |
| Nama Lengkap                   | **WAJIB** |         |
| Foto Profil                    | opsional  |         |
| Bio, Lokasi, Company, Industry | opsional  |         |

`is_profile_complete = 1` jika: **name** tidak NULL dan tidak kosong.

---

## E. Glossary

### Status Gig

| Status        | Arti              | Yang Bisa Ubah                |
| ------------- | ----------------- | ----------------------------- |
| `open`        | Menerima proposal | System saat dibuat            |
| `in_progress` | Sedang dikerjakan | System saat proposal diterima |
| `completed`   | Selesai           | Client                        |
| `cancelled`   | Dibatalkan        | Client                        |

### Status Proposal

| Status      | Arti     | Yang Bisa Ubah |
| ----------- | -------- | -------------- |
| `pending`   | Menunggu | System         |
| `accepted`  | Diterima | Client         |
| `rejected`  | Ditolak  | Client         |
| `withdrawn` | Ditarik  | Freelancer     |

### Status Escrow

| Status             | Arti                               |
| ------------------ | ---------------------------------- |
| `awaiting_payment` | Menunggu deposit client (non-cash) |
| `holding`          | Dana di-hold / cash dikonfirmasi   |
| `released`         | Client konfirmasi gig selesai      |
| `settled`          | Dana masuk wallet freelancer       |
| `refunded`         | Dana dikembalikan ke client        |
| `disputed`         | Ada komplain (post-MVP)            |

---

## F. Distribusi Fitur Per Anggota

| Anggota   | Fokus                                              | Layer                                                        |
| --------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Anggota 1 | Landing Page + Komponen UI (termasuk popup profil) | `apps/landing`, `apps/web/src/components/ui`                 |
| Anggota 2 | Auth OTP + CRUD Gig + Guard profil                 | `apps/web/src/pages/auth`, `apps/web/src/pages/gigs`         |
| Anggota 3 | Proposal + Escrow/Payment + Profil + Dashboard     | `apps/web/src/pages/proposals`, `apps/web/src/pages/profile` |
| Anggota 4 | Backend API + OTP + Guard + Escrow + Suspend       | `apps/api` (Laravel)                                         |

---

## G. Seed Data

### Kategori (7)

```
tugas | belanja | antar-jemput | riset | cod-antri | jasa | lainnya
```

### Akun Dummy

| Email                        | Role        | Profil                         | Keterangan                      |
| ---------------------------- | ----------- | ------------------------------ | ------------------------------- |
| `admin@sikagig.com`          | super_admin | lengkap                        | —                               |
| `juragan@example.com`        | client      | lengkap                        | Bisa buat gig                   |
| `juragan2@example.com`       | client      | **belum lengkap**              | Kena popup jika coba buat gig   |
| `sika@example.com`           | freelancer  | lengkap (nim+faculty ada)      | Bisa ambil gig                  |
| `sika2@example.com`          | freelancer  | **belum lengkap** (nim kosong) | Kena popup jika coba ambil gig  |
| `sika.suspended@example.com` | freelancer  | lengkap                        | **Disuspend**, tidak bisa login |

OTP Testing: `123456` untuk `juragan@example.com`, `234567` untuk `sika@example.com`

---

**Next**: Lihat `plan.md` untuk roadmap & pembagian modul.
