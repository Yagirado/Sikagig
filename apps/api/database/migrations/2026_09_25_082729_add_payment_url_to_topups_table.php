<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('topups', function (Blueprint $table) {
            $table->text('payment_url')->nullable()->after('duitku_reference');
        });
    }
    /**
     * Reverse the migrations.
     */

    public function down(): void
    {
        Schema::table('topups', function (Blueprint $table) {
            $table->dropColumn('payment_url');
        });
    }
};
