<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use JsonException;

class StoreJasaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function prepareForValidation()
    {
        $packeges = $this->input('packages');

        if(! is_string($packeges)){
            return;
        }

        try {
            $decode = json_decode(
                $packeges,
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException) {
            throw ValidationException::withMessages([
                'packages' => 'Format JSON paket tidak valid.',
            ]);
        }

        $this->merge(['packages' => $decode]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => [
                'required',
                Rule::in([
                    'Joki Tugas',
                    'Desain Grafis',
                    'Anterin',
                    'Coding',
                    'Survey & Data',
                    'Jastip',
                    'Antriin',
                    'Fisik',
                    'Curhat',
                    'Hiburan & Mabar',
                    'Fotografi & Video',
                    'Editing',
                    'Random',
                ]),
            ],
            'description' => ['required', 'string'],
            'brief_requirements' => ['nullable', 'string'],
            'price' => ['exclude'],
            'portfolio' => ['nullable', 'array'],
            'portfolio.*' => [
                'file',
                'mimes:jpeg,png,jpg,pdf',
                'max:5120',
            ],
            'packages' => ['required', 'array', 'list', 'min:1', 'max:4'],
            'packages.*' => [
                'required',
                'array:id,nama,deskripsi,harga,estimasi,revisi,termasuk,termasukList,tampilkan',
            ],
            'packages.*.id' => ['nullable', 'integer'],
            'packages.*.nama' => ['required', 'string', 'max:100'],
            'packages.*.deskripsi' => ['nullable', 'string'],
            'packages.*.harga' => [
                'required',
                'integer',
                'min:0',
                'max:9999999999999',
            ],
            'packages.*.estimasi' => ['required', 'string', 'max:100'],
            'packages.*.revisi' => ['nullable', 'integer', 'min:0'],
            'packages.*.termasuk' => ['nullable', 'string'],
            'packages.*.termasukList' => ['nullable', 'array', 'list'],
            'packages.*.termasukList.*' => ['required', 'string', 'max:255'],
            'packages.*.tampilkan' => ['required', 'boolean'],
        ];
    }
}
