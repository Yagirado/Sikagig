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
        Schema::create('google_accounts', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('google_sub')->charset('ascii')->collation('ascii_bin')
                ->comment('Claim sub dari ID token Google yang telah diverifikasi backend');
            $table->timestamps();

            $table->unique('google_sub', 'google_accounts_sub_unique');
            $table->unique('user_id', 'google_accounts_user_unique');
            $table->foreign('user_id', 'google_accounts_user_fk')
                ->references('id')->on('users')->cascadeOnDelete();
        });

        DB::statement('ALTER TABLE google_accounts
            ADD CONSTRAINT google_accounts_sub_not_blank CHECK (CHAR_LENGTH(TRIM(google_sub)) > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('google_accounts');
    }
};
