# Activity Diagram: Login — SIKAGIG

## Flow

```
[User] Buka halaman /login
    ↓
[User] Masukkan email dan password
    ↓
[Frontend] Validasi form (Zod) — email format, password minimal 6 karakter
    ↓ (valid)
[Frontend] POST /api/v1/auth/login { email, password }
    ↓
[Backend] Cari user by email
    ↓ tidak ditemukan
    → Response 401 "Email atau password salah"
    → [Frontend] Tampilkan error message
    ↓ ditemukan
[Backend] Bandingkan password dengan bcrypt hash
    ↓ tidak cocok
    → Response 401 "Email atau password salah"
    → [Frontend] Tampilkan error message
    ↓ cocok
[Backend] Generate accessToken (JWT, 15 menit)
[Backend] Generate refreshToken (random, 7 hari)
[Backend] Simpan refreshToken ke database (RefreshToken)
[Backend] Response 200 { user, accessToken, refreshToken }
    ↓
[Frontend] Simpan accessToken di memory (state/context)
[Frontend] Simpan refreshToken di httpOnly cookie atau localStorage
    ↓
[Frontend] Redirect berdasarkan role:
  - CLIENT → /dashboard atau /gigs
  - FREELANCER → /gigs (marketplace)
```

## Validasi

| Field    | Aturan                       |
| -------- | ---------------------------- |
| email    | Format email valid, required |
| password | Minimal 6 karakter, required |

## Error States

| Kondisi               | Response                                                     |
| --------------------- | ------------------------------------------------------------ |
| Email tidak terdaftar | 401 Unauthorized                                             |
| Password salah        | 401 Unauthorized (pesan sama, tidak reveal apakah email ada) |
| Input tidak valid     | 400 Bad Request (Zod validation error)                       |
