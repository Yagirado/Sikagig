<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gigs', function (Blueprint $table) {
            // MODE GIG: 'sendiri' atau 'barengan' (banyak jagoan)
            $table->string('mode')->default('sendiri')->after('urgency');
            // DEADLINE/TANGGAL PENGERJAAN
            $table->date('deadline')->nullable()->after('mode');
        });
    }

    public function down(): void
    {
        Schema::table('gigs', function (Blueprint $table) {
            $table->dropColumn(['mode', 'deadline']);
        });
    }
};
