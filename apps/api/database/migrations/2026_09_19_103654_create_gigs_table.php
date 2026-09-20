<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gigs', function (Blueprint $table) {
            $table->id();

            // RELASI KE TABEL USERS (PEMILIK GIG)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // DATA GIG
            $table->string('title');
            $table->string('category');
            $table->string('urgency');
            $table->text('description');
            $table->decimal('budget', 15, 2);
            $table->string('photos')->nullable(); // SIMPAN NAMA FILE GAMBAR

            // STATUS GIG (OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
            $table->string('status')->default('open');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gigs');
    }
};
