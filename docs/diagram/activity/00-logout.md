# Activity Diagram: Logout — SIKAGIG

## Flow

```
[User] Klik tombol logout
    ↓
[Frontend] Kirim POST /api/v1/auth/logout
  + kirim refreshToken di body
    ↓
[Backend] Verifikasi accessToken via middleware
    ↓ (valid)
[Backend] Hapus RefreshToken dari database
    ↓
[Backend] Response 200 OK
    ↓
[Frontend] Hapus accessToken dari memory/store
    ↓
[Frontend] Redirect ke halaman login
```

## State Setelah Logout

- Access token dihapus dari state (tidak ada di memory)
- Refresh token dihapus dari database
- User diarahkan ke `/login`
- Semua protected route tidak bisa diakses
