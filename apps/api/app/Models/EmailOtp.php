<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'email',
    'purpose',
    'code_hash',
    'attempts',
    'max_attempts',
    'sent_at',
    'expires_at',
    'consumed_at',
])]
#[Hidden(['code_hash'])]
class EmailOtp extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'attempts' => 'integer',
            'max_attempts' => 'integer',
            'sent_at' => 'datetime',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
