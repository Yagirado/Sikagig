<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewListingPosted extends Notification
{
    use Queueable;

    public function __construct(
        private string $type,
        private int $listingId,
        private string $title,
        private string $authorName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'listing_id' => $this->listingId,
            'title' => $this->title,
            'author_name' => $this->authorName,
            'message' => "{$this->authorName} baru membuat {$this->type}",
            'url' => "/{$this->type}/{$this->listingId}",
        ];
    }
}