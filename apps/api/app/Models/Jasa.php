<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jasa extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category',
        'price',
        'description',
        'brief_requirements',
        'portfolio',
        'packages',
        'status',
    ];

    protected $casts = [
        'portfolio' => 'array',
        'packages' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // RELASI KE DAFTAR ORDER
    public function orders(): HasMany
    {
        return $this->hasMany(JasaOrder::class);
    }
}

