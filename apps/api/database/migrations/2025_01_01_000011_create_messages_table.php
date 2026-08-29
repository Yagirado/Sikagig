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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('sender_id');
            $table->text('body');
            $table->tinyInteger('is_read')->default(0);

            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            // Composite index for paginated history queries
            $table->index(['conversation_id', 'created_at'], 'messages_conversation_id_created_at_index');

            // Individual indexes
            $table->index('sender_id');
            $table->index('is_read');

            // Foreign key constraints
            $table->foreign('conversation_id')
                  ->references('id')->on('conversations')
                  ->onDelete('cascade');

            $table->foreign('sender_id')
                  ->references('id')->on('users')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
