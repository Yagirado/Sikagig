<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'progress',
        'progress_notes',
        'submission_status',
        'proof_file',
        'proof_link',
        'proof_notes',
        'student_name',
        'student_nim',
        'student_phone',
        'submitted_at',
    ];

    // CASTING TIPE DATA
    protected $casts = [
        'price' => 'decimal:2',
        'progress' => 'integer',
        'submitted_at' => 'datetime',
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

    public function escrow(): HasOne
    {
        return $this->hasOne(Escrow::class);
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }
}
