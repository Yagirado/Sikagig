<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth-google-redirect', [AuthController::class, 'google-redirect']);
Route::get('/auth-google-callback', [AuthController::class, 'google-callback']);

