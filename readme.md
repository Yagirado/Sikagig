<p align="center">
  <h1 align="center">📱 SIKAGIG</h1>
  <p align="center"><strong>Platform Gig Lokal</strong></p>
  <p align="center">
    Platform yang mempertemukan pengguna yang membutuhkan bantuan dengan pengguna yang siap mengerjakan.<br>
    Satu akun <code>user</code> dapat membuat gig maupun mengirim proposal untuk gig milik pengguna lain.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 13">
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL 8">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/pnpm-11-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm 11">
  <img src="https://github.com/Yagirado/Sikagig/actions/workflows/ci.yml/badge.svg?branch=master" alt="CI Status">
</p>

---

## Deskripsi Singkat

SIKAGIG adalah platform gig lokal berbasis web yang membantu pengguna menemukan bantuan atau menawarkan jasa dalam satu ekosistem. Pengguna dapat membuat gig, mengirim proposal untuk gig pengguna lain, dan menyelesaikan transaksi melalui mekanisme escrow.

Proyek ini dibangun sebagai monorepo pnpm yang terdiri dari landing page publik, web app, dan REST API Laravel. Rincian spesifikasi MVP, roadmap, dan aturan bisnis tersedia di `docs/plan`.

---

## Anggota dan Modul

| Anggota | Modul |
| --- | --- |
| Nugi | Auth OTP, Explore, dan Chat |
| Nando | Escrow, Wallet, Notifikasi, Homepage, dan Admin |
| Ray | CRUD Gig dan Proposal |
| Yasmin | Profil, Onboarding, Aktivitas, dan komponen UI |

Pembagian branch dan dependensi antar modul dijelaskan di [docs/plan/team-workflow.md](docs/plan/team-workflow.md).

---

## Fitur

### MVP

- Login dan registrasi dengan email + OTP.
- Role `user` untuk pengguna umum dan `super_admin` untuk administrasi.
- Profil pengguna dengan guard kelengkapan profil sebelum membuat atau mengambil gig.
- CRUD gig, kategori, dan proposal.
- Escrow dengan pembayaran transfer bank, e-wallet, atau cash.
- Wallet dan notifikasi in-app.
- Chat antara pemberi kerja dan pengerjaan setelah proposal diterima.
- Suspend dan unsuspend akun oleh super admin dengan audit trail.

### Post-MVP

- Rating dan ulasan.
- Notifikasi real-time menggunakan Laravel Echo atau Reverb.
- Dispute atau komplain transaksi.

Rincian aturan bisnis dan state machine tersedia di [docs/plan/foundation.md](docs/plan/foundation.md).

---

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Landing | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Web App | React 19, JavaScript, Vite, Tailwind CSS 4 |
| Backend | Laravel 13, PHP 8.3 |
| Database | MySQL |
| Monorepo | pnpm workspace |
| CI | GitHub Actions |
| Deploy Landing | Vercel |

---

## Struktur Monorepo

```text
sikagig/
|- apps/
|  |- landing/             Landing page publik React + Vite
|  |  |- src/pages/        Home, Privacy, Terms
|  |  `- vercel.json       SPA rewrite untuk deployment Vercel
|  |- web/                 Web app React + Vite
|  `- api/                 REST API Laravel
|     `- database/migrations/ Schema database Laravel
|- docs/plan/              Spesifikasi, roadmap, ERD, dan workflow tim
|- .github/workflows/      Konfigurasi CI GitHub Actions
|- package.json            Script root monorepo
`- pnpm-workspace.yaml
```

---

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 22+
- pnpm 11.10+
- PHP 8.3+
- Composer
- MySQL 8+

### Instalasi Frontend

```bash
pnpm install
pnpm dev:landing
```

Landing berjalan di `http://localhost:5173`. Untuk menjalankan web app pada terminal lain:

```bash
pnpm dev:web
```

Web app berjalan di `http://localhost:5174`.

### Instalasi Database dan API

```bash
# Dari root monorepo
mysql -u root -p -e "CREATE DATABASE sikagig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

cd apps/api
cp .env.example .env
# Ubah DB_CONNECTION menjadi mysql dan isi DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD.
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

Gunakan migration Laravel sebagai sumber skema. `apps/api/database/sikagig.sql` adalah dump lama dan tidak mencakup skema aplikasi saat ini.

Atur koneksi database dan mail driver pada `apps/api/.env`. API Laravel berjalan di `http://localhost:8000`.

Saat integrasi web app dimulai, buat `apps/web/.env` dengan nilai berikut:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Perintah Validasi

```bash
# Lint semua workspace
pnpm lint

# Build semua workspace JavaScript/TypeScript
pnpm build

# Build landing saja
pnpm --filter landing build

# Test Laravel
cd apps/api
composer test
```

---

## CI GitHub Actions

Workflow [ci.yml](.github/workflows/ci.yml) berjalan saat push atau pull request ke branch `master` dan `develop`. CI menjalankan lint, build landing, build web app, serta test Laravel.

---

## Deploy Landing ke Vercel

Hubungkan repository ke project Vercel untuk mengaktifkan continuous deployment: push ke branch non-production membuat Preview Deployment, sedangkan push ke Production Branch membuat Production Deployment.

Gunakan konfigurasi berikut saat membuat project Vercel:

| Pengaturan | Nilai |
| --- | --- |
| Root Directory | `apps/landing` |
| Framework Preset | Vite |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

File [apps/landing/vercel.json](apps/landing/vercel.json) mengarahkan semua route ke `index.html`, sehingga route SPA seperti `/privacy` dan `/terms` tetap dapat dibuka langsung setelah deployment.

## Deploy Web App ke Vercel

Buat project Vercel dari repository ini dengan pengaturan berikut:

| Pengaturan | Nilai |
| --- | --- |
| Root Directory | `apps/web` |
| Framework Preset | Vite |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` |
| Output Directory | `dist` |

File [apps/web/vercel.json](apps/web/vercel.json) menyediakan fallback SPA untuk route React Router dan proxy `/api/*` serta `/storage/*` ke `https://api.sikagig.me`.

Isi `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, dan `VITE_REVERB_SCHEME` pada Environment Variables Vercel sesuai server Reverb production. `VITE_REVERB_APP_KEY` harus sama dengan `REVERB_APP_KEY` API; jangan pernah memasukkan `REVERB_APP_SECRET` ke frontend. Nilai `VITE_*` tertanam saat build sehingga deployment perlu dibangun ulang setelah nilainya diubah.

## Deploy API

Web app memanggil API melalui path relatif `/api/*` dan memakai session cookie Laravel. Rewrite Vercel meneruskan request API dan storage melalui origin web. Atur `APP_URL=https://api.sikagig.me`, `FRONTEND_URL` ke domain web Vercel yang stabil, dan `GOOGLE_REDIRECT_URI` ke `${FRONTEND_URL}/api/auth/google/callback`. Daftarkan URI callback itu persis di Google OAuth Client. Frontend URL juga dipakai Midtrans untuk kembali ke halaman web. Biarkan cookie session `Secure=true`, `SameSite=lax`, dan domain kosong/null agar request yang melewati proxy memakai cookie origin web.

Untuk chat, set `REVERB_HOST=api.sikagig.me`, `REVERB_PORT=443`, `REVERB_SCHEME=https`, dan `REVERB_ALLOWED_ORIGINS` ke hostname web Vercel tanpa skema. Jalankan Reverb di port internal `8080` dan aktifkan WebSocket proxy pada host publik sesuai [panduan runtime API](apps/api/docs/production-runtime.md). Isi `B2_*` pada environment API production dengan kredensial bucket yang benar; semua fitur upload menyimpan file ke disk `b2`.

Pada setiap release API baru, jalankan `php artisan storage:link` dari `apps/api` agar file pada disk `public` bisa diakses melalui `/storage/*`. Pastikan `storage/app/public` berada pada volume persisten atau salin media lama ke B2; symlink saja tidak mempertahankan file saat release lama dihapus.

Untuk upload foto, portofolio, bukti pekerjaan, dan lampiran chat, isi variabel `B2_*` pada `apps/api/.env.production.example` dengan kredensial bucket Backblaze B2. Tanpa konfigurasi itu, endpoint upload yang menyimpan ke disk `b2` akan gagal.

---

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/plan/foundation.md](docs/plan/foundation.md) | Spesifikasi MVP, aturan bisnis, flow, dan glossary |
| [docs/plan/plan.md](docs/plan/plan.md) | Roadmap, pembagian modul, endpoint, dan risiko |
| [docs/plan/team-workflow.md](docs/plan/team-workflow.md) | Setup tim, Git workflow, dan konvensi kode |
| [docs/plan/erd.md](docs/plan/erd.md) | ERD, tabel, relasi, dan business rules database |
| [docs/plan/chat-system-plan.md](docs/plan/chat-system-plan.md) | Rencana sistem chat |
