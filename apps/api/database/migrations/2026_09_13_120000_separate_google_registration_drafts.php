<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pending_registrations', function (Blueprint $table) {
            $table->string('provider', 16)->default('email');
            $table->string('owner_hash', 64)->nullable();
            $table->dropUnique('pending_registrations_email_unique');
            $table->unique(['email', 'provider'], 'pending_email_provider_unique');
        });
    }

    public function down(): void
    {
        DB::table('pending_registrations')->where('provider', 'google')->delete();
        Schema::table('pending_registrations', function (Blueprint $table) {
            $table->dropUnique('pending_email_provider_unique');
            $table->dropColumn(['provider', 'owner_hash']);
            $table->unique('email');
        });
    }
};
