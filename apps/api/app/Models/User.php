<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'NIM',
    'fullName',
    'email',
    'phone',
    'gender',
    'tanggal_lahir',
    'legal_agreement',
    'privacy_agreement',
])]
#[Hidden(['remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'legal_agreement' => 'boolean',
            'privacy_agreement' => 'boolean',
            'tanggal_lahir' => 'date',
            'email_verified_at' => 'datetime',
            'profile_completed_at' => 'datetime',
        ];
    }

    public function googleAccount(): HasOne
    {
        return $this->hasOne(GoogleAccount::class);
    }

    public function emailOtps(): HasMany
    {
        return $this->hasMany(EmailOtp::class);
    }
}