# Activity Diagram: Terima / Tolak Proposal — SIKAGIG

## Flow: Terima Proposal

```
[Client] Buka halaman "Proposal Masuk" untuk salah satu gig
    ↓
[Frontend] GET /api/v1/gigs/:gigId/proposals (atau GET /api/v1/proposals?gigId=...)
    ↓
[Frontend] Tampilkan daftar proposal (PENDING dulu)
    ↓
[Client] Klik "Terima" pada salah satu proposal
    ↓
[Frontend] Konfirmasi dialog: "Yakin ingin menerima proposal dari [nama]?"
    ↓ batal
    → Tidak ada perubahan
    ↓ konfirmasi
[Frontend] PATCH /api/v1/proposals/:proposalId/status { action: "accept" }
    ↓
[Backend] Verifikasi token + cek role = CLIENT
    ↓
[Backend] Cari proposal by ID
    ↓ tidak ditemukan
    → Response 404
    ↓ ditemukan
[Backend] Cek apakah client adalah pemilik gig
    ↓ bukan pemilik
    → Response 403 Forbidden
    ↓ pemilik
[Backend] Cek apakah proposal masih PENDING
    ↓ bukan PENDING
    → Response 400 "Status proposal sudah berubah"
    ↓ masih PENDING
[Backend] Update Proposal status → ACCEPTED
[Backend] Update Gig status → IN_PROGRESS (otomatis)
[Backend] Response 200 { proposal, gig }
    ↓
[Frontend] Refresh daftar proposal
[Frontend] Tampilkan notifikasi sukses
[Frontend] Gig sudah berubah jadi IN_PROGRESS
```

## Flow: Tolak Proposal

```
[Client] Klik "Tolak" pada proposal
    ↓
[Frontend] PATCH /api/v1/proposals/:proposalId/status { action: "reject" }
    ↓
[Backend] Verifikasi token + validasi kepemilikan gig
    ↓
[Backend] Cek proposal masih PENDING
    ↓
[Backend] Update Proposal status → REJECTED
[Backend] Response 200 { proposal }
    ↓
[Frontend] Update tampilan: proposal ditandai REJECTED
```

## Business Rules

| Rule                                      | Keterangan                                     |
| ----------------------------------------- | ---------------------------------------------- |
| Hanya pemilik gig yang bisa terima/tolak  | Check `gig.clientId === userId`                |
| Proposal harus masih PENDING              | Tidak bisa ubah status yang sudah final        |
| Terima proposal = Gig jadi IN_PROGRESS    | Otomatis saat accept                           |
| Bisa terima lebih dari 1 jika `slots > 1` | Gig belum IN_PROGRESS sampai semua slot terisi |
