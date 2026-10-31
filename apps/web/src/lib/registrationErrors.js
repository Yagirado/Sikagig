import { birthDateError } from './birthDate.js';

const REQUIRED_MESSAGE = 'Semua field wajib diisi.';
const FIELD_MESSAGES = {
  NIM: 'NIM harus tepat 13 digit angka.',
  fullName: 'Nama lengkap tidak valid.',
  email: 'Format email tidak valid. Contoh: nama@gmail.com.',
  phone: 'Gunakan nomor telfon format 08 dan berisi 10-13 digit angka',
  gender: 'Gender wajib dipilih.',
};

export function registrationFormError(form) {
  const inputs = Array.from(form.elements).filter((input) => input.willValidate);
  const hasEmptyField = inputs.some((input) => input.validity.valueMissing || (
    input.required && !['radio', 'checkbox'].includes(input.type) && input.value.trim() === ''
  ));
  if (hasEmptyField) return REQUIRED_MESSAGE;

  const errors = new Map();
  for (const input of inputs) {
    const dateError = input.name === 'tanggal_lahir' ? birthDateError(input.value) : '';
    if (!input.validity.valid || dateError) {
      errors.set(input.name || input.id, dateError || FIELD_MESSAGES[input.name] || input.validationMessage);
    }
  }
  return Array.from(errors.values()).join('\n');
}

export function registrationResponseError(data) {
  const messages = Object.values(data.errors ?? {})
    .flat()
    .filter((message) => typeof message === 'string' && message.trim() !== '')
    .map((message) => message.trim());
  if (messages.includes(REQUIRED_MESSAGE)) return REQUIRED_MESSAGE;
  return [...new Set(messages)].join('\n') || data.message || 'Gagal mengirim OTP registrasi.';
}
