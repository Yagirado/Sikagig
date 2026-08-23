# Team Workflow — SIKAGIG

> Dokumen kerja tim untuk dipakai saat development.
> **Stack**: React.js + JavaScript (frontend) | Laravel + MySQL (backend)
> **Fitur tambahan**: Google OAuth, Escrow Payment, Cash / Bayar di Tempat
> Referensi utama: `docs/plan/plan.md` dan `docs/plan/foundation.md`

---

## 1. Kondisi Project Saat Ini

- Monorepo sudah berjalan
- Laravel sudah terinstall di `apps/api`
- File `apps/database/sikagig.sql` sudah tersedia — **import ini dulu sebelum mulai**
- Workflow branch belum distandardkan sepenuhnya
- `develop` adalah branch integrasi utama

**Aman dikerjakan sekarang:**

- Komponen UI, shell halaman `.jsx`, landing page, Axios instance + mock data

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
# Edit .env: DB_DATABASE=sikagig, DB_USERNAME, DB_PASSWORD
# Edit .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
php artisan migrate        # Jika pakai migration, atau skip jika pakai .sql langsung
php artisan db:seed        # Jika migration + seeder (bukan .sql langsung)
php artisan serve          # http://localhost:8000
```

### Frontend

```bash
# Dari root monorepo
pnpm install
cp apps/web/.env.example apps/web/.env      # VITE_API_BASE_URL=http://localhost:8000/api
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
feat-landing-page
feat-ui-components
feat-auth-flow
feat-google-oauth
feat-gig-crud
feat-proposal-flow
feat-escrow-payment
feat-profile-page
feat-dashboard
feat-api-auth
feat-api-google-oauth
feat-api-gig
feat-api-proposal
feat-api-escrow
```

### Alur

1. Buat branch dari `develop`
2. Kerja hanya pada scope branch
3. PR → review → merge ke `develop`
4. `develop` → `main` hanya saat stabil
5. Tidak ada push langsung ke `main`

---

## 4. Pembagian Modul Tim

| Anggota   | Modul                                 | Branch                                                                  | Status                   |
| --------- | ------------------------------------- | ----------------------------------------------------------------------- | ------------------------ |
| Anggota 1 | Landing + UI                          | `feat-landing-page`, `feat-ui-components`                               | Mulai sekarang           |
| Anggota 2 | Auth (email + Google) + Gig           | `feat-auth-flow`, `feat-google-oauth`, `feat-gig-crud`                  | Shell dulu, tunggu API   |
| Anggota 3 | Proposal + Escrow/Payment + Dashboard | `feat-proposal-flow`, `feat-escrow-payment`, `feat-dashboard`           | Tunggu proposal API siap |
| Anggota 4 | Backend + DB + Escrow Logic           | `feat-api-auth`, `feat-api-gig`, `feat-api-proposal`, `feat-api-escrow` | **Prioritas pertama**    |

---

## 5. Dependency Antar Modul

```
1. DB ready (import sikagig.sql)
2. Anggota 4: endpoint auth siap (hari 9)
3. Anggota 2: integrasi auth → mulai hari 10
4. Anggota 4: endpoint gig + proposal siap (hari 19)
5. Anggota 3: mulai integrasi proposal (hari 17, mock dulu)
6. Anggota 4: endpoint escrow siap (hari 23)
7. Anggota 3: integrasi escrow/payment
```

---

## 6. Apa Yang Aman Dikerjakan Sekarang

### Anggota 1

- Semua section landing (tidak bergantung backend)
- Komponen UI: `Button.jsx`, `Input.jsx`, `Card.jsx`, `Badge.jsx`, `Modal.jsx`, `StatusBadge.jsx`
- Layout: `Navbar.jsx`, `Footer.jsx`, `AppLayout.jsx`

### Anggota 2

- Setup React Router di `apps/web/src/routes/`
- Buat `services/api.js` — Axios instance + interceptor
- Shell `LoginPage.jsx` (tampilan + tombol Google), `RegisterPage.jsx`
- Shell `GigListPage.jsx` dengan data hardcode
- Buat `AuthContext.jsx` — state awal tanpa integrasi API

### Anggota 3

- Shell `SendProposalPage.jsx`, `IncomingProposalsPage.jsx`, `MyProposalsPage.jsx`
- Shell `EscrowStatusPage.jsx` (tampilan status escrow + badge metode bayar)
- Shell `ClientDashboard.jsx`, `FreelancerDashboard.jsx`
- Buat komponen `PaymentMethodSelector.jsx` (radio: Transfer / E-Wallet / Cash)

### Anggota 4

- Import `sikagig.sql` → verifikasi semua tabel terbuat
- Setup Sanctum di `config/sanctum.php`
- Setup CORS di `config/cors.php` (allow `localhost:5174`)
- Install Socialite: `composer require laravel/socialite`
- Buat `AuthController` — register, login, logout, me
- Buat `GoogleAuthController` — redirect + callback

---

## 7. Konvensi Kode

### Frontend

- Semua komponen: `.jsx`, nama `PascalCase`
- Service, hook, util: `.js`, nama `camelCase`
- Gunakan functional component + hooks
- State global via `AuthContext`, bukan props drilling

### Backend (Laravel)

- Tabel & kolom: `snake_case`
- Gunakan Form Request untuk validasi
- Gunakan Resource untuk format JSON response
- Jangan return Eloquent model langsung
- Pisahkan controller (HTTP) ≠ logic bisnis di model

### Escrow Logic

- Saat `proposal.status` → `accepted`:
  - Buat record `escrows` dengan `status = awaiting_payment` (non-cash) atau `holding` (cash)
  - Update `gig.status` → `in_progress`
- Saat client deposit berhasil → update `escrows.status = holding`, isi `held_at`
- Saat client release → update `escrows.status = released`, isi `released_at`
- Saat settlement (non-cash) → tambah `wallets.balance`, update `escrows.status = settled`, isi `settled_at`
- **Cash**: skip deposit + settlement wallet, langsung ke `holding` → `released`

---

## 8. Setup Google OAuth

### Di Google Cloud Console

1. Buat project baru (atau pakai yang ada)
2. Aktifkan "Google+ API" / "Google Identity"
3. Buat OAuth 2.0 Client ID
4. Authorized redirect URIs:
   - Development: `http://localhost:8000/api/auth/google/callback`
   - Production: `https://api.sikagig.id/api/auth/google/callback`

### Di Laravel `.env`

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### Di `config/services.php`

```php
'google' => [
    'client_id'     => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect'      => env('GOOGLE_REDIRECT_URI'),
],
```

### Flow Frontend

```js
// Saat user klik "Login dengan Google"
window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;

// Di GoogleCallback.jsx — tangkap ?token= dari URL setelah redirect
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
if (token) {
  localStorage.setItem("token", token);
  // redirect ke dashboard
}
```

---

## 9. Cara Pakai `sikagig.sql`

File `apps/database/sikagig.sql` berisi:

- Schema lengkap semua tabel (termasuk index dan FK)
- Seed data: 7 kategori, 4 user dummy, profile, wallet, gig, proposal, escrow, payment

Akun dummy (password semua: `password`):
| Email | Role |
|-------|------|
| `juragan@example.com` | client |
| `sika@example.com` | freelancer |
| `juragan2@example.com` | client |
| `sika2@example.com` | freelancer |

---

## 10. Definition of Done Per Branch

- Scope branch jelas, tidak melebar
- Tidak ada `console.log` debug
- Tidak ada error merah di browser/terminal
- Form punya basic client-side validation
- Sudah sync dengan `develop` terbaru
- Loading + error + empty state minimal ada placeholder
- Di-review minimal satu anggota lain

---

## 11. Checklist Sebelum Merge

- [ ] Branch dari `develop`, sudah pull terbaru
- [ ] File di luar scope tidak tersentuh
- [ ] Test manual fitur yang disentuh
- [ ] Tidak ada error console
- [ ] Commit message deskriptif
- [ ] Merge ke `develop`, bukan `main`
