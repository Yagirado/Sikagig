<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'bid_amount' => 'decimal:2',
        'progress' => 'integer',
        'submitted_at' => 'datetime',
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

    public function escrow(): HasOne
    {
        return $this->hasOne(Escrow::class);
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }
}
