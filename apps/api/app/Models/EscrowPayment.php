<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscrowPayment extends Model
{
    protected $fillable = [
        'escrow_id',
        'payer_id',
        'amount',
        'method',
        'status',
        'merchant_order_id',
        'duitku_reference',
        'payment_url',
        'expires_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function escrow(): BelongsTo
    {
        return $this->belongsTo(Escrow::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }
}