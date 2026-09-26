<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JasaOrder extends Model
{
    use HasFactory;

    // KOLOM YANG BISA DIISI
    protected $fillable = [
        'jasa_id',
        'buyer_id',
        'seller_id',
        'package_name',
        'price',
        'brief_notes',
        'status',
    ];

    // CASTING TIPE DATA
    protected $casts = [
        'price' => 'decimal:2',
    ];

    // RELASI KE JASA
    public function jasa(): BelongsTo
    {
        return $this->belongsTo(Jasa::class);
    }

    // RELASI KE PEMBELI
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // RELASI KE PENJUAL
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
