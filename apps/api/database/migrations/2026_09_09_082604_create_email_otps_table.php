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
        Schema::create('email_otps', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->char('id', 36)->charset('ascii')->collation('ascii_bin')->primary()
                ->comment('UUID challenge baru setiap pengiriman, bukan kode OTP');
            $table->unsignedBigInteger('user_id');
            $table->string('email')->comment('Email tujuan saat kode dikirim');
            $table->string('purpose', 16)->comment('login atau register');
            $table->string('code_hash')->comment('Hash::make OTP 4 digit sesuai frontend; jangan simpan kode asli');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(5);
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'purpose'], 'email_otps_user_purpose_unique');
            $table->index('expires_at', 'email_otps_expires_at_index');
            $table->foreign('user_id', 'email_otps_user_fk')
                ->references('id')->on('users')->cascadeOnDelete();
        });

        DB::statement("ALTER TABLE email_otps
            ADD CONSTRAINT email_otps_purpose_valid CHECK (purpose IN ('login', 'register')),
            ADD CONSTRAINT email_otps_attempts_valid CHECK (
                max_attempts BETWEEN 1 AND 10 AND attempts <= max_attempts
            ),
            ADD CONSTRAINT email_otps_expiry_valid CHECK (expires_at > sent_at)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_otps');
    }
};
