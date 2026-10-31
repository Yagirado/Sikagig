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
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('balance')->default(0);
            $table->timestamps();
        });

        Schema::create('topups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('merchant_order_id')->unique();
            $table->string('duitku_reference')->nullable()->unique();

            $table->unsignedBigInteger('amount');
            $table->string('payment_method', 10); // nanti: SP
            $table->enum('status', ['pending', 'paid', 'failed', 'expired'])
                ->default('pending');

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topups');
        Schema::dropIfExists('wallets');
    }
};
