# ERD: SIKAGIG — Entity Relationship Diagram

> Database: PostgreSQL | ORM: Prisma
> Seluruh relasi dan field sudah sesuai schema Prisma di `apps/api/prisma/schema.prisma`

---

## Diagram Relasi (Logical)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   User ─────────────── Profile                            │
│    │  1:1 (cascade)       (onboarding data)               │
│    │                                                      │
│    │ 1:N (CLIENT)                                         │
│    ▼                                                      │
│   Gig ──── N:1 ──── Category                              │
│    │                                                      │
│    │ 1:N                                                  │
│    ▼                                                      │
│   Proposal ─── N:1 ─── User (FREELANCER)                  │
│   @@unique([gigId, freelancerId])                         │
│                                                            │
│   User ─────────────── RefreshToken                       │
│         1:N (cascade)                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Tabel Entitas

### User

| Kolom      | Tipe                     | Keterangan          |
| ---------- | ------------------------ | ------------------- |
| id         | String (cuid)            | Primary Key         |
| email      | String (unique)          | Login identifier    |
| password   | String                   | bcrypt hash         |
| role       | Enum(CLIENT, FREELANCER) | Tipe pengguna       |
| isVerified | Boolean                  | Email verified flag |
| createdAt  | DateTime                 |                     |
| updatedAt  | DateTime                 |                     |

### Profile

| Kolom           | Tipe               | Keterangan                   |
| --------------- | ------------------ | ---------------------------- |
| id              | String (cuid)      | Primary Key                  |
| userId          | String (unique FK) | → User.id                    |
| name            | String             | Nama lengkap                 |
| avatarUrl       | String?            | URL foto                     |
| bio             | String?            | Bio singkat                  |
| location        | String?            | Kota/lokasi                  |
| company         | String?            | Client: nama perusahaan      |
| industry        | String?            | Client: industri             |
| headline        | String?            | Freelancer: tagline          |
| skills          | String[]           | Freelancer: daftar skill     |
| experienceLevel | Enum?              | BEGINNER/INTERMEDIATE/EXPERT |
| portfolioUrl    | String?            | Freelancer: portfolio link   |
| createdAt       | DateTime           |                              |
| updatedAt       | DateTime           |                              |

### Category

| Kolom | Tipe            | Keterangan              |
| ----- | --------------- | ----------------------- |
| id    | String (cuid)   | Primary Key             |
| name  | String (unique) | Nama kategori           |
| slug  | String (unique) | URL-friendly identifier |

### Gig

| Kolom       | Tipe            | Keterangan                           |
| ----------- | --------------- | ------------------------------------ |
| id          | String (cuid)   | Primary Key                          |
| clientId    | String (FK)     | → User.id                            |
| categoryId  | String (FK)     | → Category.id                        |
| title       | String          | Judul gig                            |
| description | String          | Deskripsi lengkap                    |
| budget      | Int             | Budget dalam rupiah                  |
| deadline    | DateTime?       | Batas waktu                          |
| slots       | Int             | Jumlah sika yang diterima            |
| isOnsite    | Boolean         | Harus datang fisik?                  |
| location    | String?         | Lokasi jika onsite                   |
| status      | Enum(GigStatus) | OPEN/IN_PROGRESS/COMPLETED/CANCELLED |
| createdAt   | DateTime        |                                      |
| updatedAt   | DateTime        |                                      |

### Proposal

| Kolom        | Tipe                  | Keterangan                          |
| ------------ | --------------------- | ----------------------------------- |
| id           | String (cuid)         | Primary Key                         |
| gigId        | String (FK)           | → Gig.id                            |
| freelancerId | String (FK)           | → User.id                           |
| coverLetter  | String                | Surat lamaran                       |
| bidAmount    | Int                   | Tawaran harga                       |
| status       | Enum(ProposalStatus)  | PENDING/ACCEPTED/REJECTED/WITHDRAWN |
| createdAt    | DateTime              |                                     |
| updatedAt    | DateTime              |                                     |
| **UNIQUE**   | (gigId, freelancerId) | Satu freelancer satu kali per gig   |

### RefreshToken

| Kolom     | Tipe            | Keterangan        |
| --------- | --------------- | ----------------- |
| id        | String (cuid)   | Primary Key       |
| userId    | String (FK)     | → User.id         |
| token     | String (unique) | Token JWT refresh |
| expiresAt | DateTime        | Waktu kedaluwarsa |
| createdAt | DateTime        |                   |

---

## Enum

```
Role:            CLIENT | FREELANCER
GigStatus:       OPEN | IN_PROGRESS | COMPLETED | CANCELLED
ProposalStatus:  PENDING | ACCEPTED | REJECTED | WITHDRAWN
ExperienceLevel: BEGINNER | INTERMEDIATE | EXPERT
```

---

## Kardinalitas

| Hubungan                     | Kardinalitas | Cascade        |
| ---------------------------- | ------------ | -------------- |
| User → Profile               | 1:1          | DELETE CASCADE |
| User → Gig (CLIENT)          | 1:N          | DELETE CASCADE |
| User → Proposal (FREELANCER) | 1:N          | DELETE CASCADE |
| User → RefreshToken          | 1:N          | DELETE CASCADE |
| Category → Gig               | 1:N          | RESTRICT       |
| Gig → Proposal               | 1:N          | DELETE CASCADE |
