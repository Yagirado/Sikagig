<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{conversation}', function (User $user, Conversation $conversation) {
    return $conversation->canAccess($user);
},
['guards' => ['web']],
);
