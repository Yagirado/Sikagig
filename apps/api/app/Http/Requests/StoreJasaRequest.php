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
            'portfolio' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120', // MAX 5MB
        ];
    }
}
