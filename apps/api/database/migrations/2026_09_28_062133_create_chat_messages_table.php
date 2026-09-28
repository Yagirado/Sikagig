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
        Schema::create('conversations', function (Blueprint $table){
            $table->id();

            $table->foreignId('proposal_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('jasa_order_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('client_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('worker_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->restrictOnDelete();
                
            $table->text('message');
            $table->timestamps();


            $table->index(['conversation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('conversations');
    }
};
