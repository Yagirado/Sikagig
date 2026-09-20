<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jasas', function (Blueprint $table) {
            $table->id();

            // RELASI KE TABEL USERS (PENYEDIA JASA)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // DATA JASA
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 15, 2);
            $table->text('description');
            $table->text('brief_requirements')->nullable();
            $table->string('portfolio')->nullable(); // SIMPAN FILE PDF/GAMBAR

            // STATUS JASA (ACTIVE, INACTIVE)
            $table->string('status')->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jasas');
    }
};
