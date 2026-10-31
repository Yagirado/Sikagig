<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'target_id',
    ];

    // RELASI KE USER PEMILIK FAVORIT
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // RELASI KE GIG (JIKA TYPE GIG)
    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class, 'target_id');
    }

    // RELASI KE JASA (JIKA TYPE JASA)
    public function jasa(): BelongsTo
    {
        return $this->belongsTo(Jasa::class, 'target_id');
    }
}
