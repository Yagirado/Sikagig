<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TelegramService
{
    public static function sendNotification(string $message)
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.admin_chat_id');

        if (!$token || !$chatId) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ]);
    }
}
