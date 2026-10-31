<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // TABEL FAVORIT UNTUK GIG DAN JASA
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // 'gig' ATAU 'jasa'
            $table->unsignedBigInteger('target_id');
            $table->timestamps();

            $table->unique(['user_id', 'type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
