<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TABEL ORDER UNTUK PEMBELIAN JASA
        Schema::create('jasa_orders', function (Blueprint $table) {
            $table->id();

            // RELASI KE JASA, PEMBELI, DAN PENJUAL
            $table->foreignId('jasa_id')->constrained()->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();

            // DETAIL ORDER DAN PAKET
            $table->string('package_name');
            $table->decimal('price', 15, 2);
            $table->text('brief_notes')->nullable();

            // STATUS ORDER: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
            $table->string('status')->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jasa_orders');
    }
};
