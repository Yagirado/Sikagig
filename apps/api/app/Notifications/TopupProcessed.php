<?php

namespace App\Notifications;

use App\Models\Topup;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TopupProcessed extends Notification
{
    use Queueable;

    public function __construct(private Topup $topup) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'topup_processed',
            'topup_id' => $this->topup->id,
            'title' => 'Top up berhasil',
            'message' => 'Top up sebesar Rp '.number_format($this->topup->amount, 0, ',', '.').' berhasil ditambahkan ke saldo wallet.',
            'url' => '/wallet-transaksi',
        ];
    }
}
