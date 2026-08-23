# 📊 ERD: Platform Gig Lokal (SIKAGIG)

> **Total Tabel**: 11 tabel MySQL
> **Database**: MySQL | **ORM**: Laravel Eloquent
> **Auth**: Email + OTP (tidak ada password, tidak ada Google OAuth)
> **NIM**: CHAR(13), tepat 13 digit angka, UNIQUE global

---

## A. Diagram Relasi

```
                         ┌─────────────────────────┐
                         │          users          │
                         │   (email + OTP login)   │
                         └───────────┬─────────────┘
          ┌─────────────┬────────────┼───────────────┬──────────────┐
     1:1  ▼        1:N  ▼      1:N  ▼          1:1  ▼         1:N  ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ profiles │  │   gigs   │  │proposals │  │ wallets  │  │ suspend_logs │
  └──────────┘  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────────┘
                     │             │                ▲
                1:1  ▼        1:1  ▼                │
              ┌──────────────────────┐              │
              │       escrows        │              │
              └──────────┬───────────┘              │
                    1:N  ▼                          │
              ┌──────────────────────┐              │
              │       payments       ├──────────────┘
              └──────────────────────┘

gigs ──N:1──► categories
users ──1:N──► otp_codes  (via email, bukan FK)
```

---

## B. Detail Tabel & Kolom

### 1. `users`

| Kolom               | Tipe                                      | Constraint                 | Keterangan       |
| ------------------- | ----------------------------------------- | -------------------------- | ---------------- |
| `id`                | BIGINT UNSIGNED                           | PK, AUTO_INCREMENT         |                  |
| `email`             | VARCHAR(255)                              | UNIQUE, NOT NULL           | Identifier login |
| `role`              | ENUM('client','freelancer','super_admin') | NOT NULL, DEFAULT 'client' |                  |
| `is_suspended`      | TINYINT(1)                                | NOT NULL, DEFAULT 0        | 1 = disuspend    |
| `suspended_at`      | TIMESTAMP                                 | NULL                       |                  |
| `suspended_reason`  | TEXT                                      | NULL                       |                  |
| `email_verified_at` | TIMESTAMP                                 | NULL                       |                  |
| `remember_token`    | VARCHAR(100)                              | NULL                       | Laravel default  |
| `created_at`        | TIMESTAMP                                 | NULL                       |                  |
| `updated_at`        | TIMESTAMP                                 | NULL                       |                  |

---

### 2. `otp_codes`

| Kolom        | Tipe                     | Constraint                | Keterangan                          |
| ------------ | ------------------------ | ------------------------- | ----------------------------------- |
| `id`         | BIGINT UNSIGNED          | PK, AUTO_INCREMENT        |                                     |
| `email`      | VARCHAR(255)             | NOT NULL                  | Tidak FK ke users (bisa email baru) |
| `otp`        | VARCHAR(6)               | NOT NULL                  | 6 digit angka                       |
| `purpose`    | ENUM('login','register') | NOT NULL, DEFAULT 'login' |                                     |
| `is_used`    | TINYINT(1)               | NOT NULL, DEFAULT 0       | 1 = sudah dipakai                   |
| `expires_at` | TIMESTAMP                | NOT NULL                  | +10 menit dari dibuat               |
| `created_at` | TIMESTAMP                | NULL                      |                                     |

---

### 3. `profiles`

| Kolom                 | Tipe                                     | Constraint                      | Keterangan                                                               |
| --------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `id`                  | BIGINT UNSIGNED                          | PK, AUTO_INCREMENT              |                                                                          |
| `user_id`             | BIGINT UNSIGNED                          | FK → users.id, UNIQUE, NOT NULL | 1:1                                                                      |
| `name`                | VARCHAR(100)                             | NULL                            | Nama lengkap — WAJIB semua role                                          |
| `avatar_url`          | VARCHAR(255)                             | NULL                            | **Opsional** semua role                                                  |
| `bio`                 | TEXT                                     | NULL                            | Opsional                                                                 |
| `location`            | VARCHAR(100)                             | NULL                            | Opsional                                                                 |
| `nim`                 | CHAR(13)                                 | **UNIQUE**, NULL                | **WAJIB freelancer** — tepat 13 digit angka, tidak boleh sama antar user |
| `faculty`             | VARCHAR(100)                             | NULL                            | **WAJIB freelancer**                                                     |
| `company`             | VARCHAR(100)                             | NULL                            | Client only                                                              |
| `industry`            | VARCHAR(100)                             | NULL                            | Client only                                                              |
| `headline`            | VARCHAR(150)                             | NULL                            | Freelancer only, opsional                                                |
| `skills`              | JSON                                     | NULL                            | Freelancer only, opsional                                                |
| `experience_level`    | ENUM('beginner','intermediate','expert') | NULL                            | Freelancer only, opsional                                                |
| `portfolio_url`       | VARCHAR(255)                             | NULL                            | Freelancer only, opsional                                                |
| `is_profile_complete` | TINYINT(1)                               | NOT NULL, DEFAULT 0             | 1 = semua field wajib terisi                                             |
| `created_at`          | TIMESTAMP                                | NULL                            |                                                                          |
| `updated_at`          | TIMESTAMP                                | NULL                            |                                                                          |

**Constraint penting:**

```sql
UNIQUE KEY profiles_nim_unique (nim)         -- NIM tidak boleh sama
CHECK (nim IS NULL OR nim REGEXP '^[0-9]{13}$')  -- tepat 13 digit angka
```

**`is_profile_complete = 1` jika:**

- Freelancer: `name` + `nim` + `faculty` semua tidak NULL/kosong
- Client: `name` tidak NULL/kosong

---

### 4. `suspend_logs`

| Kolom            | Tipe                        | Constraint              | Keterangan         |
| ---------------- | --------------------------- | ----------------------- | ------------------ |
| `id`             | BIGINT UNSIGNED             | PK, AUTO_INCREMENT      |                    |
| `target_user_id` | BIGINT UNSIGNED             | FK → users.id, NOT NULL | Freelancer target  |
| `admin_id`       | BIGINT UNSIGNED             | FK → users.id, NOT NULL | Super admin pelaku |
| `action`         | ENUM('suspend','unsuspend') | NOT NULL                |                    |
| `reason`         | TEXT                        | NULL                    | Wajib saat suspend |
| `created_at`     | TIMESTAMP                   | NULL                    |                    |

---

### 5. `categories`

| Kolom                       | Tipe            | Constraint       |
| --------------------------- | --------------- | ---------------- |
| `id`                        | BIGINT UNSIGNED | PK               |
| `name`                      | VARCHAR(100)    | UNIQUE, NOT NULL |
| `slug`                      | VARCHAR(100)    | UNIQUE, NOT NULL |
| `created_at` / `updated_at` | TIMESTAMP       | NULL             |

---

### 6. `wallets`

| Kolom                       | Tipe            | Constraint            | Keterangan     |
| --------------------------- | --------------- | --------------------- | -------------- |
| `id`                        | BIGINT UNSIGNED | PK                    |                |
| `user_id`                   | BIGINT UNSIGNED | FK → users.id, UNIQUE | 1:1 freelancer |
| `balance`                   | INT UNSIGNED    | NOT NULL, DEFAULT 0   | Rupiah         |
| `created_at` / `updated_at` | TIMESTAMP       | NULL                  |                |

---

### 7. `gigs`

| Kolom                       | Tipe                                               | Constraint                   | Keterangan |
| --------------------------- | -------------------------------------------------- | ---------------------------- | ---------- |
| `id`                        | BIGINT UNSIGNED                                    | PK                           |            |
| `client_id`                 | BIGINT UNSIGNED                                    | FK → users.id, NOT NULL      |            |
| `category_id`               | BIGINT UNSIGNED                                    | FK → categories.id, NOT NULL |            |
| `title`                     | VARCHAR(255)                                       | NOT NULL                     |            |
| `description`               | TEXT                                               | NOT NULL                     |            |
| `budget`                    | INT UNSIGNED                                       | NOT NULL                     | Rupiah     |
| `deadline`                  | DATE                                               | NULL                         |            |
| `slots`                     | TINYINT UNSIGNED                                   | NOT NULL, DEFAULT 1          |            |
| `is_onsite`                 | TINYINT(1)                                         | NOT NULL, DEFAULT 0          |            |
| `location`                  | VARCHAR(150)                                       | NULL                         |            |
| `status`                    | ENUM('open','in_progress','completed','cancelled') | NOT NULL, DEFAULT 'open'     |            |
| `created_at` / `updated_at` | TIMESTAMP                                          | NULL                         |            |

---

### 8. `proposals`

| Kolom                       | Tipe                                              | Constraint                  | Keterangan    |
| --------------------------- | ------------------------------------------------- | --------------------------- | ------------- |
| `id`                        | BIGINT UNSIGNED                                   | PK                          |               |
| `gig_id`                    | BIGINT UNSIGNED                                   | FK → gigs.id, NOT NULL      |               |
| `freelancer_id`             | BIGINT UNSIGNED                                   | FK → users.id, NOT NULL     |               |
| `cover_letter`              | TEXT                                              | NOT NULL                    |               |
| `bid_amount`                | INT UNSIGNED                                      | NOT NULL                    | Tawaran harga |
| `status`                    | ENUM('pending','accepted','rejected','withdrawn') | NOT NULL, DEFAULT 'pending' |               |
| `created_at` / `updated_at` | TIMESTAMP                                         | NULL                        |               |

**Unique Constraint:** `UNIQUE(gig_id, freelancer_id)`

---

### 9. `escrows`

| Kolom                       | Tipe                                                                          | Constraint                           | Keterangan    |
| --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------ | ------------- |
| `id`                        | BIGINT UNSIGNED                                                               | PK                                   |               |
| `proposal_id`               | BIGINT UNSIGNED                                                               | FK → proposals.id, UNIQUE            | 1:1           |
| `gig_id`                    | BIGINT UNSIGNED                                                               | FK → gigs.id                         | Denormalisasi |
| `client_id`                 | BIGINT UNSIGNED                                                               | FK → users.id                        |               |
| `freelancer_id`             | BIGINT UNSIGNED                                                               | FK → users.id                        |               |
| `amount`                    | INT UNSIGNED                                                                  | NOT NULL                             | = bid_amount  |
| `payment_method`            | ENUM('bank_transfer','ewallet','cash')                                        | NOT NULL                             |               |
| `status`                    | ENUM('awaiting_payment','holding','released','settled','refunded','disputed') | NOT NULL, DEFAULT 'awaiting_payment' |               |
| `held_at`                   | TIMESTAMP                                                                     | NULL                                 |               |
| `released_at`               | TIMESTAMP                                                                     | NULL                                 |               |
| `settled_at`                | TIMESTAMP                                                                     | NULL                                 |               |
| `notes`                     | TEXT                                                                          | NULL                                 |               |
| `created_at` / `updated_at` | TIMESTAMP                                                                     | NULL                                 |               |

---

### 10. `payments`

| Kolom                       | Tipe                                            | Constraint                  | Keterangan |
| --------------------------- | ----------------------------------------------- | --------------------------- | ---------- |
| `id`                        | BIGINT UNSIGNED                                 | PK                          |            |
| `escrow_id`                 | BIGINT UNSIGNED                                 | FK → escrows.id             |            |
| `user_id`                   | BIGINT UNSIGNED                                 | FK → users.id               |            |
| `type`                      | ENUM('deposit','release','refund','settlement') | NOT NULL                    |            |
| `amount`                    | INT UNSIGNED                                    | NOT NULL                    |            |
| `payment_method`            | ENUM('bank_transfer','ewallet','cash')          | NOT NULL                    |            |
| `status`                    | ENUM('pending','success','failed')              | NOT NULL, DEFAULT 'pending' |            |
| `reference_code`            | VARCHAR(100)                                    | UNIQUE, NULL                |            |
| `paid_at`                   | TIMESTAMP                                       | NULL                        |            |
| `created_at` / `updated_at` | TIMESTAMP                                       | NULL                        |            |

---

## C. Relasi Antar Tabel

| Parent       | Child                    | Tipe | ON DELETE |
| ------------ | ------------------------ | ---- | --------- |
| `users`      | `profiles`               | 1:1  | CASCADE   |
| `users`      | `wallets`                | 1:1  | CASCADE   |
| `users`      | `gigs` (client)          | 1:N  | CASCADE   |
| `users`      | `proposals` (freelancer) | 1:N  | CASCADE   |
| `users`      | `suspend_logs` (target)  | 1:N  | CASCADE   |
| `users`      | `suspend_logs` (admin)   | 1:N  | RESTRICT  |
| `categories` | `gigs`                   | 1:N  | RESTRICT  |
| `gigs`       | `proposals`              | 1:N  | CASCADE   |
| `proposals`  | `escrows`                | 1:1  | RESTRICT  |
| `escrows`    | `payments`               | 1:N  | RESTRICT  |

---

## D. Migration Order

```
1. users
2. otp_codes        (tidak ada FK, email bukan FK)
3. categories
4. profiles         (FK → users)
5. suspend_logs     (FK → users x2)
6. wallets          (FK → users)
7. gigs             (FK → users, categories)
8. proposals        (FK → users, gigs)
9. escrows          (FK → proposals, gigs, users x2)
10. payments        (FK → escrows, users)
```

---

## E. Business Rules

| Rule                                                    | Implementasi                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Freelancer tidak bisa apply gig sendiri                 | `$gig->client_id !== auth()->id()`                                                |
| Tidak bisa apply gig bukan `open`                       | Check status sebelum INSERT                                                       |
| Tidak bisa apply dua kali                               | `UNIQUE(gig_id, freelancer_id)`                                                   |
| Hanya pemilik gig bisa terima/tolak                     | `$gig->client_id === auth()->id()`                                                |
| **NIM harus tepat 13 digit angka**                      | CHECK constraint di DB + `regex:/^\d{13}$/` di Form Request                       |
| **NIM tidak boleh sama antar user**                     | `UNIQUE KEY profiles_nim_unique` + validasi `unique:profiles,nim` di Form Request |
| Freelancer wajib lengkapi profil sebelum buat/ambil gig | Cek `is_profile_complete = 1` di middleware `CheckProfileComplete`                |
| Freelancer suspended tidak bisa login                   | Cek `is_suspended` setelah OTP valid                                              |
| Suspended user token direvoke                           | Hapus `personal_access_tokens` saat suspend                                       |
| Escrow dibuat saat proposal diterima                    | `ProposalController@accept`                                                       |
| Cash langsung set escrow ke `holding`                   | Set `held_at = now()`, tanpa payment deposit                                      |
| Dana wallet hanya naik saat escrow `settled` (non-cash) | `EscrowController@settle`                                                         |

---

## F. Validasi NIM di Laravel Form Request

```php
// app/Http/Requests/UpdateProfileRequest.php
public function rules(): array
{
    $userId = auth()->id();

    return [
        'nim' => [
            'nullable',
            'string',
            'regex:/^\d{13}$/',                              // tepat 13 digit angka
            "unique:profiles,nim,{$userId},user_id",         // unik, kecuali milik sendiri
        ],
        'name'    => ['required', 'string', 'max:100'],
        'faculty' => ['required_if:role,freelancer', 'string', 'max:100'],
        // ...
    ];
}
```

```
                    ┌──────────────────────────┐
                    │          users           │
                    │  (email + Google OAuth)  │
                    └────────────┬─────────────┘
           ┌────────────────┬────┴─────┬────────────────────┐
      1:1  ▼           1:N  ▼    1:N   ▼               1:1  ▼
  ┌──────────┐       ┌───────┐  ┌──────────┐       ┌──────────┐
  │ profiles │       │  gigs │  │ proposals│       │ wallets  │
  └──────────┘       └───┬───┘  └────┬─────┘       └──────────┘
                         │           │                    ▲
                    1:1  ▼      1:1  ▼                    │
                  ┌──────────────────────┐                │
                  │       escrows        │                │
                  └──────────┬───────────┘                │
                         1:N ▼                            │
                  ┌──────────────────────┐                │
                  │       payments       ├────────────────┘
                  └──────────────────────┘

gigs ──N:1──► categories
```

---

## B. Detail Tabel & Kolom

### 1. `users`

> Akun semua pengguna. Support login email/password dan Google OAuth.

| Kolom               | Tipe                        | Constraint         | Keterangan                 |
| ------------------- | --------------------------- | ------------------ | -------------------------- |
| `id`                | BIGINT UNSIGNED             | PK, AUTO_INCREMENT |                            |
| `email`             | VARCHAR(255)                | UNIQUE, NOT NULL   | Untuk login                |
| `password`          | VARCHAR(255)                | NULL               | NULL jika login via Google |
| `google_id`         | VARCHAR(255)                | UNIQUE, NULL       | ID dari Google OAuth       |
| `role`              | ENUM('client','freelancer') | NOT NULL           | Hak akses                  |
| `email_verified_at` | TIMESTAMP                   | NULL               |                            |
| `remember_token`    | VARCHAR(100)                | NULL               | Laravel default            |
| `created_at`        | TIMESTAMP                   | NULL               |                            |
| `updated_at`        | TIMESTAMP                   | NULL               |                            |

**Catatan:**

- Jika login via Google: `password = NULL`, `google_id` terisi
- Jika register email: `password` terisi, `google_id = NULL`
- User bisa link akun Google ke akun email yang sudah ada (isi keduanya)

**Relasi Eloquent:**

```php
public function profile(): HasOne
public function gigs(): HasMany         // sebagai client
public function proposals(): HasMany    // sebagai freelancer
public function wallet(): HasOne
public function tokens()                // Sanctum
```

---

### 2. `profiles`

> Data tambahan user setelah onboarding.

| Kolom              | Tipe                                     | Constraint                      | Keterangan                      |
| ------------------ | ---------------------------------------- | ------------------------------- | ------------------------------- |
| `id`               | BIGINT UNSIGNED                          | PK, AUTO_INCREMENT              |                                 |
| `user_id`          | BIGINT UNSIGNED                          | FK → users.id, UNIQUE, NOT NULL | 1:1                             |
| `name`             | VARCHAR(100)                             | NOT NULL                        | Nama lengkap (bisa dari Google) |
| `avatar_url`       | VARCHAR(255)                             | NULL                            | Bisa dari Google avatar         |
| `bio`              | TEXT                                     | NULL                            |                                 |
| `location`         | VARCHAR(100)                             | NULL                            |                                 |
| `company`          | VARCHAR(100)                             | NULL                            | **Client only**                 |
| `industry`         | VARCHAR(100)                             | NULL                            | **Client only**                 |
| `headline`         | VARCHAR(150)                             | NULL                            | **Freelancer only**             |
| `skills`           | JSON                                     | NULL                            | **Freelancer only**             |
| `experience_level` | ENUM('beginner','intermediate','expert') | NULL                            | **Freelancer only**             |
| `portfolio_url`    | VARCHAR(255)                             | NULL                            | **Freelancer only**             |
| `created_at`       | TIMESTAMP                                | NULL                            |                                 |
| `updated_at`       | TIMESTAMP                                | NULL                            |                                 |

---

### 3. `categories`

| Kolom        | Tipe            | Constraint         | Keterangan |
| ------------ | --------------- | ------------------ | ---------- |
| `id`         | BIGINT UNSIGNED | PK, AUTO_INCREMENT |            |
| `name`       | VARCHAR(100)    | UNIQUE, NOT NULL   |            |
| `slug`       | VARCHAR(100)    | UNIQUE, NOT NULL   |            |
| `created_at` | TIMESTAMP       | NULL               |            |
| `updated_at` | TIMESTAMP       | NULL               |            |

---

### 4. `gigs`

| Kolom         | Tipe                                               | Constraint                   | Keterangan                |
| ------------- | -------------------------------------------------- | ---------------------------- | ------------------------- |
| `id`          | BIGINT UNSIGNED                                    | PK, AUTO_INCREMENT           |                           |
| `client_id`   | BIGINT UNSIGNED                                    | FK → users.id, NOT NULL      |                           |
| `category_id` | BIGINT UNSIGNED                                    | FK → categories.id, NOT NULL |                           |
| `title`       | VARCHAR(255)                                       | NOT NULL                     |                           |
| `description` | TEXT                                               | NOT NULL                     |                           |
| `budget`      | INT UNSIGNED                                       | NOT NULL                     | Budget dalam rupiah       |
| `deadline`    | DATE                                               | NULL                         |                           |
| `slots`       | TINYINT UNSIGNED                                   | NOT NULL, DEFAULT 1          | Jumlah sika yang diterima |
| `is_onsite`   | BOOLEAN                                            | NOT NULL, DEFAULT FALSE      |                           |
| `location`    | VARCHAR(150)                                       | NULL                         |                           |
| `status`      | ENUM('open','in_progress','completed','cancelled') | NOT NULL, DEFAULT 'open'     |                           |
| `created_at`  | TIMESTAMP                                          | NULL                         |                           |
| `updated_at`  | TIMESTAMP                                          | NULL                         |                           |

---

### 5. `proposals`

| Kolom           | Tipe                                              | Constraint                  | Keterangan    |
| --------------- | ------------------------------------------------- | --------------------------- | ------------- |
| `id`            | BIGINT UNSIGNED                                   | PK, AUTO_INCREMENT          |               |
| `gig_id`        | BIGINT UNSIGNED                                   | FK → gigs.id, NOT NULL      |               |
| `freelancer_id` | BIGINT UNSIGNED                                   | FK → users.id, NOT NULL     |               |
| `cover_letter`  | TEXT                                              | NOT NULL                    |               |
| `bid_amount`    | INT UNSIGNED                                      | NOT NULL                    | Tawaran harga |
| `status`        | ENUM('pending','accepted','rejected','withdrawn') | NOT NULL, DEFAULT 'pending' |               |
| `created_at`    | TIMESTAMP                                         | NULL                        |               |
| `updated_at`    | TIMESTAMP                                         | NULL                        |               |

**Unique Constraint:** `UNIQUE(gig_id, freelancer_id)`

---

### 6. `escrows`

> Dana yang ditahan platform saat gig berlangsung. Satu proposal accepted = satu escrow.

| Kolom            | Tipe                                                                          | Constraint                           | Keterangan                            |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| `id`             | BIGINT UNSIGNED                                                               | PK, AUTO_INCREMENT                   |                                       |
| `proposal_id`    | BIGINT UNSIGNED                                                               | FK → proposals.id, UNIQUE, NOT NULL  | 1:1 dengan proposal                   |
| `gig_id`         | BIGINT UNSIGNED                                                               | FK → gigs.id, NOT NULL               | Denormalisasi untuk query cepat       |
| `client_id`      | BIGINT UNSIGNED                                                               | FK → users.id, NOT NULL              | Yang deposit                          |
| `freelancer_id`  | BIGINT UNSIGNED                                                               | FK → users.id, NOT NULL              | Yang akan menerima                    |
| `amount`         | INT UNSIGNED                                                                  | NOT NULL                             | Total yang di-hold (= bid_amount)     |
| `payment_method` | ENUM('bank_transfer','ewallet','cash')                                        | NOT NULL                             | Metode pembayaran                     |
| `status`         | ENUM('awaiting_payment','holding','released','settled','refunded','disputed') | NOT NULL, DEFAULT 'awaiting_payment' | State machine escrow                  |
| `held_at`        | TIMESTAMP                                                                     | NULL                                 | Kapan dana mulai di-hold              |
| `released_at`    | TIMESTAMP                                                                     | NULL                                 | Kapan dana dirilis oleh client        |
| `settled_at`     | TIMESTAMP                                                                     | NULL                                 | Kapan dana masuk wallet freelancer    |
| `notes`          | TEXT                                                                          | NULL                                 | Catatan tambahan (alasan refund, dll) |
| `created_at`     | TIMESTAMP                                                                     | NULL                                 |                                       |
| `updated_at`     | TIMESTAMP                                                                     | NULL                                 |                                       |

**State Machine:**

```
awaiting_payment → holding → released → settled
                    ↓
                  refunded  (gig cancelled setelah deposit)
                    ↓
                  disputed  (ada komplain — fitur lanjutan)
```

**Khusus metode cash:**

- Escrow langsung dibuat dengan status `holding` saat proposal accepted
- Tidak ada aliran dana ke platform
- `released_at` diisi saat client konfirmasi bayar di tempat
- Wallet freelancer **tidak** ditambah (karena bayar langsung)

**Relasi Eloquent:**

```php
public function proposal(): BelongsTo
public function gig(): BelongsTo
public function client(): BelongsTo
public function freelancer(): BelongsTo
public function payments(): HasMany
```

---

### 7. `payments`

> Log transaksi keuangan terkait escrow (deposit, refund, settlement).

| Kolom            | Tipe                                            | Constraint                  | Keterangan                |
| ---------------- | ----------------------------------------------- | --------------------------- | ------------------------- |
| `id`             | BIGINT UNSIGNED                                 | PK, AUTO_INCREMENT          |                           |
| `escrow_id`      | BIGINT UNSIGNED                                 | FK → escrows.id, NOT NULL   |                           |
| `user_id`        | BIGINT UNSIGNED                                 | FK → users.id, NOT NULL     | Siapa yang bayar/terima   |
| `type`           | ENUM('deposit','release','refund','settlement') | NOT NULL                    | Jenis transaksi           |
| `amount`         | INT UNSIGNED                                    | NOT NULL                    |                           |
| `payment_method` | ENUM('bank_transfer','ewallet','cash')          | NOT NULL                    |                           |
| `status`         | ENUM('pending','success','failed')              | NOT NULL, DEFAULT 'pending' |                           |
| `reference_code` | VARCHAR(100)                                    | UNIQUE, NULL                | Kode unik transaksi       |
| `paid_at`        | TIMESTAMP                                       | NULL                        | Kapan pembayaran berhasil |
| `created_at`     | TIMESTAMP                                       | NULL                        |                           |
| `updated_at`     | TIMESTAMP                                       | NULL                        |                           |

**Relasi Eloquent:**

```php
public function escrow(): BelongsTo
public function user(): BelongsTo
```

---

### 8. `wallets`

> Saldo wallet freelancer untuk menampung dana dari escrow yang sudah settled.

| Kolom        | Tipe            | Constraint                      | Keterangan         |
| ------------ | --------------- | ------------------------------- | ------------------ |
| `id`         | BIGINT UNSIGNED | PK, AUTO_INCREMENT              |                    |
| `user_id`    | BIGINT UNSIGNED | FK → users.id, UNIQUE, NOT NULL | 1:1 dengan user    |
| `balance`    | INT UNSIGNED    | NOT NULL, DEFAULT 0             | Saldo dalam rupiah |
| `created_at` | TIMESTAMP       | NULL                            |                    |
| `updated_at` | TIMESTAMP       | NULL                            |                    |

**Catatan**: Wallet hanya dimiliki freelancer (dibuat saat onboarding freelancer).

**Relasi Eloquent:**

```php
public function user(): BelongsTo
```

---

### 9. `personal_access_tokens`

> Dikelola otomatis oleh Laravel Sanctum.

---

## C. Relasi Antar Tabel

### One-to-One

| Parent      | Child      | ON DELETE |
| ----------- | ---------- | --------- |
| `users`     | `profiles` | CASCADE   |
| `users`     | `wallets`  | CASCADE   |
| `proposals` | `escrows`  | RESTRICT  |

### One-to-Many

| Parent (1)           | Child (N)   | Keterangan                              |
| -------------------- | ----------- | --------------------------------------- |
| `users` (client)     | `gigs`      | 1 client bisa posting banyak gig        |
| `users` (freelancer) | `proposals` | 1 freelancer bisa kirim banyak proposal |
| `categories`         | `gigs`      | 1 kategori bisa ada banyak gig          |
| `gigs`               | `proposals` | 1 gig menerima banyak proposal          |
| `escrows`            | `payments`  | 1 escrow punya banyak payment log       |

---

## D. Migration Order

```
1. users
2. categories
3. profiles          (FK → users)
4. wallets           (FK → users)
5. gigs              (FK → users, categories)
6. proposals         (FK → users, gigs)
7. escrows           (FK → proposals, gigs, users x2)
8. payments          (FK → escrows, users)
```

---

## E. Business Rules

| Rule                                               | Implementasi                                        |
| -------------------------------------------------- | --------------------------------------------------- |
| Freelancer tidak bisa apply gig sendiri            | `$gig->client_id !== auth()->id()`                  |
| Tidak bisa apply gig bukan `open`                  | Check status sebelum INSERT                         |
| Tidak bisa apply dua kali                          | `UNIQUE(gig_id, freelancer_id)`                     |
| Hanya pemilik gig bisa terima/tolak                | `$gig->client_id === auth()->id()`                  |
| Escrow dibuat saat proposal diterima               | `ProposalController@accept`                         |
| Cash langsung set escrow ke `holding`              | Set `held_at` = now(), tanpa payment record deposit |
| Dana wallet hanya naik saat escrow `settled`       | `EscrowController@settle`                           |
| Refund hanya bisa jika escrow masih `holding`      | Check status sebelum refund                         |
| Login Google: cek `google_id`, buat user jika baru | `GoogleAuthController`                              |
