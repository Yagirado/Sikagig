# Activity Diagram: Buat Gig — SIKAGIG

## Flow

```
[Client] Klik tombol "Buat Gig"
    ↓
[Frontend] Cek apakah user login dan role = CLIENT
    ↓ belum login / bukan CLIENT
    → Redirect ke /login
    ↓ CLIENT
[Frontend] Tampilkan form buat gig
    ↓
[Client] Isi form:
  - Judul gig (required)
  - Deskripsi lengkap (required)
  - Kategori (required, pilih dari dropdown)
  - Budget (required, angka positif)
  - Deadline (optional, tanggal di masa depan)
  - Jumlah slot sika (optional, default 1)
  - Apakah harus hadir fisik? (toggle isOnsite)
  - Lokasi (required jika isOnsite = true)
    ↓
[Frontend] Validasi form (Zod)
    ↓ tidak valid
    → Tampilkan error per field
    ↓ valid
[Frontend] POST /api/v1/gigs + Authorization: Bearer accessToken
    ↓
[Backend] Verifikasi token + cek role = CLIENT
    ↓ tidak authorized
    → Response 403 Forbidden
    ↓ authorized
[Backend] Validasi data (Zod)
[Backend] Cek categoryId valid
[Backend] Buat Gig baru { status: OPEN, clientId: userId }
[Backend] Response 201 { gig }
    ↓
[Frontend] Tampilkan notifikasi sukses
[Frontend] Redirect ke halaman detail gig
```

## Validasi

| Field       | Aturan                                 |
| ----------- | -------------------------------------- |
| title       | Required, min 5 karakter               |
| description | Required, min 20 karakter              |
| categoryId  | Required, harus ID kategori yang valid |
| budget      | Required, angka positif                |
| deadline    | Optional, harus tanggal di masa depan  |
| slots       | Optional, integer positif, default 1   |
| location    | Required jika isOnsite = true          |
