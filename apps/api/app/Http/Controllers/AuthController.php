<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Socialite;

class AuthController extends Controller
{
    public function google_redirect(){
        return Socialite::driver('google')->redirect();
    }

    public function google_callback(){
        $googleUser = Socialite::driver('google')->user();
        $user = User::whereEmail($googleUser->email)->first();
    }
}
