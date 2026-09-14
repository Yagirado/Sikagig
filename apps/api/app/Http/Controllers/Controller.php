<?php

namespace App\Http\Controllers;

use App\Http\Requests\VerifyOtpRequest;

abstract class Controller
{
    public function verify(VerifyOtpRequest $request)
    {
        $data = $request->validated();

        // Lanjutkan pemeriksaan challenge dan OTP.
    }
}
