<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gig extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'urgency',
        'mode',
        'deadline',
        'description',
        'budget',
        'photos',
        'status',
    ];

    protected $casts = [
        'photos' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // RELASI KE DAFTAR PROPOSAL
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }
}

