<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proposal extends Model
{
    use HasFactory;

    // KOLOM YANG BISA DIISI
    protected $fillable = [
        'gig_id',
        'user_id',
        'cover_letter',
        'bid_amount',
        'status',
    ];

    // CASTING TIPE DATA
    protected $casts = [
        'bid_amount' => 'decimal:2',
    ];

    // RELASI KE GIG
    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    // RELASI KE USER PELAMAR
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
