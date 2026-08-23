# Activity Diagram: Kirim Proposal — SIKAGIG

## Flow

```
[Freelancer] Jelajahi daftar gig → klik gig yang menarik
    ↓
[Frontend] GET /api/v1/gigs/:id
    ↓
[Frontend] Tampilkan detail gig
    ↓
[Frontend] Cek apakah user login dan role = FREELANCER
    ↓ belum login
    → Tampilkan tombol "Login untuk melamar"
    → Redirect ke /login saat diklik
    ↓ FREELANCER
[Frontend] Cek apakah sudah pernah apply gig ini
    ↓ sudah
    → Tampilkan status proposal yang ada (PENDING/ACCEPTED/REJECTED)
    ↓ belum
[Frontend] Tampilkan tombol "Kirim Proposal"
    ↓
[Freelancer] Klik "Kirim Proposal"
    ↓
[Frontend] Tampilkan form proposal:
  - Cover letter (textarea, required)
  - Bid amount / tawaran harga (number, required)
    ↓
[Freelancer] Isi cover letter dan bid amount
    ↓
[Frontend] Validasi form
    ↓ tidak valid
    → Tampilkan error
    ↓ valid
[Frontend] POST /api/v1/gigs/:gigId/proposals + Authorization
    ↓
[Backend] Verifikasi token + cek role = FREELANCER
    ↓ tidak authorized
    → Response 403 Forbidden
    ↓ authorized
[Backend] Cek apakah gig masih OPEN
    ↓ sudah IN_PROGRESS / COMPLETED / CANCELLED
    → Response 400 "Gig tidak menerima proposal lagi"
    ↓ OPEN
[Backend] Cek apakah freelancer sudah pernah apply (@@unique constraint)
    ↓ sudah
    → Response 409 "Kamu sudah melamar gig ini"
    ↓ belum
[Backend] Cek apakah freelancer tidak melamar gig miliknya sendiri
    ↓ gig milik sendiri
    → Response 400 "Kamu tidak bisa melamar gig milikmu sendiri"
    ↓ bukan milik sendiri
[Backend] Buat Proposal baru { status: PENDING }
[Backend] Response 201 { proposal }
    ↓
[Frontend] Tampilkan notifikasi "Proposal terkirim!"
[Frontend] Update tampilan: ganti tombol "Kirim Proposal" jadi status PENDING
```

## Validasi

| Field       | Aturan                                 |
| ----------- | -------------------------------------- |
| coverLetter | Required, min 50 karakter              |
| bidAmount   | Required, angka positif, tidak boleh 0 |

## Error Cases

| Kondisi               | Response        |
| --------------------- | --------------- |
| Gig sudah tidak OPEN  | 400 Bad Request |
| Sudah pernah apply    | 409 Conflict    |
| Melamar gig sendiri   | 400 Bad Request |
| Bukan role FREELANCER | 403 Forbidden   |
