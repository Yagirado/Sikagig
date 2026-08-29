-- ============================================================
-- SIKAGIG — Database Schema
-- Platform Gig Lokal
-- MySQL 8.x
--
-- Alur autentikasi:
--   - Login WAJIB menggunakan email + OTP (6 digit, 10 menit)
--   - Tidak ada password konvensional
--   - Setelah login: bisa browse gig bebas
--   - Mau BUAT gig: profile HARUS lengkap (is_profile_complete = 1)
--     → cukup isi name
--   - Mau KIRIM PROPOSAL: profile HARUS lengkap + nim & faculty terisi
--     → is_profile_complete = 1 && nim IS NOT NULL && faculty IS NOT NULL
--   - Satu akun bisa sekaligus posting gig DAN mengerjakan gig
--   - Super admin bisa suspend akun user
--
-- Role:
--   user        → pengguna biasa, bisa posting gig & mengerjakan gig
--   super_admin → akses panel admin, suspend/unsuspend user
--
-- Tabel:
--   users, otp_codes, profiles, suspend_logs, categories,
--   wallets, notifications, gigs, proposals, escrows, payments,
--   conversations, messages,
--   + tabel Laravel default (14 tabel bisnis)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- Drop (urutan kebalikan FK)
-- ============================================================
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `escrows`;
DROP TABLE IF EXISTS `proposals`;
DROP TABLE IF EXISTS `gigs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `suspend_logs`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `otp_codes`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `users`;

-- ============================================================
-- 1. USERS
--    Login via email + OTP saja.
--    Tidak ada kolom password.
--
--    Role:
--      user        → pengguna biasa, bisa jadi pemberi kerja
--                    (posting gig) sekaligus pengerjaan (kirim proposal)
--                    dalam satu akun yang sama
--      super_admin → akses panel admin, suspend/unsuspend user
-- ============================================================
CREATE TABLE `users` (
    `id`               BIGINT UNSIGNED             NOT NULL AUTO_INCREMENT,
    `email`            VARCHAR(255)                NOT NULL,
    `role`             ENUM('user','super_admin')  NOT NULL DEFAULT 'user',
    -- Status akun
    `is_suspended`     TINYINT(1)                  NOT NULL DEFAULT 0
        COMMENT '1 = disuspend oleh super_admin, tidak bisa login atau akses fitur gig',
    `suspended_at`     TIMESTAMP                   NULL DEFAULT NULL,
    `suspended_reason` TEXT                        NULL DEFAULT NULL,
    -- Laravel default
    `email_verified_at` TIMESTAMP                  NULL DEFAULT NULL,
    `remember_token`   VARCHAR(100)                NULL DEFAULT NULL,
    `created_at`       TIMESTAMP                   NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP                   NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique`    (`email`),
    KEY `users_role_index`             (`role`),
    KEY `users_is_suspended_index`     (`is_suspended`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Akun pengguna. Autentikasi via email + OTP. Role: user | super_admin.';

-- ============================================================
-- 2. OTP CODES
--    OTP 6 digit dikirim ke email user setiap kali login/register.
--    Expired setelah 10 menit atau setelah dipakai (is_used = 1).
--    Satu email hanya boleh punya satu OTP aktif sekaligus.
-- ============================================================
CREATE TABLE `otp_codes` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email`      VARCHAR(255)    NOT NULL
        COMMENT 'Email tujuan OTP (belum tentu ada di tabel users saat register)',
    `otp`        VARCHAR(6)      NOT NULL
        COMMENT 'Kode OTP 6 digit (disimpan hashed di production)',
    `purpose`    ENUM('login','register') NOT NULL DEFAULT 'login'
        COMMENT 'Tujuan pengiriman OTP',
    `is_used`    TINYINT(1)      NOT NULL DEFAULT 0
        COMMENT '1 = sudah dipakai, tidak bisa dipakai lagi',
    `expires_at` TIMESTAMP       NOT NULL
        COMMENT 'Waktu kadaluwarsa OTP (10 menit dari dibuat)',
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `otp_codes_email_index`      (`email`),
    KEY `otp_codes_expires_at_index` (`expires_at`),
    KEY `otp_codes_purpose_index`    (`purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='OTP untuk login/register. Expired 10 menit, sekali pakai.';

-- ============================================================
-- 3. PASSWORD RESET TOKENS (Laravel default — tetap ada)
-- ============================================================
CREATE TABLE `password_reset_tokens` (
    `email`      VARCHAR(255) NOT NULL,
    `token`      VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP    NULL DEFAULT NULL,
    PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SESSIONS (Laravel default)
-- ============================================================
CREATE TABLE `sessions` (
    `id`            VARCHAR(255)    NOT NULL,
    `user_id`       BIGINT UNSIGNED NULL DEFAULT NULL,
    `ip_address`    VARCHAR(45)     NULL DEFAULT NULL,
    `user_agent`    TEXT            NULL DEFAULT NULL,
    `payload`       LONGTEXT        NOT NULL,
    `last_activity` INT             NOT NULL,
    PRIMARY KEY (`id`),
    KEY `sessions_user_id_index`       (`user_id`),
    KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. CACHE (Laravel default)
-- ============================================================
CREATE TABLE `cache` (
    `key`        VARCHAR(255) NOT NULL,
    `value`      MEDIUMTEXT   NOT NULL,
    `expiration` INT          NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
    `key`        VARCHAR(255) NOT NULL,
    `owner`      VARCHAR(255) NOT NULL,
    `expiration` INT          NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. JOBS (Laravel Queue — default)
-- ============================================================
CREATE TABLE `jobs` (
    `id`           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `queue`        VARCHAR(255)     NOT NULL,
    `payload`      LONGTEXT         NOT NULL,
    `attempts`     TINYINT UNSIGNED NOT NULL,
    `reserved_at`  INT UNSIGNED     NULL DEFAULT NULL,
    `available_at` INT UNSIGNED     NOT NULL,
    `created_at`   INT UNSIGNED     NOT NULL,
    PRIMARY KEY (`id`),
    KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
    `id`             VARCHAR(255) NOT NULL,
    `name`           VARCHAR(255) NOT NULL,
    `total_jobs`     INT          NOT NULL,
    `pending_jobs`   INT          NOT NULL,
    `failed_jobs`    INT          NOT NULL,
    `failed_job_ids` LONGTEXT     NOT NULL,
    `options`        MEDIUMTEXT   NULL DEFAULT NULL,
    `cancelled_at`   INT          NULL DEFAULT NULL,
    `created_at`     INT          NOT NULL,
    `finished_at`    INT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid`       VARCHAR(255)    NOT NULL,
    `connection` TEXT            NOT NULL,
    `queue`      TEXT            NOT NULL,
    `payload`    LONGTEXT        NOT NULL,
    `exception`  LONGTEXT        NOT NULL,
    `failed_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PERSONAL ACCESS TOKENS (Laravel Sanctum)
-- ============================================================
CREATE TABLE `personal_access_tokens` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255)    NOT NULL,
    `tokenable_id`   BIGINT UNSIGNED NOT NULL,
    `name`           VARCHAR(255)    NOT NULL,
    `token`          VARCHAR(64)     NOT NULL,
    `abilities`      TEXT            NULL DEFAULT NULL,
    `last_used_at`   TIMESTAMP       NULL DEFAULT NULL,
    `expires_at`     TIMESTAMP       NULL DEFAULT NULL,
    `created_at`     TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`     TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
    KEY `personal_access_tokens_tokenable_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. CATEGORIES
-- ============================================================
CREATE TABLE `categories` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(100)    NOT NULL,
    `slug`       VARCHAR(100)    NOT NULL,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `categories_name_unique` (`name`),
    UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master kategori gig.';

-- ============================================================
-- 9. PROFILES
--    Semua user punya satu profil.
--
--    Guard is_profile_complete:
--      Mau BUAT GIG  → is_profile_complete = 1 (name wajib diisi)
--      Mau KIRIM PROPOSAL → is_profile_complete = 1
--                           + nim IS NOT NULL
--                           + faculty IS NOT NULL
--
--    Dengan kata lain:
--      - Isi name saja → bisa posting gig
--      - Isi name + nim + faculty → bisa kirim proposal juga
--
--    nim dan faculty OPSIONAL secara kolom, tapi WAJIB
--    secara bisnis jika user ingin mengirim proposal.
--    Backend wajib memvalidasi keduanya sebelum izinkan POST proposal.
--
--    Foto profil (avatar_url) OPSIONAL untuk semua user.
-- ============================================================
CREATE TABLE `profiles` (
    `id`                  BIGINT UNSIGNED                              NOT NULL AUTO_INCREMENT,
    `user_id`             BIGINT UNSIGNED                              NOT NULL,
    -- ── Wajib untuk is_profile_complete = 1 ─────────────────
    `name`                VARCHAR(100)                                 NULL DEFAULT NULL
        COMMENT 'Nama lengkap — wajib sebelum is_profile_complete = 1',
    -- ── Opsional semua user ──────────────────────────────────
    `avatar_url`          VARCHAR(255)                                 NULL DEFAULT NULL
        COMMENT 'Foto profil — opsional, bisa diisi kapan saja',
    `bio`                 TEXT                                         NULL DEFAULT NULL,
    `location`            VARCHAR(100)                                 NULL DEFAULT NULL,
    -- ── Wajib jika ingin KIRIM PROPOSAL (pengerjaan gig) ────
    `nim`                 CHAR(13)                                     NULL DEFAULT NULL
        COMMENT 'NIM 13 digit — opsional secara kolom, wajib secara bisnis untuk kirim proposal',
    `faculty`             VARCHAR(100)                                 NULL DEFAULT NULL
        COMMENT 'Nama fakultas — opsional secara kolom, wajib secara bisnis untuk kirim proposal',
    -- ── Opsional, relevan jika sering mengerjakan gig ───────
    `headline`            VARCHAR(150)                                 NULL DEFAULT NULL,
    `skills`              JSON                                         NULL DEFAULT NULL,
    `experience_level`    ENUM('beginner','intermediate','expert')     NULL DEFAULT NULL,
    `portfolio_url`       VARCHAR(255)                                 NULL DEFAULT NULL,
    -- ── Status kelengkapan dasar ────────────────────────────
    `is_profile_complete` TINYINT(1)                                   NOT NULL DEFAULT 0
        COMMENT '1 = name sudah diisi. Wajib untuk buat gig maupun kirim proposal.',
    `created_at`          TIMESTAMP                                    NULL DEFAULT NULL,
    `updated_at`          TIMESTAMP                                    NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `profiles_user_id_unique` (`user_id`),
    UNIQUE KEY `profiles_nim_unique`     (`nim`)
        COMMENT 'NIM tidak boleh sama antar user',
    KEY `profiles_is_profile_complete_index` (`is_profile_complete`),
    CONSTRAINT `profiles_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `profiles_nim_format_check`
        CHECK (`nim` IS NULL OR (`nim` REGEXP '^[0-9]{13}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Profil pengguna. is_profile_complete wajib = 1 sebelum buat/ambil gig.';

-- ============================================================
-- 10. SUSPEND LOGS
--     Audit trail suspend/unsuspend oleh super_admin. Immutable.
-- ============================================================
CREATE TABLE `suspend_logs` (
    `id`             BIGINT UNSIGNED             NOT NULL AUTO_INCREMENT,
    `target_user_id` BIGINT UNSIGNED             NOT NULL
        COMMENT 'User yang di-suspend/unsuspend',
    `admin_id`       BIGINT UNSIGNED             NOT NULL
        COMMENT 'Super admin yang melakukan aksi',
    `action`         ENUM('suspend','unsuspend') NOT NULL,
    `reason`         TEXT                        NULL DEFAULT NULL
        COMMENT 'Alasan — wajib saat action = suspend',
    `created_at`     TIMESTAMP                   NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `suspend_logs_target_user_id_index` (`target_user_id`),
    KEY `suspend_logs_admin_id_index`       (`admin_id`),
    CONSTRAINT `suspend_logs_target_user_id_foreign`
        FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `suspend_logs_admin_id_foreign`
        FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Riwayat suspend/unsuspend. Tidak boleh dihapus.';

-- ============================================================
-- 11. WALLETS
--     Semua user bisa punya wallet karena siapapun bisa
--     mengerjakan gig dan menerima pembayaran.
--     Dibuat otomatis saat user pertama kali mengisi nim & faculty
--     (siap jadi pengerjaan), atau bisa dibuat saat register.
-- ============================================================
CREATE TABLE `wallets` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `balance`    INT UNSIGNED    NOT NULL DEFAULT 0
        COMMENT 'Saldo dalam rupiah',
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `wallets_user_id_unique` (`user_id`),
    CONSTRAINT `wallets_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Saldo wallet user. Bertambah saat escrow di-release (non-cash).';

-- ============================================================
-- 12. GIGS
--     Guard: user harus is_profile_complete = 1 untuk buat gig.
--     Siapapun (role user) bisa posting gig.
-- ============================================================
CREATE TABLE `gigs` (
    `id`          BIGINT UNSIGNED                                        NOT NULL AUTO_INCREMENT,
    `client_id`   BIGINT UNSIGNED                                        NOT NULL
        COMMENT 'User yang memposting gig (bertindak sebagai pemberi kerja)',
    `category_id` BIGINT UNSIGNED                                        NOT NULL,
    `title`       VARCHAR(255)                                           NOT NULL,
    `description` TEXT                                                   NOT NULL,
    `budget`      INT UNSIGNED                                           NOT NULL
        COMMENT 'Budget dalam rupiah',
    `deadline`    DATE                                                   NULL DEFAULT NULL,
    `slots`       TINYINT UNSIGNED                                       NOT NULL DEFAULT 1,
    `is_onsite`   TINYINT(1)                                             NOT NULL DEFAULT 0,
    `location`    VARCHAR(150)                                           NULL DEFAULT NULL,
    `status`      ENUM('open','in_progress','completed','cancelled')     NOT NULL DEFAULT 'open',
    `created_at`  TIMESTAMP                                              NULL DEFAULT NULL,
    `updated_at`  TIMESTAMP                                              NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `gigs_client_id_index`   (`client_id`),
    KEY `gigs_category_id_index` (`category_id`),
    KEY `gigs_status_index`      (`status`),
    CONSTRAINT `gigs_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `gigs_category_id_foreign`
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Postingan pekerjaan. open → in_progress → completed / cancelled.';

-- ============================================================
-- 13. PROPOSALS
--     Guard: user harus is_profile_complete = 1 DAN nim & faculty
--     sudah terisi DAN is_suspended = 0 sebelum bisa kirim proposal.
--     User tidak bisa melamar gig miliknya sendiri
--     (dicek di backend: proposal.user_id != gig.client_id).
-- ============================================================
CREATE TABLE `proposals` (
    `id`            BIGINT UNSIGNED                                         NOT NULL AUTO_INCREMENT,
    `gig_id`        BIGINT UNSIGNED                                         NOT NULL,
    `user_id`       BIGINT UNSIGNED                                         NOT NULL
        COMMENT 'User yang mengirim proposal (bertindak sebagai pengerjaan)',
    `cover_letter`  TEXT                                                    NOT NULL,
    `bid_amount`    INT UNSIGNED                                            NOT NULL
        COMMENT 'Tawaran harga dalam rupiah',
    `status`        ENUM('pending','accepted','rejected','withdrawn')        NOT NULL DEFAULT 'pending',
    `created_at`    TIMESTAMP                                               NULL DEFAULT NULL,
    `updated_at`    TIMESTAMP                                               NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `proposals_gig_user_unique` (`gig_id`, `user_id`)
        COMMENT 'Satu user hanya bisa melamar satu kali per gig',
    KEY `proposals_user_id_index`  (`user_id`),
    KEY `proposals_status_index`   (`status`),
    CONSTRAINT `proposals_gig_id_foreign`
        FOREIGN KEY (`gig_id`) REFERENCES `gigs` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `proposals_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lamaran user ke gig. Unique per gig-user. User tidak bisa lamar gig sendiri.';

-- ============================================================
-- 14. ESCROWS
-- ============================================================
CREATE TABLE `escrows` (
    `id`             BIGINT UNSIGNED                                                               NOT NULL AUTO_INCREMENT,
    `proposal_id`    BIGINT UNSIGNED                                                               NOT NULL,
    `gig_id`         BIGINT UNSIGNED                                                               NOT NULL,
    `client_id`      BIGINT UNSIGNED                                                               NOT NULL
        COMMENT 'User pemberi kerja (yang memposting gig)',
    `worker_id`      BIGINT UNSIGNED                                                               NOT NULL
        COMMENT 'User pengerjaan (yang proposalnya diterima)',
    `amount`         INT UNSIGNED                                                                  NOT NULL,
    `payment_method` ENUM('bank_transfer','ewallet','cash')                                        NOT NULL,
    `status`         ENUM('awaiting_payment','holding','released','settled','refunded','disputed')  NOT NULL DEFAULT 'awaiting_payment',
    `held_at`        TIMESTAMP NULL DEFAULT NULL,
    `released_at`    TIMESTAMP NULL DEFAULT NULL,
    `settled_at`     TIMESTAMP NULL DEFAULT NULL,
    `notes`          TEXT      NULL DEFAULT NULL,
    `created_at`     TIMESTAMP NULL DEFAULT NULL,
    `updated_at`     TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `escrows_proposal_id_unique` (`proposal_id`),
    KEY `escrows_gig_id_index`      (`gig_id`),
    KEY `escrows_client_id_index`   (`client_id`),
    KEY `escrows_worker_id_index`   (`worker_id`),
    KEY `escrows_status_index`      (`status`),
    CONSTRAINT `escrows_proposal_id_foreign`
        FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `escrows_gig_id_foreign`
        FOREIGN KEY (`gig_id`) REFERENCES `gigs` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `escrows_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `escrows_worker_id_foreign`
        FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dana escrow per deal. client_id = pemberi kerja, worker_id = pengerjaan.';

-- ============================================================
-- 15. PAYMENTS
-- ============================================================
CREATE TABLE `payments` (
    `id`             BIGINT UNSIGNED                                  NOT NULL AUTO_INCREMENT,
    `escrow_id`      BIGINT UNSIGNED                                  NOT NULL,
    `user_id`        BIGINT UNSIGNED                                  NOT NULL,
    `type`           ENUM('deposit','release','refund','settlement')  NOT NULL,
    `amount`         INT UNSIGNED                                     NOT NULL,
    `payment_method` ENUM('bank_transfer','ewallet','cash')           NOT NULL,
    `status`         ENUM('pending','success','failed')               NOT NULL DEFAULT 'pending',
    `reference_code` VARCHAR(100)                                     NULL DEFAULT NULL,
    `paid_at`        TIMESTAMP                                        NULL DEFAULT NULL,
    `created_at`     TIMESTAMP                                        NULL DEFAULT NULL,
    `updated_at`     TIMESTAMP                                        NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `payments_reference_code_unique` (`reference_code`),
    KEY `payments_escrow_id_index` (`escrow_id`),
    KEY `payments_user_id_index`   (`user_id`),
    KEY `payments_type_index`      (`type`),
    KEY `payments_status_index`    (`status`),
    CONSTRAINT `payments_escrow_id_foreign`
        FOREIGN KEY (`escrow_id`) REFERENCES `escrows` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `payments_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log transaksi keuangan per escrow.';

-- ============================================================
-- 16. NOTIFICATIONS
--     Notifikasi in-app per user.
--     Dibuat otomatis oleh backend saat event tertentu:
--       proposal_received → ke client saat ada proposal masuk
--       proposal_accepted → ke user saat proposalnya diterima
--       proposal_rejected → ke user saat proposalnya ditolak
--       escrow_released   → ke worker saat client release dana
-- ============================================================
CREATE TABLE `notifications` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    BIGINT UNSIGNED NOT NULL
        COMMENT 'Penerima notifikasi',
    `type`       VARCHAR(50)     NOT NULL
        COMMENT 'proposal_received | proposal_accepted | proposal_rejected | escrow_released',
    `title`      VARCHAR(150)    NOT NULL,
    `body`       TEXT            NOT NULL,
    `data`       JSON            NULL DEFAULT NULL
        COMMENT 'Payload tambahan: gig_id, proposal_id, escrow_id, dsb.',
    `is_read`    TINYINT(1)      NOT NULL DEFAULT 0
        COMMENT '0 = belum dibaca',
    `read_at`    TIMESTAMP       NULL DEFAULT NULL,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `notifications_user_id_index`   (`user_id`),
    KEY `notifications_is_read_index`   (`is_read`),
    KEY `notifications_type_index`      (`type`),
    CONSTRAINT `notifications_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notifikasi in-app. Dibuat otomatis saat event proposal/escrow terjadi.';

-- ============================================================
-- 17. CONVERSATIONS
--     Dibuat OTOMATIS saat proposal diterima (ProposalController@accept).
--     Satu proposal = satu percakapan (UNIQUE proposal_id).
--     Tidak bisa dibuat manual via endpoint.
--     client_id  = user pemberi kerja (pemilik gig)
--     worker_id  = user pengerjaan (yang proposalnya diterima)
-- ============================================================
CREATE TABLE `conversations` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `proposal_id`     BIGINT UNSIGNED NOT NULL
        COMMENT '1 proposal hanya boleh punya 1 percakapan',
    `gig_id`          BIGINT UNSIGNED NOT NULL
        COMMENT 'Denormalisasi untuk tampil cepat di conversation list',
    `client_id`       BIGINT UNSIGNED NOT NULL
        COMMENT 'User pemberi kerja',
    `worker_id`       BIGINT UNSIGNED NOT NULL
        COMMENT 'User pengerjaan',
    `last_message_at` TIMESTAMP       NULL DEFAULT NULL
        COMMENT 'Diupdate setiap ada pesan baru. Dipakai untuk urutan inbox.',
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversations_proposal_id_unique`  (`proposal_id`),
    KEY `conversations_client_id_index`            (`client_id`),
    KEY `conversations_worker_id_index`            (`worker_id`),
    KEY `conversations_last_message_at_index`      (`last_message_at`),
    CONSTRAINT `conversations_proposal_id_foreign`
        FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `conversations_gig_id_foreign`
        FOREIGN KEY (`gig_id`) REFERENCES `gigs` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `conversations_client_id_foreign`
        FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `conversations_worker_id_foreign`
        FOREIGN KEY (`worker_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Percakapan antara pemberi kerja dan pengerjaan. 1 proposal = 1 conversation.';

-- ============================================================
-- 18. MESSAGES
--     Pesan dalam satu conversation.
--     is_read: hanya bisa berubah 0 → 1, tidak bisa balik.
--     ON DELETE CASCADE dari conversations: pesan ikut terhapus.
--     ON DELETE RESTRICT dari users: user tidak bisa dihapus
--     selama masih punya pesan.
-- ============================================================
CREATE TABLE `messages` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `sender_id`       BIGINT UNSIGNED NOT NULL,
    `body`            TEXT            NOT NULL
        COMMENT 'Isi pesan. Max 2000 karakter (validasi di aplikasi).',
    `is_read`         TINYINT(1)      NOT NULL DEFAULT 0
        COMMENT '0 = belum dibaca oleh penerima',
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `messages_conversation_created_index` (`conversation_id`, `created_at`)
        COMMENT 'Composite index untuk query history terurut waktu',
    KEY `messages_sender_id_index`            (`sender_id`),
    KEY `messages_is_read_index`              (`is_read`),
    CONSTRAINT `messages_conversation_id_foreign`
        FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `messages_sender_id_foreign`
        FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pesan dalam conversation. Cascade delete dari conversations.';

-- ============================================================
SET foreign_key_checks = 1;
-- ============================================================



-- ============================================================
-- SEED DATA
-- ============================================================

-- Kategori Gig
INSERT INTO `categories` (`name`, `slug`, `created_at`, `updated_at`) VALUES
('Tugas & Akademik', 'tugas',       NOW(), NOW()),
('Belanja & Titip',  'belanja',      NOW(), NOW()),
('Antar & Jemput',   'antar-jemput', NOW(), NOW()),
('Riset & Survei',   'riset',        NOW(), NOW()),
('COD & Antri',      'cod-antri',    NOW(), NOW()),
('Jasa Freelance',   'jasa',         NOW(), NOW()),
('Lainnya',          'lainnya',      NOW(), NOW());

-- ============================================================
-- Users (tidak ada kolom password — login via OTP)
--
-- id 1 = super_admin
-- id 2 = user biasa, profil lengkap, sudah isi nim+faculty
--         → bisa posting gig DAN kirim proposal
-- id 3 = user biasa, profil lengkap tapi belum isi nim+faculty
--         → hanya bisa posting gig, belum bisa kirim proposal
-- id 4 = user biasa, profil belum lengkap sama sekali
--         → belum bisa posting gig maupun kirim proposal
-- id 5 = user disuspend (untuk testing suspend flow)
-- ============================================================
INSERT INTO `users`
    (`email`, `role`, `is_suspended`, `suspended_at`, `suspended_reason`,
     `email_verified_at`, `created_at`, `updated_at`)
VALUES
-- id 1: super_admin
('admin@sikagig.com',
 'super_admin', 0, NULL, NULL, NOW(), NOW(), NOW()),

-- id 2: user aktif — profil lengkap + nim & faculty ada
--        contoh: Budi posting gig sekaligus pernah ambil gig juga
('budi@example.com',
 'user', 0, NULL, NULL, NOW(), NOW(), NOW()),

-- id 3: user aktif — profil lengkap (name terisi) tapi belum isi nim+faculty
--        bisa posting gig, belum bisa kirim proposal
('rina@example.com',
 'user', 0, NULL, NULL, NOW(), NOW(), NOW()),

-- id 4: user baru — profil belum lengkap sama sekali
--        akan kena popup "Lengkapi Profil Dulu" saat coba posting/melamar
('hendra@example.com',
 'user', 0, NULL, NULL, NOW(), NOW(), NOW()),

-- id 5: user disuspend — untuk testing
('suspended@example.com',
 'user', 1, NOW(),
 'Melanggar ketentuan: menerima bayaran di luar platform.',
 NOW(), NOW(), NOW());

-- OTP dummy untuk testing (OTP belum kedaluwarsa, belum dipakai)
INSERT INTO `otp_codes` (`email`, `otp`, `purpose`, `is_used`, `expires_at`, `created_at`) VALUES
('budi@example.com',       '123456', 'login',    0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('rina@example.com',       '234567', 'login',    0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('newuser@example.com',    '345678', 'register', 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW());

-- ============================================================
-- Profiles
--
-- is_profile_complete:
--   1 = name sudah diisi → bisa buat gig
--   nim + faculty NOT NULL → bisa kirim proposal (dicek di backend)
--   0 = belum isi apa-apa → kena popup di semua aksi
-- ============================================================
INSERT INTO `profiles`
    (`user_id`, `name`, `avatar_url`, `bio`, `location`,
     `nim`, `faculty`,
     `headline`, `skills`, `experience_level`, `portfolio_url`,
     `is_profile_complete`,
     `created_at`, `updated_at`)
VALUES
-- id 1: super_admin — profil minimal
(1, 'Admin Sikagig', NULL, NULL, 'Bandung',
 NULL, NULL,
 NULL, NULL, NULL, NULL,
 1, NOW(), NOW()),

-- id 2: Budi — profil lengkap + nim & faculty terisi
--        bisa posting gig DAN kirim proposal
(2, 'Budi Santoso', NULL, 'Aktif di platform sejak 2024.', 'Bandung',
 '2310631170001', 'Fakultas Ilmu Komputer',
 'Full-stack Dev & Joki Tugas', '["SPSS","Python","Ms Office","riset"]', 'intermediate', NULL,
 1, NOW(), NOW()),

-- id 3: Rina — profil lengkap (name ada) tapi nim & faculty belum diisi
--        bisa posting gig, BELUM bisa kirim proposal
(3, 'Rina Cahyani', NULL, NULL, 'Bandung',
 NULL, NULL,
 NULL, NULL, NULL, NULL,
 1, NOW(), NOW()),

-- id 4: Hendra — profil belum lengkap sama sekali (name NULL)
--        belum bisa posting gig maupun kirim proposal
(4, NULL, NULL, NULL, NULL,
 NULL, NULL,
 NULL, NULL, NULL, NULL,
 0, NOW(), NOW()),

-- id 5: User suspended — profil ada tapi akun dikunci
(5, 'Sika Suspended', NULL, NULL, 'Bandung',
 '2310631170099', 'Fakultas Ekonomi',
 'Jasa Umum', '["belanja"]', 'beginner', NULL,
 1, NOW(), NOW());

-- ============================================================
-- Wallets — semua user bisa punya wallet
-- Dibuat saat user mengisi nim+faculty (siap jadi pengerjaan)
-- ============================================================
INSERT INTO `wallets` (`user_id`, `balance`, `created_at`, `updated_at`) VALUES
(2, 50000, NOW(), NOW()),   -- Budi: ada saldo dari gig sebelumnya
(3, 0,     NOW(), NOW()),   -- Rina: wallet kosong, belum pernah terima bayaran
(5, 0,     NOW(), NOW());   -- User suspended: saldo 0

-- ============================================================
-- Gig dummy
-- client_id memakai kolom yang sama — siapapun bisa jadi pemberi kerja
-- ============================================================
INSERT INTO `gigs`
    (`client_id`, `category_id`, `title`, `description`, `budget`,
     `deadline`, `slots`, `is_onsite`, `location`, `status`,
     `created_at`, `updated_at`)
VALUES
-- Budi posting gig (id 2, is_profile_complete = 1)
(2, 1, 'Joki Tugas Statistik SPSS',
 'Butuh bantuan olah data SPSS untuk tugas akhir. File data dikirim via Drive.',
 150000, DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 0, NULL, 'open', NOW(), NOW()),

(2, 4, 'Riset Harga Pasar Produk FMCG',
 'Survei harga 20 produk di 3 minimarket. Foto struk wajib.',
 200000, DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 1, 'Bandung', 'open', NOW(), NOW()),

(2, 3, 'Antar Jemput Bandara Husein',
 'Jemput Bandara Husein jam 14.00, antar ke Dago.',
 100000, DATE_ADD(NOW(), INTERVAL 2 DAY), 1, 1, 'Bandara Husein, Bandung', 'open', NOW(), NOW()),

-- Rina juga posting gig (id 3, is_profile_complete = 1)
(3, 1, 'Bantu Buat PPT Presentasi',
 'Butuh desain slide PPT 15 halaman tema teknologi.',
 75000, DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 0, NULL, 'in_progress', NOW(), NOW());

-- ============================================================
-- Proposals
-- user_id menggantikan freelancer_id
-- Budi (id 2) melamar gig milik Rina (id 3) — valid karena beda user
-- ============================================================
INSERT INTO `proposals`
    (`gig_id`, `user_id`, `cover_letter`, `bid_amount`, `status`,
     `created_at`, `updated_at`)
VALUES
-- Proposal accepted untuk gig 4 milik Rina, dilamar oleh Budi
(4, 2,
 'Saya berpengalaman bikin PPT. Bisa selesai dalam 1 hari.',
 70000, 'accepted', NOW(), NOW()),

-- Proposal pending untuk gig 1 milik Budi sendiri? — TIDAK VALID
-- Contoh yang valid: andaikan ada user lain yang melamar gig 1
-- (di production, backend reject jika user_id == gig.client_id)
-- Untuk seed, kita skip — tidak ada proposal untuk gig milik sendiri
-- Proposal pending untuk gig 2 milik Budi, dilamar oleh Rina
-- (Rina belum isi nim+faculty → ini contoh edge case yang harus diblock backend)
(2, 3,
 'Saya bisa survei minimarket di Bandung hari ini.',
 190000, 'pending', NOW(), NOW());

-- ============================================================
-- Escrow (untuk proposal 1 yang accepted)
-- client_id = Rina (pemberi kerja, pemilik gig 4)
-- worker_id = Budi (pengerjaan, yang proposalnya diterima)
-- ============================================================
INSERT INTO `escrows`
    (`proposal_id`, `gig_id`, `client_id`, `worker_id`,
     `amount`, `payment_method`, `status`, `held_at`,
     `created_at`, `updated_at`)
VALUES
(1, 4, 3, 2, 70000, 'bank_transfer', 'holding', NOW(), NOW(), NOW());

-- Payment log deposit
INSERT INTO `payments`
    (`escrow_id`, `user_id`, `type`, `amount`, `payment_method`,
     `status`, `reference_code`, `paid_at`, `created_at`, `updated_at`)
VALUES
(1, 3, 'deposit', 70000, 'bank_transfer', 'success', 'SGG-DEP-20240001', NOW(), NOW(), NOW());

-- Suspend log
INSERT INTO `suspend_logs`
    (`target_user_id`, `admin_id`, `action`, `reason`, `created_at`)
VALUES
(5, 1, 'suspend',
 'Melanggar ketentuan: menerima bayaran di luar platform.',
 NOW());

-- ============================================================
-- Conversations (sesuai proposal 1 yang accepted)
-- proposal_id=1 → gig_id=4, client_id=3 (Rina), worker_id=2 (Budi)
-- Dibuat otomatis saat proposal diterima — diseed manual untuk testing
-- ============================================================
INSERT INTO `conversations`
    (`proposal_id`, `gig_id`, `client_id`, `worker_id`,
     `last_message_at`, `created_at`, `updated_at`)
VALUES
(1, 4, 3, 2, NULL, NOW(), NOW());

-- ============================================================
-- Notifications seed (contoh notif untuk Budi saat proposalnya diterima)
-- ============================================================
INSERT INTO `notifications`
    (`user_id`, `type`, `title`, `body`, `data`, `is_read`, `read_at`, `created_at`, `updated_at`)
VALUES
-- Notif ke Budi (id=2): proposal diterima
(2, 'proposal_accepted',
 'Proposal Anda Diterima!',
 'Rina Cahyani menerima proposal Anda untuk gig "Bantu Buat PPT Presentasi".',
 '{"gig_id": 4, "proposal_id": 1, "escrow_id": 1}',
 0, NULL, NOW(), NOW()),

-- Notif ke Rina (id=3): ada proposal masuk ke gignya
(3, 'proposal_received',
 'Proposal Baru Masuk',
 'Budi Santoso mengirim proposal untuk gig "Riset Harga Pasar Produk FMCG".',
 '{"gig_id": 2, "proposal_id": 2}',
 0, NULL, NOW(), NOW());
