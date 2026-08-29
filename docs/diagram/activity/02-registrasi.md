# Activity Diagram: Registrasi — SIKAGIG

## Flow

```
[User] Buka halaman /register
    ↓
[User] Pilih role: CLIENT (Juragan) atau FREELANCER (Sika)
    ↓
[User] Masukkan email, password, konfirmasi password
    ↓
[Frontend] Validasi form (Zod)
  - email: format valid
  - password: minimal 8 karakter
  - confirmPassword: harus sama dengan password
    ↓ tidak valid
    → Tampilkan error inline per field
    ↓ valid
[Frontend] POST /api/v1/auth/register { email, password, role }
    ↓
[Backend] Cek apakah email sudah terdaftar
    ↓ sudah ada
    → Response 409 "Email sudah digunakan"
    → [Frontend] Tampilkan error message
    ↓ belum ada
[Backend] Hash password dengan bcrypt (cost factor 12)
[Backend] Buat User baru di database
[Backend] Generate accessToken + refreshToken
[Backend] Simpan refreshToken ke database
[Backend] Response 201 { user, accessToken, refreshToken }
    ↓
[Frontend] Simpan token
    ↓
[Frontend] Redirect ke onboarding berdasarkan role:
  - CLIENT → /onboarding/client
  - FREELANCER → /onboarding/freelancer
```

## Onboarding Client

```
[User] Isi form onboarding client:
  - Nama lengkap (required)
  - Nama perusahaan (optional)
  - Industri (optional)
    ↓
[Frontend] PATCH /api/v1/profile { name, company, industry }
    ↓
[Backend] Update/buat Profile
    ↓
[Frontend] Redirect ke /dashboard
```

## Onboarding Freelancer

```
[User] Isi form onboarding freelancer:
  - Nama lengkap (required)
  - Headline / tagline (optional)
  - Skills (required, minimal 1)
  - Experience level (required)
  - Portfolio URL (optional)
    ↓
[Frontend] PATCH /api/v1/profile { name, headline, skills, experienceLevel, portfolioUrl }
    ↓
[Backend] Update/buat Profile
    ↓
[Frontend] Redirect ke /gigs (marketplace)
```

## Validasi Register

| Field           | Aturan                       |
| --------------- | ---------------------------- |
| email           | Format email valid, required |
| password        | Minimal 8 karakter, required |
| confirmPassword | Harus sama dengan password   |
| role            | Harus CLIENT atau FREELANCER |
