# 📊 ERD: Platform Gig Lokal (SIKAGIG)

> **Total Tabel**: 14 tabel MySQL
> **Database**: MySQL | **ORM**: Laravel Eloquent
> **Auth**: Email + OTP (tidak ada password, tidak ada Google OAuth)
> **Role**: `user` (bisa posting & mengerjakan gig) | `super_admin`
> **NIM**: CHAR(13), tepat 13 digit angka, UNIQUE global

---

## A. Diagram Relasi

```
                         ┌─────────────────────────┐
                         │          users          │
                         │   (email + OTP login)   │
                         └───────────┬─────────────┘
     ┌──────────┬─────────────┬──────┴──────┬──────────────┬─────────────┐
1:1  ▼     1:N  ▼        1:N  ▼        1:1  ▼         1:N  ▼        1:N  ▼
┌─────────┐ ┌──────┐  ┌──────────┐ ┌─────────┐ ┌──────────────┐ ┌────────────────┐
│profiles │ │ gigs │  │proposals │ │ wallets │ │ suspend_logs │ │ notifications  │
└─────────┘ └──┬───┘  └────┬─────┘ └─────────┘ └──────────────┘ └────────────────┘
               │            │
          1:1  ▼       1:1  ▼
        ┌────────────────────────┐
        │        escrows         │
        └──────────┬─────────────┘
              1:N  ▼
        ┌────────────────────────┐
        │        payments        │
        └────────────────────────┘

proposals ──1:1──► conversations ──1:N──► messages
gigs      ──N:1──► categories
users     ──1:N──► otp_codes  (via email, bukan FK)
```

---

## B. Detail Tabel & Kolom

### 1. `users`

> Satu akun bisa sekaligus **posting gig** (sebagai pemberi kerja) dan
> **mengerjakan gig** (sebagai pengerjaan). Tidak ada pemisahan role client/freelancer.

| Kolom               | Tipe                       | Constraint               | Keterangan                     |
| ------------------- | -------------------------- | ------------------------ | ------------------------------ |
| `id`                | BIGINT UNSIGNED            | PK, AUTO_INCREMENT       |                                |
| `email`             | VARCHAR(255)               | UNIQUE, NOT NULL         | Identifier login               |
| `role`              | ENUM('user','super_admin') | NOT NULL, DEFAULT 'user' | user = pengguna biasa          |
| `is_suspended`      | TINYINT(1)                 | NOT NULL, DEFAULT 0      | 1 = disuspend oleh super_admin |
| `suspended_at`      | TIMESTAMP                  | NULL                     |                                |
| `suspended_reason`  | TEXT                       | NULL                     |                                |
| `email_verified_at` | TIMESTAMP                  | NULL                     |                                |
| `remember_token`    | VARCHAR(100)               | NULL                     | Laravel default                |
| `created_at`        | TIMESTAMP                  | NULL                     |                                |
| `updated_at`        | TIMESTAMP                  | NULL                     |                                |

**Relasi Eloquent:**

```php
public function profile(): HasOne
public function wallet(): HasOne
public function gigs(): HasMany           // sebagai pemberi kerja (client_id)
public function proposals(): HasMany      // sebagai pengerjaan (user_id)
public function notifications(): HasMany
public function tokens()                  // Sanctum
```

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

> Satu user punya satu profil. `is_profile_complete = 1` (name terisi) wajib
> sebelum bisa posting gig. Untuk kirim proposal, tambahan `nim` dan `faculty`
> juga harus terisi (dicek di backend, bukan di kolom flag terpisah).

| Kolom                 | Tipe                                     | Constraint                      | Keterangan                                                      |
| --------------------- | ---------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `id`                  | BIGINT UNSIGNED                          | PK, AUTO_INCREMENT              |                                                                 |
| `user_id`             | BIGINT UNSIGNED                          | FK → users.id, UNIQUE, NOT NULL | 1:1                                                             |
| `name`                | VARCHAR(100)                             | NULL                            | Wajib sebelum `is_profile_complete = 1`                         |
| `avatar_url`          | VARCHAR(255)                             | NULL                            | Opsional semua user                                             |
| `bio`                 | TEXT                                     | NULL                            | Opsional                                                        |
| `location`            | VARCHAR(100)                             | NULL                            | Opsional                                                        |
| `nim`                 | CHAR(13)                                 | UNIQUE, NULL                    | Opsional kolom, **wajib bisnis** untuk kirim proposal           |
| `faculty`             | VARCHAR(100)                             | NULL                            | Opsional kolom, **wajib bisnis** untuk kirim proposal           |
| `headline`            | VARCHAR(150)                             | NULL                            | Opsional, relevan jika sering mengerjakan gig                   |
| `skills`              | JSON                                     | NULL                            | Opsional                                                        |
| `experience_level`    | ENUM('beginner','intermediate','expert') | NULL                            | Opsional                                                        |
| `portfolio_url`       | VARCHAR(255)                             | NULL                            | Opsional                                                        |
| `is_profile_complete` | TINYINT(1)                               | NOT NULL, DEFAULT 0             | 1 = `name` tidak NULL. Wajib untuk posting gig & kirim proposal |
| `created_at`          | TIMESTAMP                                | NULL                            |                                                                 |
| `updated_at`          | TIMESTAMP                                | NULL                            |                                                                 |

**Constraint penting:**

```sql
UNIQUE KEY profiles_nim_unique (nim)
CHECK (nim IS NULL OR nim REGEXP '^[0-9]{13}$')
```

**Logic `is_profile_complete`:**

```
Posting gig    → is_profile_complete = 1  (cukup name terisi)
Kirim proposal → is_profile_complete = 1  AND nim IS NOT NULL AND faculty IS NOT NULL
                 (dicek di ProposalController, bukan kolom flag terpisah)
```

---

### 4. `suspend_logs`

| Kolom            | Tipe                        | Constraint              | Keterangan           |
| ---------------- | --------------------------- | ----------------------- | -------------------- |
| `id`             | BIGINT UNSIGNED             | PK, AUTO_INCREMENT      |                      |
| `target_user_id` | BIGINT UNSIGNED             | FK → users.id, NOT NULL | User yang di-suspend |
| `admin_id`       | BIGINT UNSIGNED             | FK → users.id, NOT NULL | Super admin pelaku   |
| `action`         | ENUM('suspend','unsuspend') | NOT NULL                |                      |
| `reason`         | TEXT                        | NULL                    | Wajib saat suspend   |
| `created_at`     | TIMESTAMP                   | NULL                    |                      |

---

### 5. `categories`

| Kolom        | Tipe            | Constraint       |
| ------------ | --------------- | ---------------- |
| `id`         | BIGINT UNSIGNED | PK               |
| `name`       | VARCHAR(100)    | UNIQUE, NOT NULL |
| `slug`       | VARCHAR(100)    | UNIQUE, NOT NULL |
| `created_at` | TIMESTAMP       | NULL             |
| `updated_at` | TIMESTAMP       | NULL             |

---

### 6. `wallets`

> Semua user bisa punya wallet karena siapapun bisa mengerjakan gig.

| Kolom        | Tipe            | Constraint            | Keterangan         |
| ------------ | --------------- | --------------------- | ------------------ |
| `id`         | BIGINT UNSIGNED | PK                    |                    |
| `user_id`    | BIGINT UNSIGNED | FK → users.id, UNIQUE | 1:1 dengan user    |
| `balance`    | INT UNSIGNED    | NOT NULL, DEFAULT 0   | Saldo dalam rupiah |
| `created_at` | TIMESTAMP       | NULL                  |                    |
| `updated_at` | TIMESTAMP       | NULL                  |                    |

---

### 7. `gigs`

| Kolom         | Tipe                                               | Constraint                   | Keterangan               |
| ------------- | -------------------------------------------------- | ---------------------------- | ------------------------ |
| `id`          | BIGINT UNSIGNED                                    | PK                           |                          |
| `client_id`   | BIGINT UNSIGNED                                    | FK → users.id, NOT NULL      | User yang memposting gig |
| `category_id` | BIGINT UNSIGNED                                    | FK → categories.id, NOT NULL |                          |
| `title`       | VARCHAR(255)                                       | NOT NULL                     |                          |
| `description` | TEXT                                               | NOT NULL                     |                          |
| `budget`      | INT UNSIGNED                                       | NOT NULL                     | Rupiah                   |
| `deadline`    | DATE                                               | NULL                         |                          |
| `slots`       | TINYINT UNSIGNED                                   | NOT NULL, DEFAULT 1          |                          |
| `is_onsite`   | TINYINT(1)                                         | NOT NULL, DEFAULT 0          |                          |
| `location`    | VARCHAR(150)                                       | NULL                         |                          |
| `status`      | ENUM('open','in_progress','completed','cancelled') | NOT NULL, DEFAULT 'open'     |                          |
| `created_at`  | TIMESTAMP                                          | NULL                         |                          |
| `updated_at`  | TIMESTAMP                                          | NULL                         |                          |

---

### 8. `proposals`

> `user_id` menggantikan `freelancer_id` — karena user mana saja bisa melamar,
> tidak terbatas role freelancer.
> Satu user tidak bisa melamar gig miliknya sendiri (dicek di backend).

| Kolom          | Tipe                                              | Constraint                  | Keterangan                     |
| -------------- | ------------------------------------------------- | --------------------------- | ------------------------------ |
| `id`           | BIGINT UNSIGNED                                   | PK                          |                                |
| `gig_id`       | BIGINT UNSIGNED                                   | FK → gigs.id, NOT NULL      |                                |
| `user_id`      | BIGINT UNSIGNED                                   | FK → users.id, NOT NULL     | User yang melamar (pengerjaan) |
| `cover_letter` | TEXT                                              | NOT NULL                    |                                |
| `bid_amount`   | INT UNSIGNED                                      | NOT NULL                    | Tawaran harga rupiah           |
| `status`       | ENUM('pending','accepted','rejected','withdrawn') | NOT NULL, DEFAULT 'pending' |                                |
| `created_at`   | TIMESTAMP                                         | NULL                        |                                |
| `updated_at`   | TIMESTAMP                                         | NULL                        |                                |

**Unique Constraint:** `UNIQUE(gig_id, user_id)` — satu user hanya bisa melamar sekali per gig

---

### 9. `escrows`

> `worker_id` menggantikan `freelancer_id`.
> `client_id` = user yang memposting gig (pemberi kerja).
> `worker_id` = user yang proposalnya diterima (pengerjaan).
> Kedua bisa merupakan user yang sama di deal berbeda (satu user bisa dua peran).

| Kolom            | Tipe                                                                          | Constraint                           | Keterangan                      |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- |
| `id`             | BIGINT UNSIGNED                                                               | PK                                   |                                 |
| `proposal_id`    | BIGINT UNSIGNED                                                               | FK → proposals.id, UNIQUE, NOT NULL  | 1:1 dengan proposal             |
| `gig_id`         | BIGINT UNSIGNED                                                               | FK → gigs.id, NOT NULL               | Denormalisasi untuk query cepat |
| `client_id`      | BIGINT UNSIGNED                                                               | FK → users.id, NOT NULL              | Pemberi kerja                   |
| `worker_id`      | BIGINT UNSIGNED                                                               | FK → users.id, NOT NULL              | Pengerjaan                      |
| `amount`         | INT UNSIGNED                                                                  | NOT NULL                             | = bid_amount                    |
| `payment_method` | ENUM('bank_transfer','ewallet','cash')                                        | NOT NULL                             |                                 |
| `status`         | ENUM('awaiting_payment','holding','released','settled','refunded','disputed') | NOT NULL, DEFAULT 'awaiting_payment' |                                 |
| `held_at`        | TIMESTAMP                                                                     | NULL                                 |                                 |
| `released_at`    | TIMESTAMP                                                                     | NULL                                 |                                 |
| `settled_at`     | TIMESTAMP                                                                     | NULL                                 |                                 |
| `notes`          | TEXT                                                                          | NULL                                 |                                 |
| `created_at`     | TIMESTAMP                                                                     | NULL                                 |                                 |
| `updated_at`     | TIMESTAMP                                                                     | NULL                                 |                                 |

**State Machine:**

```
Non-Cash: awaiting_payment → holding → released → settled
Cash    : holding (langsung) → released
Dibatal : → refunded
Sengketa: → disputed  (post-MVP)
```

**Cash vs Non-Cash:**

- Cash: escrow langsung `holding` saat proposal accepted, `wallet.balance` **tidak** bertambah
- Non-Cash: mulai `awaiting_payment` → deposit → `holding` → release → `settled` → wallet bertambah

---

### 10. `payments`

| Kolom            | Tipe                                            | Constraint                  | Keterangan              |
| ---------------- | ----------------------------------------------- | --------------------------- | ----------------------- |
| `id`             | BIGINT UNSIGNED                                 | PK                          |                         |
| `escrow_id`      | BIGINT UNSIGNED                                 | FK → escrows.id, NOT NULL   |                         |
| `user_id`        | BIGINT UNSIGNED                                 | FK → users.id, NOT NULL     | Siapa yang bayar/terima |
| `type`           | ENUM('deposit','release','refund','settlement') | NOT NULL                    |                         |
| `amount`         | INT UNSIGNED                                    | NOT NULL                    |                         |
| `payment_method` | ENUM('bank_transfer','ewallet','cash')          | NOT NULL                    |                         |
| `status`         | ENUM('pending','success','failed')              | NOT NULL, DEFAULT 'pending' |                         |
| `reference_code` | VARCHAR(100)                                    | UNIQUE, NULL                |                         |
| `paid_at`        | TIMESTAMP                                       | NULL                        |                         |
| `created_at`     | TIMESTAMP                                       | NULL                        |                         |
| `updated_at`     | TIMESTAMP                                       | NULL                        |                         |

---

### 11. `notifications`

> Notifikasi in-app. Dibuat otomatis oleh backend saat event tertentu terjadi.

| Kolom        | Tipe            | Constraint              | Keterangan                                                       |
| ------------ | --------------- | ----------------------- | ---------------------------------------------------------------- |
| `id`         | BIGINT UNSIGNED | PK, AUTO_INCREMENT      |                                                                  |
| `user_id`    | BIGINT UNSIGNED | FK → users.id, NOT NULL | Penerima notifikasi                                              |
| `type`       | VARCHAR(50)     | NOT NULL                | e.g. `proposal_received`, `proposal_accepted`, `escrow_released` |
| `title`      | VARCHAR(150)    | NOT NULL                | Judul notif                                                      |
| `body`       | TEXT            | NOT NULL                | Isi notif                                                        |
| `data`       | JSON            | NULL                    | Payload tambahan (gig_id, proposal_id, dll)                      |
| `is_read`    | TINYINT(1)      | NOT NULL, DEFAULT 0     | 0 = belum dibaca                                                 |
| `read_at`    | TIMESTAMP       | NULL                    |                                                                  |
| `created_at` | TIMESTAMP       | NULL                    |                                                                  |
| `updated_at` | TIMESTAMP       | NULL                    |                                                                  |

**Event yang trigger notifikasi:**

```
proposal_received    → dikirim ke client saat ada proposal masuk ke gignya
proposal_accepted    → dikirim ke user saat proposalnya diterima
proposal_rejected    → dikirim ke user saat proposalnya ditolak
escrow_released      → dikirim ke worker saat client release dana
```

---

### 12. `conversations`

> Dibuat **otomatis** saat proposal diterima (`ProposalController@accept`).
> Satu proposal = satu percakapan (UNIQUE `proposal_id`).
> Tidak bisa dibuat manual via endpoint.

| Kolom             | Tipe            | Constraint                          | Keterangan                                |
| ----------------- | --------------- | ----------------------------------- | ----------------------------------------- |
| `id`              | BIGINT UNSIGNED | PK, AUTO_INCREMENT                  |                                           |
| `proposal_id`     | BIGINT UNSIGNED | FK → proposals.id, UNIQUE, NOT NULL | 1:1 — 1 proposal = 1 percakapan           |
| `gig_id`          | BIGINT UNSIGNED | FK → gigs.id, NOT NULL              | Denormalisasi untuk tampil di list        |
| `client_id`       | BIGINT UNSIGNED | FK → users.id, NOT NULL             | User pemberi kerja                        |
| `worker_id`       | BIGINT UNSIGNED | FK → users.id, NOT NULL             | User pengerjaan                           |
| `last_message_at` | TIMESTAMP       | NULL                                | Update saat ada pesan baru, untuk sorting |
| `created_at`      | TIMESTAMP       | NULL                                |                                           |
| `updated_at`      | TIMESTAMP       | NULL                                |                                           |

**Relasi Eloquent:**

```php
public function proposal(): BelongsTo
public function gig(): BelongsTo
public function client(): BelongsTo(User::class, 'client_id')
public function worker(): BelongsTo(User::class, 'worker_id')
public function messages(): HasMany
```

---

### 13. `messages`

| Kolom             | Tipe            | Constraint                      | Keterangan                       |
| ----------------- | --------------- | ------------------------------- | -------------------------------- |
| `id`              | BIGINT UNSIGNED | PK, AUTO_INCREMENT              |                                  |
| `conversation_id` | BIGINT UNSIGNED | FK → conversations.id, NOT NULL | CASCADE delete                   |
| `sender_id`       | BIGINT UNSIGNED | FK → users.id, NOT NULL         | RESTRICT delete                  |
| `body`            | TEXT            | NOT NULL                        | Max 2000 karakter (validasi app) |
| `is_read`         | TINYINT(1)      | NOT NULL, DEFAULT 0             | 0 → 1 saja, tidak bisa balik     |
| `created_at`      | TIMESTAMP       | NULL                            |                                  |
| `updated_at`      | TIMESTAMP       | NULL                            |                                  |

**Index penting:**

```sql
KEY messages_conversation_created (conversation_id, created_at)  -- query history terurut
KEY messages_is_read_index        (is_read)                      -- hitung unread count
```

---

### 14. `personal_access_tokens`

Dikelola otomatis oleh Laravel Sanctum.

---

## C. Relasi Antar Tabel

### One-to-One

| Parent      | Child           | ON DELETE |
| ----------- | --------------- | --------- |
| `users`     | `profiles`      | CASCADE   |
| `users`     | `wallets`       | CASCADE   |
| `proposals` | `escrows`       | RESTRICT  |
| `proposals` | `conversations` | RESTRICT  |

### One-to-Many

| Parent (1)          | Child (N)       | Keterangan                          |
| ------------------- | --------------- | ----------------------------------- |
| `users` (client_id) | `gigs`          | 1 user bisa posting banyak gig      |
| `users` (user_id)   | `proposals`     | 1 user bisa melamar banyak gig      |
| `users`             | `notifications` | 1 user punya banyak notifikasi      |
| `categories`        | `gigs`          | 1 kategori bisa banyak gig          |
| `gigs`              | `proposals`     | 1 gig menerima banyak proposal      |
| `escrows`           | `payments`      | 1 escrow punya banyak log transaksi |
| `conversations`     | `messages`      | 1 percakapan punya banyak pesan     |

---

## D. Migration Order

```
1.  users
2.  otp_codes        (tidak ada FK — email bukan FK)
3.  categories
4.  profiles         (FK → users)
5.  suspend_logs     (FK → users × 2)
6.  wallets          (FK → users)
7.  notifications    (FK → users)
8.  gigs             (FK → users, categories)
9.  proposals        (FK → users, gigs)
10. escrows          (FK → proposals, gigs, users × 2)
11. payments         (FK → escrows, users)
12. conversations    (FK → proposals, gigs, users × 2)
13. messages         (FK → conversations, users)
```

---

## E. Business Rules

| Rule                                               | Implementasi                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| User tidak bisa melamar gig sendiri                | `$proposal->user_id !== $gig->client_id`                               |
| Tidak bisa melamar gig bukan `open`                | Check status sebelum INSERT                                            |
| Tidak bisa melamar dua kali                        | `UNIQUE(gig_id, user_id)`                                              |
| Hanya pemilik gig yang bisa terima/tolak proposal  | `$gig->client_id === auth()->id()`                                     |
| Kirim proposal butuh nim + faculty                 | `ProfileController` auto-set + `ProposalController` cek sebelum INSERT |
| NIM harus tepat 13 digit angka                     | CHECK constraint + `regex:/^\d{13}$/` di Form Request                  |
| NIM tidak boleh sama antar user                    | `UNIQUE KEY profiles_nim_unique`                                       |
| Escrow dibuat saat proposal diterima               | `ProposalController@accept`                                            |
| Conversation dibuat bersamaan escrow               | `ProposalController@accept` — `Conversation::firstOrCreate()`          |
| Cash langsung set escrow ke `holding`              | Set `held_at = now()`, skip deposit payment record                     |
| Wallet hanya naik saat escrow `settled` (non-cash) | `EscrowController@settle` — skip jika `payment_method === 'cash'`      |
| Suspended user tidak bisa login                    | Cek `is_suspended` setelah OTP valid di `AuthController`               |
| Suspended user tidak bisa kirim pesan              | Guard di `ChatController::sendMessage`                                 |
| Hanya participant yang bisa akses percakapan       | Policy `ConversationPolicy::view` — cek `client_id` atau `worker_id`   |

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
            'regex:/^\d{13}$/',                           // tepat 13 digit angka
            "unique:profiles,nim,{$userId},user_id",      // unik kecuali milik sendiri
        ],
        'name'    => ['required', 'string', 'max:100'],
        'faculty' => ['nullable', 'string', 'max:100'],
    ];
}
```
