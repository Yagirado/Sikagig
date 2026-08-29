# Activity Diagram: Dashboard Client — SIKAGIG

## Flow

```
[Client] Login → Redirect ke /dashboard
    ↓
[Frontend] GET /api/v1/auth/me (ambil data user)
GET /api/v1/gigs?clientId=me (gig milik user ini)
GET /api/v1/proposals?incoming=true (proposal masuk ke gig saya)
    ↓
[Frontend] Tampilkan Dashboard Client:

  ┌─────────────────────────────────────────┐
  │  Halo, [Nama Client]                    │
  │                                         │
  │  Gig Aktif          Proposal Masuk      │
  │  [count OPEN]       [count PENDING]     │
  │  [count IN_PROG]                        │
  │                                         │
  │  [Tab: Gig Saya]  [Tab: Proposal Masuk] │
  │                                         │
  │  Gig Saya:                              │
  │  - [Judul Gig] [Status Badge] [Actions] │
  │  - [Judul Gig] [Status Badge] [Actions] │
  │  + Buat Gig Baru                        │
  └─────────────────────────────────────────┘
    ↓
[Client] Aksi yang tersedia:
  - Klik "Buat Gig Baru" → /gigs/create
  - Klik gig → detail gig
  - Klik "Lihat Proposal" pada gig → /proposals?gigId=...
  - Klik "Edit Gig" → /gigs/:id/edit (jika masih OPEN)
  - Klik "Hapus Gig" → konfirmasi → DELETE /api/v1/gigs/:id
```

## Data yang Ditampilkan

| Komponen       | Data                            | Endpoint                            |
| -------------- | ------------------------------- | ----------------------------------- |
| Ringkasan      | Total gig per status            | GET /api/v1/gigs (filter clientId)  |
| List Gig       | Semua gig milik client          | GET /api/v1/gigs?clientId=me        |
| Proposal Masuk | Proposal PENDING untuk gig saya | GET /api/v1/proposals?incoming=true |
