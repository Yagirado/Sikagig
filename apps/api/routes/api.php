<?php

use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\OtpAuthController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('web')->group(function () {
    Route::get('/google/redirect', [GoogleAuthController::class, 'redirect'])->block(60, 20);
    Route::get('/google/register/redirect', [GoogleAuthController::class, 'registerRedirect'])->block(60, 20);
    Route::get('/google/callback', [GoogleAuthController::class, 'callback'])->block(60, 20);
    Route::get('/google/profile/redirect', [GoogleAuthController::class, 'profileRedirect'])->block(60, 20);
    Route::get('/google/profile/callback', [GoogleAuthController::class, 'callback'])->block(60, 20);
    Route::get('/google/draft', [GoogleAuthController::class, 'draft']);
    Route::post('/google/register', [GoogleAuthController::class, 'register'])->block(60, 20);
    Route::post('/google/email/request-otp', [GoogleAuthController::class, 'sendEmailOtp'])
        ->middleware('throttle:10,1,otp-send')->block(60, 20);
    Route::post('/google/email/verify-otp', [GoogleAuthController::class, 'verifyEmailOtp'])
        ->middleware('throttle:30,1,otp-verify')->block(60, 20);
    Route::get('/csrf-token', [OtpAuthController::class, 'csrfToken']);
    Route::post('/register/request-otp', [RegistrationController::class, 'send'])
        ->middleware('throttle:10,1,otp-send');
    Route::post('/register/verify-otp', [RegistrationController::class, 'verify'])
        ->middleware('throttle:30,1,otp-verify');
    Route::post('/request-otp', [OtpAuthController::class, 'send'])
        ->middleware('throttle:10,1,otp-send');
    Route::post('/verify-otp', [OtpAuthController::class, 'verify'])
        ->middleware('throttle:30,1,otp-verify');
    Route::get('/me', [OtpAuthController::class, 'me'])->middleware('auth:web');
    Route::post('/logout', [OtpAuthController::class, 'logout'])->middleware('auth:web');
});

// RUTE GIG DAN JASA 
Route::middleware(['web', 'auth:web'])->group(function () {
    Route::get('/gigs', [\App\Http\Controllers\GigController::class, 'index']);
    Route::post('/gigs', [\App\Http\Controllers\GigController::class, 'store']);
    Route::get('/jasas', [\App\Http\Controllers\JasaController::class, 'index']);
    Route::post('/jasas', [\App\Http\Controllers\JasaController::class, 'store']);
});
