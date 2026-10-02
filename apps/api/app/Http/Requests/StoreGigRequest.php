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
            'mode' => 'nullable|string|in:sendiri,barengan',
            'max_workers' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    if ($this->input('mode') === 'barengan') {
                        if (empty($value) || (int) $value <= 1) {
                            $fail('Untuk mode Barengan, batas maksimal pekerja minimal 2 orang.');
                        }
                        if ((int) $value > 50) {
                            $fail('Batas maksimal pekerja tidak boleh melebihi 50 orang.');
                        }
                    }
                },
            ],
            'deadline' => 'nullable|date',
            'description' => 'required|string',
            'budget' => 'required|numeric|min:0',
            'photos' => 'nullable|array',
            'photos.*' => 'file|image|max:2048', // MAX 2MB per foto
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'judul gig',
            'category' => 'kategori',
            'urgency' => 'urgensi',
            'description' => 'deskripsi gig',
            'budget' => 'budget',
            'photos.*' => 'foto gig',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul Gig wajib diisi.',
            'category.required' => 'Kategori Gig wajib dipilih.',
            'urgency.required' => 'Urgensi Gig wajib dipilih.',
            'description.required' => 'Deskripsi Gig wajib diisi.',
            'budget.required' => 'Budget Gig wajib diisi.',
            'budget.numeric' => 'Budget Gig harus berupa angka yang valid.',
            'budget.min' => 'Budget Gig minimal Rp 0.',
            'photos.*.image' => 'File lampiran harus berupa format gambar.',
            'photos.*.max' => 'Ukuran foto maksimal 2MB per foto.',
        ];
    }
}
