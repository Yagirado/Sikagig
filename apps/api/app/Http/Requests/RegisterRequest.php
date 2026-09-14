<?php

namespace App\Http\Requests;

use DateTimeImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'NIM' => ['required', 'string', 'regex:/^[0-9]{13}$/', 'unique:users,NIM'],
            'fullName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^(?:08[0-9]{8,11}|\+62[0-9]{9,12})$/'],
            'gender' => ['required', 'in:man,woman'],
            'tanggal_lahir' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'legal_agreement' => ['required', 'accepted'],
            'privacy_agreement' => ['required', 'accepted'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }

        $birthDate = $this->input('tanggal_lahir');
        if (is_string($birthDate) && preg_match('/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/', $birthDate)) {
            $date = DateTimeImmutable::createFromFormat('!d/m/Y', $birthDate);
            if ($date && $date->format('d/m/Y') === $birthDate) {
                $this->merge(['tanggal_lahir' => $date->format('Y-m-d')]);
            }
        }
    }

    public function messages(): array
    {
        return [
            'NIM.regex' => 'NIM harus tepat 13 digit angka.',
            'NIM.unique' => 'NIM sudah digunakan.',
            'email.unique' => 'Email sudah terdaftar. Silakan login.',
            'phone.regex' => 'Nomor HP harus menggunakan format 08... atau +62... yang valid.',
            'tanggal_lahir.date_format' => 'Tanggal lahir harus valid dengan format DD/MM/YYYY atau YYYY-MM-DD.',
            'tanggal_lahir.before_or_equal' => 'Tanggal lahir tidak boleh di masa depan.',
            'legal_agreement.accepted' => 'Ketentuan penggunaan wajib disetujui.',
            'privacy_agreement.accepted' => 'Kebijakan privasi wajib disetujui.',
        ];
    }
}
