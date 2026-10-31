<?php

namespace App\Http\Requests;

class GoogleRegisterRequest extends RegisterRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'email' => ['prohibited'], 'google_sub' => ['prohibited'], 'google' => ['prohibited'],
            'provider' => ['prohibited'], 'email_verified_at' => ['prohibited'],
        ]);
    }
}
