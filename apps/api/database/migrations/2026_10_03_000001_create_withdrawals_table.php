<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->enum('destination_type', ['ewallet', 'bank']);
            $table->string('provider', 50);
            $table->string('account_name', 100);
            $table->string('destination_number', 30);
            $table->enum('status', ['pending', 'processed', 'rejected'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
