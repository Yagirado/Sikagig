# Sikagig — Monorepo Structure and Development Roadmap

Dokumen ini menjelaskan struktur folder final project **Sikagig**, pembagian tugas tim, desain database, dan urutan pengerjaan yang disarankan.

Sikagig adalah platform gig lokal yang mempertemukan **juragan** (yang butuh bantuan) dengan **sika** (yang siap mengerjakan). Mulai dari joki tugas, beliin barang, tebengan, sampai order jasa freelance.

---

# 1. Tim dan Pembagian Tugas

Kelompok terdiri dari **4 orang**. Pembagian berdasarkan layer aplikasi agar tidak saling tabrakan.

## Anggota 1 — Landing Page & UI/UX

**Tanggung jawab:**

- Semua halaman di `apps/landing`
- Desain komponen UI di `apps/web` (button, input, card, modal, badge)
- Responsivitas mobile di kedua app
- Konsistensi warna, font, dan spacing

**File utama:**

```
apps/landing/src/
apps/web/src/components/ui/
apps/web/src/components/layout/
```

**Deliverable:**

- Landing page selesai dan responsive
- Komponen UI dasar tersedia untuk anggota lain

---

## Anggota 2 — Web App Frontend (Auth + Gig)

**Tanggung jawab:**

- Halaman login, register, onboarding
- Halaman daftar gig, detail gig, buat gig, edit gig
- React Router, protected route, layout app
- Integrasi API untuk auth dan gig menggunakan Axios + TanStack Query

**File utama:**

```
apps/web/src/pages/auth/
apps/web/src/pages/onboarding/
apps/web/src/pages/gigs/
apps/web/src/routes/
apps/web/src/services/
apps/web/src/hooks/
```

**Deliverable:**

- Alur register → onboarding → dashboard berjalan
- CRUD gig berfungsi dari frontend

---

## Anggota 3 — Web App Frontend (Proposal + Profile)

**Tanggung jawab:**

- Halaman proposal (kirim, lihat daftar, terima/tolak)
- Halaman profil freelancer dan client
- Halaman dashboard (ringkasan gig aktif, proposal masuk)
- Integrasi API untuk proposal dan profil

**File utama:**

```
apps/web/src/pages/proposals/
apps/web/src/pages/dashboard/
apps/web/src/pages/profile/
apps/web/src/components/proposals/
apps/web/src/components/profile/
```

**Deliverable:**

- Proposal flow berjalan (kirim → terima/tolak)
- Profil bisa dilihat dan diedit

---

## Anggota 4 — Backend API & Database

**Tanggung jawab:**

- Setup Express, Prisma, PostgreSQL
- Semua endpoint REST API
- JWT authentication
- Middleware (auth, role, error, validasi)
- Database schema dan migrasi
- Seed data untuk development

**File utama:**

```
apps/api/src/
apps/api/prisma/
```

**Deliverable:**

- Semua endpoint yang dibutuhkan anggota 2 dan 3 sudah tersedia
- Database ter-migrate dan bisa di-seed

---

## Koordinasi Tim

```
Anggota 4 → Bikin endpoint dulu, kasih tahu Anggota 2 & 3
Anggota 1 → Bikin komponen UI, kasih tahu Anggota 2 & 3 bisa pakai
Anggota 2 & 3 → Kerja paralel setelah endpoint dan komponen tersedia
```

**Urutan prioritas:**

```
1. Anggota 4: health endpoint + auth endpoint (register/login)
2. Anggota 1: komponen UI dasar + landing page
3. Anggota 2: halaman auth + gig (pakai endpoint anggota 4)
4. Anggota 3: halaman proposal + profil (pakai endpoint anggota 4)
```

---

# 2. Desain Database

Database menggunakan **PostgreSQL** dengan **Prisma ORM**.

## Schema Prisma

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUM ───────────────────────────────────────────────

enum Role {
  CLIENT
  FREELANCER
}

enum GigStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ProposalStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  EXPERT
}

// ─── USER ────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  role          Role
  isVerified    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       Profile?
  gigsPosted    Gig[]         @relation("ClientGigs")
  proposals     Proposal[]    @relation("FreelancerProposals")
  refreshTokens RefreshToken[]
}

// ─── PROFILE ─────────────────────────────────────────────

model Profile {
  id              String          @id @default(cuid())
  userId          String          @unique
  name            String
  avatarUrl       String?
  bio             String?
  location        String?

  // Client only
  company         String?
  industry        String?

  // Freelancer only
  headline        String?
  skills          String[]
  experienceLevel ExperienceLevel?
  portfolioUrl    String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── CATEGORY ────────────────────────────────────────────

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique

  gigs  Gig[]
}

// ─── GIG ─────────────────────────────────────────────────

model Gig {
  id           String    @id @default(cuid())
  clientId     String
  categoryId   String
  title        String
  description  String
  budget       Int
  deadline     DateTime?
  slots        Int       @default(1)
  isOnsite     Boolean   @default(false)
  location     String?
  status       GigStatus @default(OPEN)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  client       User      @relation("ClientGigs", fields: [clientId], references: [id], onDelete: Cascade)
  category     Category  @relation(fields: [categoryId], references: [id])
  proposals    Proposal[]
}

// ─── PROPOSAL ────────────────────────────────────────────

model Proposal {
  id           String         @id @default(cuid())
  gigId        String
  freelancerId String
  coverLetter  String
  bidAmount    Int
  status       ProposalStatus @default(PENDING)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  gig          Gig            @relation(fields: [gigId], references: [id], onDelete: Cascade)
  freelancer   User           @relation("FreelancerProposals", fields: [freelancerId], references: [id], onDelete: Cascade)

  @@unique([gigId, freelancerId])
}

// ─── REFRESH TOKEN ───────────────────────────────────────

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Penjelasan Tabel

### User

Tabel utama untuk semua pengguna. Role `CLIENT` adalah juragan yang posting gig, role `FREELANCER` adalah sika yang mengambil gig.

### Profile

Data tambahan user setelah onboarding. Dipisah dari `User` agar tabel auth tetap ringan. Field `skills`, `headline`, `portfolioUrl` hanya relevan untuk freelancer. Field `company`, `industry` hanya untuk client.

### Category

Kategori gig seperti `tugas`, `belanja`, `antar-jemput`, `riset`, dll. Dikelola admin atau di-seed langsung.

### Gig

Postingan pekerjaan yang dibuat client. `slots` menentukan berapa sika yang bisa diterima untuk satu gig. `isOnsite` membedakan gig fisik lokal vs remote. Status berurutan: `OPEN` → `IN_PROGRESS` → `COMPLETED`.

### Proposal

Lamaran dari freelancer ke sebuah gig. Satu freelancer hanya bisa melamar satu kali per gig (constraint `@@unique`). Client bisa terima atau tolak.

### RefreshToken

Menyimpan refresh token JWT untuk sistem autentikasi stateless. Token lama otomatis terhapus saat user logout.

---

## Seed Data Awal

```typescript
// apps/api/prisma/seed.ts

const categories = [
  { name: "Tugas & Akademik", slug: "tugas" },
  { name: "Belanja & Titip", slug: "belanja" },
  { name: "Antar & Jemput", slug: "antar-jemput" },
  { name: "Riset & Survei", slug: "riset" },
  { name: "COD & Antri", slug: "cod-antri" },
  { name: "Jasa Freelance", slug: "jasa" },
  { name: "Lainnya", slug: "lainnya" },
];
```

---

# 3. Arsitektur Project

```text
sikagig/
├── apps/
│   ├── landing/   → https://sikagig.id
│   ├── web/       → https://app.sikagig.id
│   └── api/       → https://api.sikagig.id
├── packages/
├── package.json
└── pnpm-workspace.yaml
```

---

# 4. Teknologi yang Digunakan

## Landing Page

```
React + TypeScript + Vite
Tailwind CSS
React Router
```

## Web App

```
React + TypeScript + Vite
Tailwind CSS
React Router
TanStack Query
React Hook Form + Zod
Axios
Lucide React
```

## Backend API

```
Node.js + Express + TypeScript
PostgreSQL + Prisma ORM
Zod
JWT + bcrypt
```

---

# 5. Struktur Folder Final

```text
sikagig/
├── apps/
│   ├── landing/
│   │   └── src/
│   │       ├── components/
│   │       ├── sections/
│   │       └── pages/
│   │
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   └── layout/
│   │       ├── pages/
│   │       │   ├── auth/
│   │       │   ├── onboarding/
│   │       │   ├── dashboard/
│   │       │   ├── gigs/
│   │       │   └── proposals/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── hooks/
│   │       └── types/
│   │
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── src/
│           ├── controllers/
│           ├── services/
│           ├── routes/
│           ├── middlewares/
│           └── schemas/
│
└── packages/
    ├── types/     → shared TypeScript types
    └── ui/        → shared components (nanti)
```

---

# 6. Urutan Pengerjaan

## Phase 1 — Setup (Semua anggota)

- Monorepo berjalan
- `pnpm dev:landing`, `pnpm dev:web`, `pnpm dev:api` semua OK
- Health endpoint tersedia

## Phase 2 — Landing Page (Anggota 1)

- Semua section landing selesai
- Responsive mobile
- Tombol "Buka App" mengarah ke `app.sikagig.id`

## Phase 3 — Database & Auth (Anggota 4)

- Schema Prisma ter-migrate
- Register, login, logout endpoint
- JWT + refresh token
- Role middleware

## Phase 4 — Web App Auth (Anggota 2)

- Halaman login dan register
- Onboarding client dan freelancer
- Protected route

## Phase 5 — Gig (Anggota 2 + 4)

- Backend: CRUD gig endpoint
- Frontend: list gig, detail gig, buat gig, edit gig

## Phase 6 — Proposal & Profil (Anggota 3 + 4)

- Backend: proposal endpoint
- Frontend: form proposal, daftar proposal, halaman profil

## Phase 7 — Dashboard (Anggota 3)

- Ringkasan gig aktif
- Proposal masuk
- Status overview

## Phase 8 — Messaging (Semua, setelah MVP selesai)

## Phase 9 — Payment & Wallet (Setelah messaging)

---

# 7. API Endpoints

## Auth

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
```

## Gig

```
GET    /api/v1/gigs              → daftar gig (public)
GET    /api/v1/gigs/:id          → detail gig (public)
POST   /api/v1/gigs              → buat gig (client only)
PATCH  /api/v1/gigs/:id          → edit gig (pemilik only)
DELETE /api/v1/gigs/:id          → hapus gig (pemilik only)
```

## Proposal

```
POST   /api/v1/gigs/:gigId/proposals   → kirim proposal (freelancer)
GET    /api/v1/proposals               → daftar proposal milik saya
GET    /api/v1/proposals/:id           → detail proposal
PATCH  /api/v1/proposals/:id/status    → terima/tolak (client)
DELETE /api/v1/proposals/:id           → tarik proposal (freelancer)
```

## Profile

```
GET    /api/v1/profile           → profil saya
PATCH  /api/v1/profile           → update profil
GET    /api/v1/users/:id/profile → profil publik user lain
```

## Category

```
GET    /api/v1/categories        → daftar kategori
```

---

# 8. Environment Variables

## Landing (`apps/landing/.env.example`)

```env
VITE_APP_URL=http://localhost:5174
```

## Web (`apps/web/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_LANDING_URL=http://localhost:5173
```

## API (`apps/api/.env.example`)

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5174
LANDING_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:password@localhost:5432/sikagig

JWT_ACCESS_SECRET=ganti_dengan_secret_aman
JWT_REFRESH_SECRET=ganti_dengan_secret_aman
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

# 9. Development Ports

```
Landing → http://localhost:5173
Web     → http://localhost:5174
API     → http://localhost:5000
```

---

# 10. Aturan Pengembangan

1. Jangan pindah phase sebelum phase sebelumnya selesai.
2. Anggota 4 bikin endpoint dulu sebelum anggota 2 & 3 integrasi.
3. Gunakan TypeScript strict, hindari `any`.
4. Jangan commit `.env` — pakai `.env.example`.
5. Pisahkan controller, service, dan route di backend.
6. Gunakan Zod untuk validasi di frontend dan backend.
7. Payment dan wallet dikerjakan paling akhir.
8. Buat loading, error, dan empty state di setiap halaman.
