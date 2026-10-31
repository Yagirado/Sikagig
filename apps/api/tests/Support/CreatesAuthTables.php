<?php

namespace Tests\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

trait CreatesAuthTables
{
    protected function createAuthTables(): void
    {
        // HTTP fixture; production MySQL constraints are verified separately.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('NIM', 13)->nullable()->unique();
            $table->string('fullName')->nullable();
            $table->string('email')->collation('NOCASE')->unique();
            $table->string('phone', 32)->nullable();
            $table->string('gender', 5)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->boolean('legal_agreement')->default(false);
            $table->boolean('privacy_agreement')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->collation('NOCASE');
            $table->string('provider', 16)->default('email');
            $table->string('owner_hash', 64)->nullable();
            $table->unique(['email', 'provider']);
            $table->longText('data');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
        Schema::create('email_otps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('pending_registration_id')->nullable()->unique()
                ->constrained('pending_registrations')->cascadeOnDelete();
            $table->string('email');
            $table->string('purpose', 16);
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(5);
            $table->timestamp('sent_at');
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'purpose']);
        });
        Schema::create('google_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('google_sub')->unique();
            $table->timestamps();
        });
        (require database_path('migrations/2026_09_09_082710_create_sessions_table.php'))->up();
    }
}
