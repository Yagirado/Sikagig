<?php

use Illuminate\Support\Facades\Route;

Route::get('/hello', function () {
    return response()->json([
        'message' => 'React berhasil terhubung ke Laravel!',
    ]);
});