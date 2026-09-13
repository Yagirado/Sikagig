<?php

use App\Http\Controllers\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth-google-redirect', [GoogleAuthController::class, 'redirect'])->block(60, 20);
Route::get('/auth-google-callback', [GoogleAuthController::class, 'callback'])->block(60, 20);
