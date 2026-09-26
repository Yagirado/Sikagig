<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JasaRating extends Model
{
    protected $fillable = ['score'];

    protected $casts = [
        'score' => 'integer',
    ];

    public function jasa(): BelongsTo
    {
        return $this->belongsTo(Jasa::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}