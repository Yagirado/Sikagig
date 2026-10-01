<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('escrows', function (Blueprint $table) {
            $table->id();

            $table->foreignId('proposal_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('jasa_order_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('client_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('worker_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('amount');

            $table->string('payment_method', 20)->nullable();

            $table->enum('status', [
                'awaiting_payment',
                'holding',
                'released',
                'refunded',
                'disputed',
                'expired',
                'failed',
            ])->default('awaiting_payment');

            $table->timestamp('held_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();
        });

        DB::statement(
            'ALTER TABLE escrows ADD CONSTRAINT escrows_single_source_check CHECK (
                (proposal_id IS NOT NULL AND jasa_order_id IS NULL)
                OR
                (proposal_id IS NULL AND jasa_order_id IS NOT NULL)
            )'
        );

        Schema::create('escrow_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('escrow_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('payer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('amount');

            $table->string('method', 20);

            $table->enum('status', [
                'pending',
                'paid',
                'failed',
                'expired',
                'refunded',
            ])->default('pending');

            $table->string('merchant_order_id')->nullable()->unique();
            $table->string('duitku_reference')->nullable()->unique();
            $table->text('payment_url')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escrows_and_escrows_payment_tables');
        Schema::dropIfExists('escrows');
    }
};
