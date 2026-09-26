<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jasa_ratings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('jasa_id')
                ->constrained('jasas')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('score');
            $table->timestamps();

            $table->unique(['jasa_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jasa_ratings');
    }
};