<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TAMBAH KOLOM PROGRES DAN CATATAN PENGERJAAN PADA TABEL JASA_ORDERS
        Schema::table('jasa_orders', function (Blueprint $table) {
            $table->unsignedTinyInteger('progress')->default(0)->after('status');
            $table->string('progress_notes', 500)->nullable()->after('progress');
        });
    }

    public function down(): void
    {
        Schema::table('jasa_orders', function (Blueprint $table) {
            $table->dropColumn(['progress', 'progress_notes']);
        });
    }
};
