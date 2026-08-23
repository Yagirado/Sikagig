# Activity Diagram: Dashboard Freelancer — SIKAGIG

## Flow

```
[Freelancer] Login → Redirect ke /gigs (marketplace) atau /dashboard
    ↓
[Frontend] GET /api/v1/auth/me
GET /api/v1/proposals?mine=true (proposal yang saya kirim)
GET /api/v1/gigs?status=OPEN (gig tersedia)
    ↓
[Frontend] Tampilkan Dashboard Freelancer:

  ┌─────────────────────────────────────────┐
  │  Halo, [Nama Freelancer]                │
  │  [Headline/Tagline jika ada]            │
  │                                         │
  │  Proposal Saya     Gig Dikerjakan       │
  │  [count PENDING]   [count IN_PROGRESS]  │
  │  [count ACCEPTED]                       │
  │                                         │
  │  [Tab: Proposal Saya] [Tab: Cari Gig]   │
  │                                         │
  │  Proposal Saya:                         │
  │  - [Judul Gig] [Status] [Bid Amount]    │
  │  - [Judul Gig] [Status] [Bid Amount]    │
  │                                         │
  │  Gig Tersedia:                          │
  │  - [Judul] [Budget] [Kategori]          │
  │  - [Judul] [Budget] [Kategori]          │
  │  → Lihat Semua Gig                      │
  └─────────────────────────────────────────┘
    ↓
[Freelancer] Aksi yang tersedia:
  - Klik proposal → detail gig
  - Klik "Tarik Proposal" jika status PENDING → withdraw
  - Klik gig di daftar → detail gig → kirim proposal
  - Klik "Lihat Semua Gig" → /gigs (marketplace penuh)
  - Edit profil → /profile/edit
```

## Data yang Ditampilkan

| Komponen      | Data                        | Endpoint                             |
| ------------- | --------------------------- | ------------------------------------ |
| Proposal Saya | Semua proposal yang dikirim | GET /api/v1/proposals                |
| Gig Tersedia  | Gig OPEN terbaru (preview)  | GET /api/v1/gigs?status=OPEN&limit=5 |
| Ringkasan     | Total proposal per status   | Dihitung dari response proposals     |
