<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gigs', function (Blueprint $table) {
            // BATAS KUOTA PEKERJA UNTUK MODE BARENGAN
            $table->unsignedInteger('max_workers')->default(1)->after('mode');
        });
    }

    public function down(): void
    {
        Schema::table('gigs', function (Blueprint $table) {
            $table->dropColumn('max_workers');
        });
    }
};
