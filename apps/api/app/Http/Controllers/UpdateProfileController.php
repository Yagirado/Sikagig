<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'NIM'      => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'NIM')->ignore($user->id),
            ],
            'gender'   => ['nullable', 'in:man,woman'],
        ], [
            'fullName.required' => 'Nama lengkap wajib diisi.',
            'fullName.min'      => 'Nama lengkap minimal 2 karakter.',
            'NIM.required'      => 'NIM wajib diisi.',
            'NIM.unique'        => 'NIM sudah digunakan oleh pengguna lain.',
            'gender.in'         => 'Gender tidak valid.',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $user->only(['id', 'email', 'fullName', 'NIM', 'gender']),
        ]);
    }
}