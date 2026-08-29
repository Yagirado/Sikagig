# Activity Diagram: Edit Profil — SIKAGIG

## Flow

```
[User] Buka halaman /profile/edit
    ↓
[Frontend] Cek apakah user sudah login
    ↓ belum login
    → Redirect ke /login
    ↓ sudah login
[Frontend] GET /api/v1/profile
    ↓
[Backend] Ambil profil berdasarkan userId dari token
    ↓
[Frontend] Pre-fill form dengan data profil saat ini
    ↓
Form dibedakan berdasarkan role:

  [CLIENT]                          [FREELANCER]
  - Nama lengkap                    - Nama lengkap
  - Avatar URL                      - Avatar URL
  - Bio singkat                     - Bio singkat
  - Lokasi                          - Lokasi
  - Nama perusahaan                 - Headline / tagline
  - Industri                        - Skills (tag input)
                                    - Experience level
                                    - Portfolio URL
    ↓
[User] Edit field yang ingin diubah
    ↓
[Frontend] Validasi form (Zod)
    ↓ tidak valid
    → Tampilkan error per field
    ↓ valid
[Frontend] PATCH /api/v1/profile { ...changedFields }
    ↓
[Backend] Verifikasi token
[Backend] Update Profile di database
[Backend] Response 200 { profile }
    ↓
[Frontend] Tampilkan notifikasi "Profil berhasil diperbarui"
[Frontend] Update tampilan dengan data terbaru
```

## Validasi

| Field           | Aturan                                 |
| --------------- | -------------------------------------- |
| name            | Required, min 2 karakter               |
| bio             | Optional, maks 300 karakter            |
| skills          | Minimal 1 jika freelancer, maks 10     |
| portfolioUrl    | Optional, harus format URL valid       |
| experienceLevel | Harus BEGINNER / INTERMEDIATE / EXPERT |
