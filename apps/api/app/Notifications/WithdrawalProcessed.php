<?php

namespace App\Notifications;

use App\Models\Withdrawal;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WithdrawalProcessed extends Notification
{
    use Queueable;

    public function __construct(private Withdrawal $withdrawal) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'withdrawal_processed',
            'withdrawal_id' => $this->withdrawal->id,
            'title' => 'Penarikan dana selesai',
            'message' => 'Penarikan dana sebesar Rp '.number_format($this->withdrawal->amount, 0, ',', '.').' sudah berhasil dicairkan.',
            'url' => '/wallet-transaksi',
        ];
    }
}
