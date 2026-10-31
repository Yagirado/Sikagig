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
            if (Schema::hasColumn('topups', 'duitku_reference')) {
                $table->renameColumn('duitku_reference', 'provider_reference');
            }
        });

        Schema::table('escrow_payments', function (Blueprint $table) {
            if (Schema::hasColumn('escrow_payments', 'duitku_reference')) {
                $table->renameColumn('duitku_reference', 'provider_reference');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topups', function (Blueprint $table) {
            if (Schema::hasColumn('topups', 'provider_reference')) {
                $table->renameColumn('provider_reference', 'duitku_reference');
            }
        });

        Schema::table('escrow_payments', function (Blueprint $table) {
            if (Schema::hasColumn('escrow_payments', 'provider_reference')) {
                $table->renameColumn('provider_reference', 'duitku_reference');
            }
        });
    }
};
