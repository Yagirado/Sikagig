<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'urgency' => 'required|string',
            'description' => 'required|string',
            'budget' => 'required|numeric|min:0',
            'photos' => 'nullable|array',
            'photos.*' => 'file|image|max:2048', // MAX 2MB per foto
        ];
    }
}
