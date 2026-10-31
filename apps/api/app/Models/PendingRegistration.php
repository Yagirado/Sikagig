<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['email', 'provider', 'owner_hash', 'data', 'expires_at'])]
#[Hidden(['data', 'owner_hash'])]
class PendingRegistration extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return ['data' => 'encrypted:array', 'expires_at' => 'datetime'];
    }

    public function otp(): HasOne
    {
        return $this->hasOne(EmailOtp::class)->where('purpose', 'register');
    }
}
