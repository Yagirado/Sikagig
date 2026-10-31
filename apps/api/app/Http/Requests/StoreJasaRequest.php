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

    public function attributes(): array
    {
        return [
            'name' => 'nama jasa',
            'category' => 'kategori',
            'description' => 'deskripsi jasa',
            'brief_requirements' => 'catatan persiapan untuk juragan',
            'portfolio.*' => 'lampiran portofolio',
            'packages' => 'paket harga',
            'packages.*.nama' => 'nama paket',
            'packages.*.harga' => 'harga paket',
            'packages.*.estimasi' => 'estimasi pengerjaan paket',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama jasa wajib diisi.',
            'category.required' => 'Kategori jasa wajib dipilih.',
            'category.in' => 'Kategori jasa yang dipilih tidak valid.',
            'description.required' => 'Deskripsi jasa wajib diisi.',
            'packages.required' => 'Minimal satu paket harga harus diatur.',
            'packages.*.nama.required' => 'Nama paket pada paket aktif wajib diisi.',
            'packages.*.harga.required' => 'Harga pada paket aktif wajib diisi.',
            'packages.*.harga.integer' => 'Harga paket harus berupa angka bulat yang valid.',
            'packages.*.harga.min' => 'Harga paket minimal Rp 0.',
            'packages.*.estimasi.required' => 'Estimasi waktu pengerjaan pada paket aktif wajib diisi.',
            'portfolio.*.file' => 'Lampiran portofolio harus berupa file.',
            'portfolio.*.mimes' => 'Format portofolio harus berupa JPEG, PNG, JPG, atau PDF.',
            'portfolio.*.max' => 'Ukuran file portofolio maksimal 5MB per file.',
        ];
    }
}
