<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJasaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'description' => 'required|string',
            'brief_requirements' => 'nullable|string',
            'portfolio' => 'nullable|array',
            'portfolio.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120', // MAX 5MB per file
            'packages' => 'nullable|string', // Karena dari frontend dikirim sebagai JSON string (FormData)
        ];
    }
}
