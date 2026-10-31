<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->text('message')->nullable()->change();
        });

        Schema::create('chat_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_message_id')
                ->constrained('chat_messages')
                ->cascadeOnDelete();
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_message_attachments');
        DB::table('chat_messages')->whereNull('message')->update(['message' => '']);

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->text('message')->nullable(false)->change();
        });
    }
};
