# Team Workflow — SIKAGIG

> Dokumen kerja tim untuk dipakai saat development.
> **Stack**: React.js + JavaScript (frontend) | Laravel + MySQL (backend)
> **Auth**: Email + OTP saja — tidak ada password, tidak ada Google OAuth
> **Role**: `user` (bisa posting & mengerjakan gig) | `super_admin`
> Referensi utama: `docs/plan/plan.md` dan `docs/plan/foundation.md`

---

## 1. Kondisi Project Saat Ini

- Monorepo sudah berjalan
- Laravel sudah terinstall di `apps/api`
- File `apps/database/sikagig.sql` sudah tersedia — **import ini dulu sebelum mulai**
- Workflow branch belum distandardkan sepenuhnya
- `develop` adalah branch integrasi utama

**Aman dikerjakan sekarang:**

- Komponen UI (Yasmin), shell halaman `.jsx`, landing page, Axios instance + mock data

**Tunggu dulu:**

- Integrasi Axios ke endpoint nyata, validasi error dari API, escrow flow

---

## 2. Setup Awal Wajib

### Database

```bash
# 1. Buat database baru di MySQL
mysql -u root -p -e "CREATE DATABASE sikagig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import schema + seed data
mysql -u root -p sikagig < apps/database/sikagig.sql
```

### Backend (Laravel)

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate

# Edit .env:
#   DB_CONNECTION=mysql
#   DB_DATABASE=sikagig
#   DB_USERNAME=root
#   DB_PASSWORD=
#   MAIL_MAILER=smtp  (Mailtrap untuk dev)

php artisan migrate   # Jika pakai migration files
php artisan db:seed   # Jika pakai seeder
php artisan serve     # http://localhost:8000
```

### Frontend

```bash
# Dari root monorepo
pnpm install
cp apps/web/.env.example apps/web/.env
# VITE_API_BASE_URL=http://localhost:8000/api
cp apps/landing/.env.example apps/landing/.env
pnpm dev:landing   # http://localhost:5173
pnpm dev:web       # http://localhost:5174
```

---

## 3. Workflow Git

### Branch Utama

- `main` = branch final / rilis
- `develop` = branch integrasi

### Format Branch Feature

```
feat/nugi-auth-otp
feat/nugi-explore
feat/nugi-chat
feat/nando-escrow
feat/nando-wallet
feat/nando-notifikasi
feat/nando-homepage
feat/nando-admin
feat/ray-gig-crud
feat/ray-proposal
feat/yasmin-profil
feat/yasmin-onboarding
feat/yasmin-aktivitas
feat/yasmin-ui-components
```

### Alur

1. Buat branch dari `develop`
2. Kerja hanya pada scope branch masing-masing
3. PR → review minimal 1 anggota → merge ke `develop`
4. `develop` → `main` hanya saat stabil
5. Tidak ada push langsung ke `main`

---

## 4. Pembagian Modul Tim

| Anggota    | Modul                                         | Branch                                                                                  | Prioritas                       |
| ---------- | --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| **Nugi**   | Auth OTP + Explore + Chat                     | `feat/nugi-auth-otp`, `feat/nugi-explore`, `feat/nugi-chat`                             | Auth duluan — semua butuh token |
| **Nando**  | Escrow + Wallet + Notif + Homepage + Admin    | `feat/nando-escrow`, `feat/nando-notifikasi`, `feat/nando-homepage`, `feat/nando-admin` | Setelah Ray selesai proposal    |
| **Ray**    | CRUD Gig + Proposal                           | `feat/ray-gig-crud`, `feat/ray-proposal`                                                | Mulai setelah auth Nugi siap    |
| **Yasmin** | Profil + Onboarding + Aktivitas + Komponen UI | `feat/yasmin-ui-components`, `feat/yasmin-profil`, `feat/yasmin-aktivitas`              | **UI sprint 1 duluan**          |

---

## 5. Dependency Antar Modul

```
Yasmin: komponen UI dasar selesai (sprint 1, hari 1-10)
    ↓
Nugi: auth OTP endpoint + halaman login (hari 6-12)
    ↓ semua butuh token dari sini
    ↓
Ray: gig + proposal endpoint (hari 13-20)
    ↓ saat proposal accepted → auto-buat escrow + conversation
    ↓
Nando: escrow + wallet + notif (hari 21-27)
    ↓
Yasmin: aktivitas + dashboard — gabungkan data dari Ray + Nando (hari 17-25)
Nugi: explore (pakai GET /api/gigs Ray) + chat (conversation dari Ray)
```

---

## 6. Yang Aman Dikerjakan Sekarang

### Yasmin (mulai hari 1)

- Semua komponen UI dasar — tidak bergantung backend
- `Button.jsx`, `Input.jsx`, `Card.jsx`, `Badge.jsx`, `Modal.jsx`, `Spinner.jsx`
- `EmptyState.jsx`, `Skeleton.jsx`, `Toast.jsx`
- `Navbar.jsx`, `AppLayout.jsx`, `Footer.jsx`
- Shell halaman onboarding (tampilan + form kosong)

### Nugi (mulai hari 1)

- Setup React Router di `apps/web/src/routes/`
- Buat `services/api.js` — Axios instance + interceptor
- Shell `EmailPage.jsx`, `OtpPage.jsx` (tampilan + state lokal)
- Buat `AuthContext.jsx` — state awal, belum integrasi API
- Shell `ExplorePage.jsx` dengan data hardcode

### Ray (mulai hari 1, integrasi setelah auth siap)

- Shell `GigDetailPage.jsx`, `CreateGigPage.jsx`, `GigListPage.jsx`
- Shell `SendProposalPage.jsx`, `IncomingProposalsPage.jsx`
- Buat `ProfileIncompleteModal.jsx` (tampilan saja)

### Nando (mulai hari 1, integrasi setelah proposal siap)

- Shell `EscrowStatusPage.jsx` (step indicator: Pending → Held → Released)
- Shell `WalletPage.jsx` dengan balance card hardcode
- Shell `NotifPanel.jsx` dropdown bell
- Shell `HomePage.jsx` dengan feed dummy

---

## 7. Konvensi Kode

### Frontend

- Semua komponen: `.jsx`, nama `PascalCase`
- Service, hook, util: `.js`, nama `camelCase`
- Gunakan functional component + hooks
- State global via `AuthContext`, bukan props drilling > 2 level
- Import komponen UI dari `components/ui/` — jangan buat ulang

### Backend (Laravel)

- Tabel & kolom: `snake_case`
- Gunakan Form Request untuk validasi
- Gunakan Resource untuk format JSON response
- Jangan return Eloquent model langsung
- Pisahkan controller (HTTP) ≠ logic bisnis di model

### Perbedaan Role dari Konteks (bukan dari kolom role)

```
Pemberi kerja  → user yang client_id di tabel gigs
Pengerjaan     → user yang user_id di tabel proposals
```

Tidak ada `if ($user->role === 'freelancer')` — cek berdasarkan relasi data.

---

## 8. Escrow Logic — Rangkuman

```
Saat proposal diterima (ProposalController@accept):
  1. UPDATE proposals SET status='accepted'
  2. UPDATE proposals (lain, gig sama) SET status='rejected'
  3. UPDATE gigs SET status='in_progress'
  4. INSERT escrows:
       - Non-cash: status='awaiting_payment'
       - Cash:     status='holding', held_at=NOW()
  5. INSERT/FIND conversations (firstOrCreate by proposal_id)
  6. INSERT notifications ke worker (proposal_accepted)
  7. INSERT notifications ke workers lain yang ditolak

Saat client deposit (non-cash):
  UPDATE escrows SET status='holding', held_at=NOW()

Saat client release:
  UPDATE escrows SET status='released', released_at=NOW()
  Jika non-cash → UPDATE escrows SET status='settled', settled_at=NOW()
                  UPDATE wallets SET balance = balance + escrow.amount
  Jika cash     → selesai di released (wallet tidak berubah)
  INSERT notifications ke worker (escrow_released)
```

---

## 9. Cara Pakai `sikagig.sql`

File `apps/database/sikagig.sql` berisi:

- Schema lengkap semua tabel + index + FK
- Seed data: 7 kategori, 5 user dummy, profil, wallet, gig, proposal, escrow, payment, suspend log

Akun dummy untuk testing OTP (`is_used=0`, belum expired):

| Email                 | OTP    | Keterangan                                          |
| --------------------- | ------ | --------------------------------------------------- |
| `budi@example.com`    | 123456 | Profil lengkap + nim + faculty → bisa semua aksi    |
| `rina@example.com`    | 234567 | Profil lengkap, nim kosong → hanya bisa posting gig |
| `newuser@example.com` | 345678 | Register baru                                       |

---

## 10. Definition of Done Per Branch

- Scope branch jelas, tidak melebar ke file orang lain
- Tidak ada `console.log` debug
- Tidak ada error merah di browser/terminal
- Form punya basic client-side validation
- Sudah sync dengan `develop` terbaru
- Loading + error + empty state minimal ada placeholder
- Di-review minimal satu anggota lain sebelum merge

---

## 11. Checklist Sebelum Merge

- [ ] Branch dari `develop`, sudah pull terbaru
- [ ] File di luar scope tidak tersentuh
- [ ] Test manual fitur yang disentuh
- [ ] Tidak ada error console
- [ ] Commit message deskriptif (`feat:`, `fix:`, `ui:`)
- [ ] Merge ke `develop`, bukan `main`
