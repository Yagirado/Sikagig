<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->string('NIM', 13)->nullable()
                ->comment('Input NIM: tepat 13 digit, termasuk nol di depan');
            $table->string('fullName')->nullable()
                ->comment('Input fullName: nama lengkap');
            $table->string('email');
            $table->string('phone', 32)->nullable()
                ->comment('Input phone: nomor lokal 08... atau internasional +62...');
            $table->string('gender', 5)->charset('ascii')->collation('ascii_bin')->nullable()
                ->comment('Input gender: man atau woman');
            $table->date('tanggal_lahir')->nullable()
                ->comment('Input tanggal_lahir DD/MM/YYYY dikonversi menjadi YYYY-MM-DD');
            $table->boolean('legal_agreement')->default(false)
                ->comment('Persetujuan legal: 1 jika setuju, 0 jika belum setuju');
            $table->boolean('privacy_agreement')->default(false)
                ->comment('Persetujuan privasi: 1 jika setuju, 0 jika belum setuju');
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->unique('email', 'users_email_unique');
            $table->unique('NIM', 'users_nim_unique');
        });

        DB::statement("ALTER TABLE users
            ADD CONSTRAINT users_email_not_blank CHECK (CHAR_LENGTH(TRIM(email)) > 0),
            ADD CONSTRAINT users_nim_valid CHECK (
                NIM IS NULL OR (CHAR_LENGTH(NIM) = 13 AND NIM NOT REGEXP '[^0-9]')
            ),
            ADD CONSTRAINT users_gender_valid CHECK (
                gender IS NULL OR gender IN ('man', 'woman')
            ),
            ADD CONSTRAINT users_legal_agreement_valid CHECK (
                legal_agreement IN (0, 1)
            ),
            ADD CONSTRAINT users_privacy_agreement_valid CHECK (
                privacy_agreement IN (0, 1)
            ),
            ADD CONSTRAINT users_complete_profile_required_fields CHECK (
                profile_completed_at IS NULL OR (
                    NIM IS NOT NULL
                    AND fullName IS NOT NULL AND CHAR_LENGTH(TRIM(fullName)) > 0
                    AND phone IS NOT NULL AND CHAR_LENGTH(TRIM(phone)) > 0
                    AND gender IS NOT NULL AND tanggal_lahir IS NOT NULL
                    AND legal_agreement = 1
                    AND privacy_agreement = 1
                )
            )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
