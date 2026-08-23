# 💬 Chat System Plan — SikaGig Real-time Messaging

> Dokumen ini adalah planning implementasi fitur chat sebelum coding dimulai.
> Disesuaikan dengan skema database `sikagig.sql` yang sudah ada.

---

## 1. Konteks & Posisi di Roadmap

Fitur chat berada di **Phase 8** (setelah Escrow selesai), karena:

- Chat hanya bisa dibuka setelah proposal **diterima** → escrow/deal sudah ada
- Butuh data `proposals.gig_id`, `proposals.freelancer_id`, dan `gigs.client_id`
- Koneksi ke tabel `users` dan `profiles` sudah ada di skema

**Dependency yang harus sudah selesai sebelum chat dikerjakan:**

- ✅ `users` table — ada di sikagig.sql
- ✅ `profiles` table — ada (kolom `name`, `avatar_url` dipakai chat)
- ✅ `gigs` table — ada (kolom `id`, `title`, `client_id`)
- ✅ `proposals` table — ada (kolom `id`, `gig_id`, `freelancer_id`, `status`)
- ⏳ `ProposalController@accept` — harus ada sebelum percakapan bisa dibuat

---

## 2. Analisis Database Existing

Dari `sikagig.sql`, berikut kolom yang dipakai oleh sistem chat:

### `users` (sudah ada)

| Kolom          | Tipe                                      | Dipakai chat untuk                           |
| -------------- | ----------------------------------------- | -------------------------------------------- |
| `id`           | BIGINT UNSIGNED                           | FK di conversations & messages               |
| `email`        | VARCHAR(255)                              | Identify user                                |
| `role`         | ENUM('client','freelancer','super_admin') | Tampil di `other_participant.role`           |
| `is_suspended` | TINYINT(1)                                | Guard `sendMessage` policy — suspended = 403 |

### `profiles` (sudah ada)

| Kolom        | Tipe            | Dipakai chat untuk                           |
| ------------ | --------------- | -------------------------------------------- |
| `user_id`    | BIGINT UNSIGNED | Join ke users                                |
| `name`       | VARCHAR(100)    | Tampil di conversation list & message bubble |
| `avatar_url` | VARCHAR(255)    | Avatar di sidebar & bubble                   |

### `gigs` (sudah ada)

| Kolom       | Tipe            | Dipakai chat untuk                           |
| ----------- | --------------- | -------------------------------------------- |
| `id`        | BIGINT UNSIGNED | FK di conversations                          |
| `title`     | VARCHAR(255)    | Tampil di conversation header & list         |
| `client_id` | BIGINT UNSIGNED | Dipakai saat buat conversation (client side) |

### `proposals` (sudah ada)

| Kolom           | Tipe            | Dipakai chat untuk                           |
| --------------- | --------------- | -------------------------------------------- |
| `id`            | BIGINT UNSIGNED | FK UNIQUE di conversations                   |
| `gig_id`        | BIGINT UNSIGNED | Dipakai saat buat conversation               |
| `freelancer_id` | BIGINT UNSIGNED | Dipakai saat buat conversation               |
| `status`        | ENUM            | Trigger: saat `accepted` → buat conversation |

---

## 3. Tabel Baru yang Harus Ditambahkan

### 3a. Tabel `conversations`

**Posisi di urutan FK:** Harus dibuat setelah `proposals`, `gigs`, `users`.

```sql
CREATE TABLE `conversations` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `proposal_id`     BIGINT UNSIGNED NOT NULL
        COMMENT 'UNIQUE — 1 proposal hanya boleh punya 1 percakapan',
    `gig_id`          BIGINT UNSIGNED NOT NULL
        COMMENT 'Denormalisasi untuk tampil cepat di conversation list',
    `client_id`       BIGINT UNSIGNED NOT NULL,
    `freelancer_id`   BIGINT UNSIGNED NOT NULL,
    `last_message_at` TIMESTAMP NULL DEFAULT NULL
        COMMENT 'Diupdate setiap ada pesan baru. Dipakai untuk urutan list.',
    `created_at`      TIMESTAMP NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversations_proposal_id_unique` (`proposal_id`),
    KEY `conversations_client_id_index`      (`client_id`),
    KEY `conversations_freelancer_id_index`  (`freelancer_id`),
    KEY `conversations_last_message_at_index`(`last_message_at`),
    CONSTRAINT `conversations_proposal_id_foreign`
        FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_gig_id_foreign`
        FOREIGN KEY (`gig_id`) REFERENCES `gigs` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_freelancer_id_foreign`
        FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Catatan penting:**

- `ON DELETE RESTRICT` di semua FK — supaya data history chat tidak hilang kalau proposal/gig dihapus
- `proposal_id` UNIQUE → jaminan 1 proposal = 1 percakapan (tidak bisa duplikat)
- `last_message_at` diisi manual saat ada pesan masuk, bukan `updated_at`

### 3b. Tabel `messages`

**Posisi di urutan FK:** Harus dibuat setelah `conversations` dan `users`.

```sql
CREATE TABLE `messages` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id`       BIGINT UNSIGNED NOT NULL,
    `body`            TEXT NOT NULL,
    `is_read`         TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '0 = belum dibaca, 1 = sudah dibaca. Hanya 0→1, tidak bisa balik.',
    `created_at`      TIMESTAMP NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `messages_conversation_id_created_at_index` (`conversation_id`, `created_at`)
        COMMENT 'Composite index untuk query history terurut waktu',
    KEY `messages_sender_id_index` (`sender_id`),
    KEY `messages_is_read_index`   (`is_read`),
    CONSTRAINT `messages_conversation_id_foreign`
        FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `messages_sender_id_foreign`
        FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Catatan penting:**

- `ON DELETE CASCADE` dari `conversations` → kalau percakapan dihapus, semua pesannya ikut
- `ON DELETE RESTRICT` dari `users` → user tidak bisa dihapus selama punya pesan
- Composite index `(conversation_id, created_at)` untuk query paginasi yang efisien

### 3c. Update `sikagig.sql`

Kedua tabel di atas harus ditambahkan ke `sikagig.sql` di bagian akhir schema (setelah payments), sebelum seed data, dengan DROP IF EXISTS di bagian awal file.

---

## 4. Cara Chat Dibuat (Trigger)

Chat **tidak** dibuat via endpoint manual. Dibuat otomatis saat `ProposalController@accept` dipanggil:

```
Client terima proposal (PATCH /api/proposals/{id}/status)
    ↓
proposals.status = 'accepted'
    ↓
Buat escrow record (Phase 6 plan.md)
    ↓
Buat conversation via Conversation::firstOrCreate(
    ['proposal_id' => $proposal->id],
    [
        'gig_id'        => $proposal->gig_id,
        'client_id'     => $proposal->gig->client_id,  ← dari relasi gig
        'freelancer_id' => $proposal->freelancer_id,
    ]
)
```

`firstOrCreate` memastikan kalau endpoint dipanggil dua kali, hanya 1 row yang ada.

---

## 5. Struktur File Baru (Backend)

```
apps/api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── ChatController.php          ← 5 method: index, show, messages, sendMessage, markRead
│   │   ├── Requests/
│   │   │   └── SendMessageRequest.php      ← validasi body: required|string|min:1|max:2000
│   │   └── Resources/
│   │       ├── ConversationListResource.php ← format list item (id, gig, other_participant, last_message, unread_count)
│   │       ├── ConversationResource.php     ← format single conversation
│   │       └── MessageResource.php          ← format satu pesan
│   ├── Models/
│   │   ├── Conversation.php                 ← relasi + helper otherParticipant() + hasParticipant()
│   │   └── Message.php                      ← relasi conversation + sender
│   ├── Events/
│   │   └── MessageSent.php                  ← ShouldBroadcastNow, channel: chat.{id}
│   └── Policies/
│       └── ConversationPolicy.php           ← view (participant check) + sendMessage (+ suspended check)
├── routes/
│   ├── api.php                              ← tambahkan chat routes di sini
│   └── channels.php                         ← authorization private channel chat.{id}
└── database/
    └── migrations/
        ├── 2025_01_01_000010_create_conversations_table.php  ← sudah dibuat
        └── 2025_01_01_000011_create_messages_table.php       ← sudah dibuat
```

---

## 6. Struktur File Baru (Frontend)

```
apps/web/src/
├── lib/
│   └── echo.js                           ← singleton Echo instance (Reverb broadcaster)
├── hooks/
│   └── useChat.js                        ← useChat() + useMessages()
├── components/
│   └── chat/
│       ├── ConversationItem.jsx          ← satu baris di sidebar
│       ├── ConversationList.jsx          ← sidebar kiri + skeleton + empty state
│       ├── MessageBubble.jsx             ← bubble kanan (sendiri) / kiri (lawan)
│       ├── MessageInput.jsx              ← input + tombol kirim (Enter / click)
│       ├── MessageThread.jsx             ← panel kanan: header + list bubble + input
│       └── ChatSkeleton.jsx              ← skeleton saat loading awal
└── pages/
    └── chat/
        └── ChatPage.jsx                  ← layout 2-pane desktop / 1-pane mobile
```

---

## 7. API Endpoints

| Method | Path                                    | Guard                                      | Fungsi                                                 |
| ------ | --------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| GET    | `/api/chat/conversations`               | auth:sanctum                               | List semua percakapan user (urut last_message_at desc) |
| GET    | `/api/chat/conversations/{id}`          | auth:sanctum + participant                 | Detail satu percakapan                                 |
| GET    | `/api/chat/conversations/{id}/messages` | auth:sanctum + participant                 | History pesan (paginate 50, asc) + auto mark read      |
| POST   | `/api/chat/conversations/{id}/messages` | auth:sanctum + participant + not_suspended | Kirim pesan baru                                       |
| POST   | `/api/chat/conversations/{id}/read`     | auth:sanctum + participant                 | Tandai semua pesan terbaca                             |

**Auth notes:**

- Semua endpoint butuh `auth:sanctum`
- Endpoint `{id}` butuh user adalah participant (client_id atau freelancer_id) → 403 kalau bukan
- Kirim pesan: freelancer yang `is_suspended = 1` dapat 403

---

## 8. Relasi Eloquent yang Dibutuhkan

### Di `Conversation` model:

```php
// Butuh model Proposal, Gig, User (sudah ada di project tapi belum dibuat)
proposal()    → belongsTo(Proposal::class)
gig()         → belongsTo(Gig::class)
client()      → belongsTo(User::class, 'client_id')
freelancer()  → belongsTo(User::class, 'freelancer_id')
messages()    → hasMany(Message::class)
```

### Di `Message` model:

```php
conversation() → belongsTo(Conversation::class)
sender()       → belongsTo(User::class, 'sender_id')
```

### Di `User` model (perlu ditambahkan):

```php
profile()    → hasOne(Profile::class)       ← untuk ambil name + avatar_url
```

### Di `Profile` model (perlu dibuat jika belum ada):

```php
user()       → belongsTo(User::class)
```

**Perhatian:** Dari `sikagig.sql`, tabel `profiles` sudah ada, tapi model Laravel `Profile.php` belum dibuat. Ini harus dibuat bersamaan dengan chat.

---

## 9. ConversationListResource — Logika Mapping

Dari satu row `conversations`, resource ini harus output:

```json
{
  "id": 1,
  "gig": {
    "id": 4,
    "title": "Bantu Buat PPT Presentasi"
  },
  "other_participant": {
    "id": 4,
    "name": "Rina Cahyani",           ← dari profiles.name
    "avatar_url": null,                ← dari profiles.avatar_url
    "role": "freelancer"               ← dari users.role
  },
  "last_message": {
    "body": "Oke siap...",             ← potong 100 karakter
    "created_at": "2025-01-10T14:32:00Z"
  },
  "unread_count": 2                    ← count messages WHERE is_read=0 AND sender_id != auth user
}
```

Ini butuh eager loading:

- `gig:id,title`
- `client:id,role` + `client.profile:user_id,name,avatar_url`
- `freelancer:id,role` + `freelancer.profile:user_id,name,avatar_url`
- `messages` (latest 1, untuk last_message)
- `withCount` messages untuk unread

---

## 10. Urutan Pengerjaan yang Direkomendasikan

### Backend (per fase):

**Fase B1 — Model & Migration (tidak ada coding controller)**

1. Tambah DDL `conversations` dan `messages` ke `sikagig.sql`
2. Buat/verifikasi migration file `conversations` dan `messages`
3. Buat `app/Models/Conversation.php` + relasi
4. Buat `app/Models/Message.php` + relasi
5. Buat `app/Models/Profile.php` (jika belum ada) + relasi ke User
6. Update `app/Models/User.php` — tambah relasi `profile()`
7. Jalankan `php artisan migrate` → verifikasi tabel terbuat

**Fase B2 — Authorization Layer** 8. Buat `app/Policies/ConversationPolicy.php` (view + sendMessage) 9. Daftarkan policy di `AppServiceProvider` 10. Buat `app/Http/Requests/SendMessageRequest.php`

**Fase B3 — Resources** 11. Buat `ConversationListResource.php` 12. Buat `ConversationResource.php` 13. Buat `MessageResource.php`

**Fase B4 — Controller & Routes** 14. Buat `ChatController.php` dengan 5 method 15. Tambahkan chat routes ke `routes/api.php` 16. Pastikan `bootstrap/app.php` sudah load `api.php`

**Fase B5 — Broadcasting** 17. Install `laravel/reverb` (`composer require`) 18. Jalankan `php artisan reverb:install` 19. Buat `app/Events/MessageSent.php` 20. Tambah channel auth ke `routes/channels.php` 21. Update `.env` + `.env.example` 22. Tambah `broadcast(...)` di `ChatController::sendMessage`

**Fase B6 — Proposal Hook** 23. Buat/update `ProposalController.php` — tambah `Conversation::firstOrCreate(...)` di method `accept`

### Frontend (per fase):

**Fase F1 — Package & Config**

1. `pnpm add laravel-echo pusher-js` dari `apps/web`
2. Buat `apps/web/src/lib/echo.js` — singleton Echo
3. Buat/update `apps/web/.env` + `.env.example` — Reverb vars

**Fase F2 — Hooks** 4. Buat `useChat.js` — `useChat()` dan `useMessages()` 5. Pastikan ada `useAuth()` context yang expose token

**Fase F3 — Komponen UI** 6. `ChatSkeleton.jsx` 7. `MessageBubble.jsx` 8. `MessageInput.jsx` 9. `ConversationItem.jsx` 10. `ConversationList.jsx` 11. `MessageThread.jsx`

**Fase F4 — Page & Routing** 12. `ChatPage.jsx` 13. Tambah route `/chat` dan `/chat/:conversationId` di router 14. Tambah link Chat di Navbar

---

## 11. Hal yang Perlu Dikonfirmasi Sebelum Coding

| Pertanyaan                                                | Implikasi                                               |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Apakah `Model/Profile.php` sudah ada?                     | Kalau belum, harus dibuat bersamaan                     |
| Apakah `Model/Proposal.php` sudah ada?                    | Conversation butuh relasi ke Proposal                   |
| Apakah `Model/Gig.php` sudah ada?                         | Conversation butuh relasi ke Gig                        |
| Apakah `routes/api.php` sudah ada?                        | Perlu ditambahkan — saat ini hanya ada `routes/web.php` |
| Apakah `routes/channels.php` sudah ada?                   | Perlu dibuat untuk Reverb channel auth                  |
| Apakah `AuthContext` + `useAuth()` sudah ada di frontend? | `useChat.js` butuh `token` dari sini                    |
| Apakah `ProtectedRoute.jsx` sudah ada?                    | Chat page butuh ini                                     |
| Apakah Redis tersedia di Laragon?                         | `QUEUE_CONNECTION=redis` butuh Redis running            |

---

## 12. Seed Data untuk Testing Chat

Dari `sikagig.sql`, data yang sudah ada dan bisa dipakai testing:

| Data                 | Detail                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Proposal accepted    | `proposals` id=1: gig_id=4, freelancer_id=4 (sika), client via gig_id=4 → client_id=2 (juragan) |
| Proposal pending     | `proposals` id=2: gig_id=1, freelancer_id=4 — belum accepted, tidak ada conversation            |
| Freelancer suspended | `users` id=6 (sika.suspended@example.com, is_suspended=1)                                       |
| Client 2             | `users` id=3 (juragan2@example.com) — non-participant untuk testing 403                         |

Untuk test chat:

1. Accept proposal id=1 via `PATCH /api/proposals/1/status {status: accepted}`
2. Ini harus trigger buat row di `conversations`
3. Baru bisa kirim pesan di conversation tersebut

---

## 13. Checklist Sebelum Merge

### Backend

- [ ] `conversations` dan `messages` table DDL ada di `sikagig.sql`
- [ ] Migration files terbuat dan sudah `php artisan migrate`
- [ ] `Conversation.php` model + relasi + helper methods
- [ ] `Message.php` model + relasi
- [ ] `Profile.php` model ada (atau update User dengan `profile()` hasOne)
- [ ] `ConversationPolicy` terdaftar di AppServiceProvider
- [ ] `SendMessageRequest` validasi body max 2000
- [ ] 3 Resource classes: ConversationList, Conversation, Message
- [ ] `ChatController` 5 method (index, show, messages, sendMessage, markRead)
- [ ] Chat routes di `routes/api.php` (prefix chat, middleware auth:sanctum)
- [ ] `routes/channels.php` ada dengan auth `chat.{conversationId}`
- [ ] `MessageSent` event: ShouldBroadcastNow, broadcastWith() lengkap
- [ ] `broadcast()->toOthers()` dipanggil di sendMessage
- [ ] `ProposalController@accept` memanggil `Conversation::firstOrCreate`
- [ ] `.env` dan `.env.example` sudah ada REVERB\_\* vars

### Frontend

- [ ] `laravel-echo` dan `pusher-js` ada di `package.json`
- [ ] `lib/echo.js` singleton berfungsi
- [ ] `.env` ada VITE*REVERB*\* vars
- [ ] `useChat()` dan `useMessages()` hook berfungsi
- [ ] Semua fetch pakai `Authorization: Bearer {token}`
- [ ] 6 komponen chat terbuat
- [ ] `ChatPage.jsx` layout 2-pane desktop + 1-pane mobile
- [ ] Route `/chat` dan `/chat/:conversationId` terdaftar
- [ ] Navbar ada link Chat untuk user yang login
- [ ] `wsStatus === 'disconnected'` tampilkan banner kuning

---

## 14. Masalah yang Sudah Diantisipasi

| Masalah                                           | Solusi                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Migration gagal karena FK ke tabel yang belum ada | Skema dari SQL sudah diimport langsung, migration hanya tambah conversations & messages |
| `.env` pakai SQLite tapi skema pakai MySQL        | Update `.env` ke MySQL sebelum migrate                                                  |
| `routes/api.php` belum ada                        | Buat file baru + daftarkan di `bootstrap/app.php`                                       |
| `channels.php` belum ada                          | Buat file baru + daftarkan di `bootstrap/app.php`                                       |
| `Profile.php` model belum ada                     | Buat sekalian saat fase B1                                                              |
| Token dari auth context di frontend               | Pastikan `useAuth()` ada dan expose `token`                                             |
| CORS untuk WebSocket Reverb                       | Konfigurasi CORS di Laravel untuk endpoint `/api/broadcasting/auth`                     |
