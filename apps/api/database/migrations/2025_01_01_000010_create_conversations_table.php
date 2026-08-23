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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('proposal_id')->unique();
            $table->unsignedBigInteger('gig_id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('freelancer_id');

            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            // Indexes
            $table->index('client_id');
            $table->index('freelancer_id');
            $table->index('last_message_at');

            // Foreign key constraints
            $table->foreign('proposal_id')
                  ->references('id')->on('proposals')
                  ->onDelete('restrict');

            $table->foreign('gig_id')
                  ->references('id')->on('gigs')
                  ->onDelete('restrict');

            $table->foreign('client_id')
                  ->references('id')->on('users')
                  ->onDelete('restrict');

            $table->foreign('freelancer_id')
                  ->references('id')->on('users')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
