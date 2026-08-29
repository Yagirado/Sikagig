# 💬 Chat System Plan — SikaGig Messaging

> Dokumen ini adalah planning implementasi fitur chat.
> Disesuaikan dengan skema database `sikagig.sql` yang sudah ada.
> **Owner**: Nugi

---

## 1. Konteks & Posisi di Roadmap

Chat berada di **Phase 12** (paralel dengan Phase 9-11), karena:

- Chat hanya bisa dibuka setelah proposal **diterima** → conversation dibuat otomatis bersamaan escrow
- Data yang dibutuhkan: `proposals`, `gigs`, `users`, `profiles` — semua sudah ada
- `Conversation` dibuat di `ProposalController@accept` (Ray), bukan endpoint manual

**Dependency yang harus sudah selesai sebelum chat dikerjakan:**

- ✅ `users` table
- ✅ `profiles` table (`name`, `avatar_url` dipakai di chat)
- ✅ `gigs` table (`title` tampil di conversation header)
- ✅ `proposals` table + `ProposalController@accept` (Ray)
- ✅ `conversations`, `messages` table (sudah di `sikagig.sql`)
- ✅ Auth token dari Nugi sendiri (sudah selesai di phase sebelumnya)

---

## 2. Kolom DB yang Dipakai Sistem Chat

### `users`

| Kolom          | Dipakai chat untuk                               |
| -------------- | ------------------------------------------------ |
| `id`           | FK di conversations & messages                   |
| `role`         | Tampil di response API (`user` / `super_admin`)  |
| `is_suspended` | Guard `sendMessage` — suspended tidak bisa kirim |

### `profiles`

| Kolom        | Dipakai chat untuk                           |
| ------------ | -------------------------------------------- |
| `user_id`    | Join ke users                                |
| `name`       | Tampil di conversation list & message bubble |
| `avatar_url` | Avatar di sidebar & bubble                   |

### `gigs`

| Kolom       | Dipakai chat untuk                   |
| ----------- | ------------------------------------ |
| `id`        | FK di conversations                  |
| `title`     | Tampil di conversation header & list |
| `client_id` | Dipakai saat conversation dibuat     |

### `proposals`

| Kolom     | Dipakai chat untuk                           |
| --------- | -------------------------------------------- |
| `id`      | FK UNIQUE di conversations                   |
| `gig_id`  | Dipakai saat conversation dibuat             |
| `user_id` | Dipakai saat conversation dibuat (worker)    |
| `status`  | Trigger: saat `accepted` → buat conversation |

---

## 3. Schema Tabel Chat (sudah ada di `sikagig.sql`)

### `conversations`

```sql
CREATE TABLE `conversations` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `proposal_id`     BIGINT UNSIGNED NOT NULL
        COMMENT '1 proposal hanya boleh punya 1 percakapan',
    `gig_id`          BIGINT UNSIGNED NOT NULL
        COMMENT 'Denormalisasi untuk tampil cepat di conversation list',
    `client_id`       BIGINT UNSIGNED NOT NULL,
    `worker_id`       BIGINT UNSIGNED NOT NULL,
    `last_message_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at`      TIMESTAMP NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversations_proposal_id_unique` (`proposal_id`),
    KEY `conversations_client_id_index`       (`client_id`),
    KEY `conversations_worker_id_index`       (`worker_id`),
    KEY `conversations_last_message_at_index` (`last_message_at`),
    CONSTRAINT `conversations_proposal_id_foreign`
        FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_gig_id_foreign`
        FOREIGN KEY (`gig_id`) REFERENCES `gigs` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `conversations_worker_id_foreign`
        FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Catatan:**

- `ON DELETE RESTRICT` di semua FK — history chat tidak hilang jika proposal/gig dihapus
- `worker_id` menggantikan `freelancer_id` (karena tidak ada role freelancer)
- `last_message_at` diisi manual saat ada pesan masuk, untuk sorting inbox

### `messages`

```sql
CREATE TABLE `messages` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id`       BIGINT UNSIGNED NOT NULL,
    `body`            TEXT NOT NULL,
    `is_read`         TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`      TIMESTAMP NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `messages_conversation_id_created_at_index` (`conversation_id`, `created_at`),
    KEY `messages_sender_id_index` (`sender_id`),
    KEY `messages_is_read_index`   (`is_read`),
    CONSTRAINT `messages_conversation_id_foreign`
        FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `messages_sender_id_foreign`
        FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Cara Conversation Dibuat

Chat **tidak** dibuat via endpoint manual dari frontend.
Dibuat otomatis di `ProposalController@accept` (milik **Ray**):

```php
// ProposalController.php — method accept()
// Koordinasi dengan Nugi: method ini harus memanggil Conversation::firstOrCreate

Conversation::firstOrCreate(
    ['proposal_id' => $proposal->id],
    [
        'gig_id'    => $proposal->gig_id,
        'client_id' => $proposal->gig->client_id,
        'worker_id' => $proposal->user_id,       // bukan freelancer_id
    ]
);
```

`firstOrCreate` memastikan tidak ada duplikasi jika endpoint dipanggil dua kali.

---

## 5. Struktur File Backend (Nugi)

```
apps/api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── ChatController.php           ← 4 method: index, messages, sendMessage, markRead
│   │   ├── Requests/
│   │   │   └── SendMessageRequest.php       ← validasi body: required|string|min:1|max:2000
│   │   └── Resources/
│   │       ├── ConversationResource.php     ← format list item
│   │       └── MessageResource.php          ← format satu pesan
│   ├── Models/
│   │   ├── Conversation.php                 ← relasi + helper otherParticipant()
│   │   └── Message.php                      ← relasi conversation + sender
│   └── Policies/
│       └── ConversationPolicy.php           ← view + sendMessage (participant check + suspended)
└── routes/
    └── api.php                              ← tambahkan chat routes
```

---

## 6. Struktur File Frontend (Nugi)

```
apps/web/src/
├── hooks/
│   └── useChat.js                           ← fetch conversations + messages
├── services/
│   └── chat.service.js                      ← API calls
├── components/
│   └── chat/
│       ├── ConversationItem.jsx             ← satu baris di inbox
│       ├── ConversationList.jsx             ← sidebar / inbox list
│       ├── MessageBubble.jsx                ← bubble kanan (sendiri) / kiri (lawan)
│       ├── MessageInput.jsx                 ← input + tombol kirim
│       └── MessageThread.jsx                ← panel chat: header + bubble list + input
└── pages/
    └── chat/
        ├── ChatInboxPage.jsx                ← list semua percakapan
        └── ChatRoomPage.jsx                 ← layout: ConversationList + MessageThread
```

---

## 7. API Endpoints Chat

| Method | Path                               | Guard                                      | Fungsi                                                   |
| ------ | ---------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `GET`  | `/api/conversations`               | auth:sanctum                               | List semua percakapan user (urut `last_message_at` desc) |
| `GET`  | `/api/conversations/{id}/messages` | auth:sanctum + participant                 | History pesan (paginate 50, asc) + auto mark read        |
| `POST` | `/api/conversations/{id}/messages` | auth:sanctum + participant + not_suspended | Kirim pesan baru                                         |
| `POST` | `/api/conversations/{id}/read`     | auth:sanctum + participant                 | Tandai semua pesan terbaca                               |

**Tidak ada** `POST /api/conversations` — conversation dibuat otomatis oleh Ray di `ProposalController@accept`.

---

## 8. Format Response

### GET `/api/conversations`

```json
[
  {
    "id": 1,
    "gig": {
      "id": 4,
      "title": "Bantu Buat PPT Presentasi"
    },
    "other_participant": {
      "id": 3,
      "name": "Rina Cahyani",
      "avatar_url": null
    },
    "last_message": {
      "body": "Oke siap saya kerjakan...",
      "created_at": "2025-01-10T14:32:00Z"
    },
    "unread_count": 2
  }
]
```

**Logic `other_participant`:**

```php
// Di Conversation model
public function otherParticipant(): User
{
    return auth()->id() === $this->client_id
        ? $this->worker     // user ini adalah client → tampilkan worker
        : $this->client;    // user ini adalah worker → tampilkan client
}
```

### GET `/api/conversations/{id}/messages`

```json
{
  "conversation": { "id": 1, "gig": {...}, "other_participant": {...} },
  "messages": [
    {
      "id": 1,
      "sender_id": 2,
      "body": "Halo, saya tertarik dengan gig ini.",
      "is_read": true,
      "is_mine": true,
      "created_at": "2025-01-10T14:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "last_page": 1 }
}
```

---

## 9. Relasi Eloquent yang Dibutuhkan

### `Conversation` model

```php
public function proposal(): BelongsTo
public function gig(): BelongsTo
public function client(): BelongsTo    // FK: client_id
public function worker(): BelongsTo    // FK: worker_id  ← bukan freelancer()
public function messages(): HasMany
public function otherParticipant(): User  // helper method
public function hasParticipant(int $userId): bool  // helper method
```

### `Message` model

```php
public function conversation(): BelongsTo
public function sender(): BelongsTo
```

### `User` model (tambahkan)

```php
public function profile(): HasOne
public function conversations(): mixed  // sebagai client atau worker
```

---

## 10. ConversationPolicy

```php
// app/Policies/ConversationPolicy.php

public function view(User $user, Conversation $conversation): bool
{
    return $conversation->hasParticipant($user->id);
}

public function sendMessage(User $user, Conversation $conversation): bool
{
    return $conversation->hasParticipant($user->id)
        && !$user->is_suspended;
}
```

---

## 11. Urutan Pengerjaan

### Backend

1. Buat `app/Models/Conversation.php` + relasi (worker, bukan freelancer)
2. Buat `app/Models/Message.php` + relasi
3. Pastikan `app/Models/Profile.php` ada + relasi `user()`
4. Update `app/Models/User.php` — tambah `profile()` HasOne
5. Buat `ConversationPolicy` + daftarkan di AppServiceProvider
6. Buat `SendMessageRequest` — validasi `body` max 2000
7. Buat `ConversationResource` + `MessageResource`
8. Buat `ChatController` — 4 method
9. Tambah chat routes ke `routes/api.php`
10. **Koordinasi dengan Ray**: pastikan `ProposalController@accept` memanggil `Conversation::firstOrCreate`

### Frontend

1. Buat `services/chat.service.js`
2. Buat `hooks/useChat.js`
3. Buat komponen: `MessageBubble`, `MessageInput`, `MessageThread`, `ConversationItem`, `ConversationList`
4. Buat `ChatInboxPage.jsx` + `ChatRoomPage.jsx`
5. Tambah route `/chat` dan `/chat/:conversationId`
6. Tambah link Chat di `Navbar.jsx` (milik Yasmin — koordinasi)

---

## 12. Seed Data untuk Testing

Data existing di `sikagig.sql`:

| Data                     | Detail                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Proposal accepted (id=1) | gig_id=4, user_id=2 (Budi sebagai worker), client = user_id=3 (Rina sebagai client) |
| Escrow holding           | escrow id=1, proposal_id=1                                                          |

Untuk test chat:

1. Login sebagai `budi@example.com` (OTP: `123456`) atau `rina@example.com` (OTP: `234567`)
2. Conversation seharusnya sudah ada (seed data akan include conversation otomatis)
3. Kirim pesan di conversation tersebut

---

## 13. Checklist Sebelum Merge

### Backend

- [ ] `Conversation.php` model + relasi (`worker` bukan `freelancer`)
- [ ] `Message.php` model + relasi
- [ ] `Profile.php` model ada
- [ ] `ConversationPolicy` — view + sendMessage (cek suspended)
- [ ] `SendMessageRequest` — body max 2000
- [ ] `ConversationResource` + `MessageResource`
- [ ] `ChatController` — 4 method (index, messages, sendMessage, markRead)
- [ ] Chat routes di `routes/api.php`
- [ ] `ProposalController@accept` — sudah panggil `Conversation::firstOrCreate` (Ray)

### Frontend

- [ ] `chat.service.js` fetch conversations + messages
- [ ] `useChat.js` hook
- [ ] 5 komponen chat terbuat
- [ ] `ChatInboxPage.jsx` + `ChatRoomPage.jsx`
- [ ] Route `/chat` + `/chat/:id` terdaftar
- [ ] Link Chat ada di Navbar (koordinasi Yasmin)
- [ ] Empty state saat tidak ada percakapan
- [ ] Loading skeleton saat fetch
