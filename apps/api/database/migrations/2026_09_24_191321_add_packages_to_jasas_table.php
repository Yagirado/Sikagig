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
        Schema::table('jasas', function (Blueprint $table) {
            $table->longText('packages')->nullable()->after('description');
            $table->longText('portfolio')->nullable()->change();
        });
        
        Schema::table('gigs', function (Blueprint $table) {
            $table->longText('photos')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jasas', function (Blueprint $table) {
            $table->dropColumn('packages');
            $table->string('portfolio')->nullable()->change();
        });
        
        Schema::table('gigs', function (Blueprint $table) {
            $table->string('photos')->nullable()->change();
        });
    }
};
