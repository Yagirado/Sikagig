<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->changeUserNullable(true);
        Schema::table('email_otps', function (Blueprint $table) {
            $table->char('pending_registration_id', 36)->charset('ascii')->collation('ascii_bin')->nullable();
            $table->unique('pending_registration_id', 'email_otps_pending_unique');
            $table->foreign('pending_registration_id', 'email_otps_pending_fk')
                ->references('id')->on('pending_registrations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // These OTPs cannot exist in the old schema because no user exists yet.
        DB::table('email_otps')->whereNull('user_id')->delete();
        Schema::table('email_otps', function (Blueprint $table) {
            $table->dropForeign(DB::getDriverName() === 'mysql' ? 'email_otps_pending_fk' : ['pending_registration_id']);
            $table->dropUnique('email_otps_pending_unique');
            $table->dropColumn('pending_registration_id');
        });
        $this->changeUserNullable(false);
    }

    private function changeUserNullable(bool $nullable): void
    {
        // MySQL requires detaching the FK before modifying its column.
        if (DB::getDriverName() === 'mysql') {
            Schema::table('email_otps', fn (Blueprint $table) => $table->dropForeign('email_otps_user_fk'));
        }
        Schema::table('email_otps', fn (Blueprint $table) => $table->unsignedBigInteger('user_id')->nullable($nullable)->change());
        if (DB::getDriverName() === 'mysql') {
            Schema::table('email_otps', fn (Blueprint $table) => $table->foreign('user_id', 'email_otps_user_fk')
                ->references('id')->on('users')->cascadeOnDelete());
        }
    }
};
