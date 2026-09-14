-- SIKAGIG: autentikasi email + OTP dan Google, tanpa password.
-- Target: MySQL 8.0.16+ (CHECK constraints harus aktif), InnoDB.
-- Import ke database KOSONG yang telah dipilih. Bukan migration/upgrade.
-- Tidak menghapus atau mengganti tabel yang sudah ada.
-- Diselaraskan dengan form apps/web; file SQL ini menjadi acuan field terbaru.
-- Nama input form = nama kolom: NIM, fullName, email, phone, gender,
-- tanggal_lahir, legal_agreement, privacy_agreement.
-- README-auth.md sebelumnya memakai nama field dan OTP lama.
--
-- Catatan integrasi (tidak ada logic frontend/backend dalam file ini):
-- - tanggal_lahir: form DD/MM/YYYY -> validasi dan konversi ke DATE YYYY-MM-DD.
-- - NIM/phone berupa string supaya angka nol di depan tidak hilang.
-- - OTP pada frontend saat ini 4 digit. Simpan HASH-nya, bukan CHAR(4).
--   Panjang kode asli tidak bisa diperiksa dari hash oleh constraint SQL.
-- - Checkbox form bernilai 'accepted'; backend wajib memvalidasi dan mengubahnya
--   menjadi boolean: 1 jika setuju, 0 jika belum setuju. JSON boleh memakai boolean.
-- - Profil awal Google boleh NULL; profil lengkap wajib memenuhi seluruh form.
--   Nilai gender Google perlu dipetakan ke man/woman; jika tidak cocok/tersedia,
--   biarkan NULL sampai pengguna memilih. Data Google tidak dianggap persetujuan.
-- - Model/migration Laravel lama perlu diselaraskan sebelum memakai skema ini.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    NIM VARCHAR(13) NULL COMMENT 'Input NIM: tepat 13 digit, termasuk nol di depan',
    fullName VARCHAR(255) NULL COMMENT 'Input fullName: nama lengkap',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NULL COMMENT 'Input phone: nomor lokal 08... atau internasional +62...',
    gender VARCHAR(5) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'Input gender: man atau woman',
    tanggal_lahir DATE NULL COMMENT 'Input tanggal_lahir DD/MM/YYYY dikonversi menjadi YYYY-MM-DD',
    legal_agreement BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Persetujuan legal: 1 jika setuju, 0 jika belum setuju',
    privacy_agreement BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Persetujuan privasi: 1 jika setuju, 0 jika belum setuju',
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    profile_completed_at TIMESTAMP NULL DEFAULT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY users_email_unique (email),
    UNIQUE KEY users_nim_unique (NIM),
    CONSTRAINT users_email_not_blank CHECK (CHAR_LENGTH(TRIM(email)) > 0),
    CONSTRAINT users_nim_valid CHECK (
        NIM IS NULL OR (CHAR_LENGTH(NIM) = 13 AND NIM NOT REGEXP '[^0-9]')
    ),
    CONSTRAINT users_gender_valid CHECK (
        gender IS NULL OR gender IN ('man', 'woman')
    ),
    CONSTRAINT users_legal_agreement_valid CHECK (
        legal_agreement IN (0, 1)
    ),
    CONSTRAINT users_privacy_agreement_valid CHECK (
        privacy_agreement IN (0, 1)
    ),
    CONSTRAINT users_complete_profile_required_fields CHECK (
        profile_completed_at IS NULL OR (
            NIM IS NOT NULL
            AND fullName IS NOT NULL AND CHAR_LENGTH(TRIM(fullName)) > 0
            AND phone IS NOT NULL AND CHAR_LENGTH(TRIM(phone)) > 0
            AND gender IS NOT NULL AND tanggal_lahir IS NOT NULL
            AND legal_agreement = 1
            AND privacy_agreement = 1
        )
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE google_accounts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    google_sub VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
        COMMENT 'Claim sub dari ID token Google yang telah diverifikasi backend',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY google_accounts_sub_unique (google_sub),
    UNIQUE KEY google_accounts_user_unique (user_id),
    CONSTRAINT google_accounts_sub_not_blank CHECK (CHAR_LENGTH(TRIM(google_sub)) > 0),
    CONSTRAINT google_accounts_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_otps (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
        COMMENT 'UUID challenge baru setiap pengiriman, bukan kode OTP',
    user_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL COMMENT 'Email tujuan saat kode dikirim',
    purpose VARCHAR(16) NOT NULL COMMENT 'login atau register',
    code_hash VARCHAR(255) NOT NULL COMMENT 'Hash::make OTP 4 digit sesuai frontend; jangan simpan kode asli',
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    -- Satu slot challenge per user dan tujuan. Resend mengganti UUID dan hash.
    UNIQUE KEY email_otps_user_purpose_unique (user_id, purpose),
    KEY email_otps_expires_at_index (expires_at),
    CONSTRAINT email_otps_purpose_valid CHECK (purpose IN ('login', 'register')),
    CONSTRAINT email_otps_attempts_valid CHECK (
        max_attempts BETWEEN 1 AND 10 AND attempts <= max_attempts
    ),
    CONSTRAINT email_otps_expiry_valid CHECK (expires_at > sent_at),
    CONSTRAINT email_otps_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kompatibel dengan SESSION_DRIVER=database pada Laravel.
CREATE TABLE sessions (
    id VARCHAR(255) NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity INT NOT NULL,
    PRIMARY KEY (id),
    KEY sessions_user_id_index (user_id),
    KEY sessions_last_activity_index (last_activity),
    CONSTRAINT sessions_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
