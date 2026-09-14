import assert from 'node:assert/strict';
import test from 'node:test';
import { registrationFormError, registrationResponseError } from '../src/lib/registrationErrors.js';

const input = (name, value, validity = {}) => ({
  name, value, type: 'text', required: true, willValidate: true,
  validity: { valid: true, valueMissing: false, ...validity },
  validationMessage: 'Invalid value',
});

test('a missing field takes priority over format errors', () => {
  const elements = [input('email', 'wrong', { valid: false }), input('NIM', '', { valid: false, valueMissing: true })];
  assert.equal(registrationFormError({ elements }), 'Semua field wajib diisi.');
});

test('a whitespace-only name counts as empty', () => {
  assert.equal(registrationFormError({ elements: [input('fullName', '   ')] }), 'Semua field wajib diisi.');
});

test('all populated invalid fields keep their own messages', () => {
  const elements = [input('NIM', '123', { valid: false }), input('email', 'wrong', { valid: false }), input('phone', '123', { valid: false })];
  assert.equal(registrationFormError({ elements }), 'NIM harus tepat 13 digit angka.\nFormat email tidak valid. Contoh: nama@gmail.com.\nGunakan nomor telfon format 08');
});

test('valid fields produce no popup error', () => {
  assert.equal(registrationFormError({ elements: [input('NIM', '0123456789012'), input('email', 'person@example.com')] }), '');
});

test('radio choices count as a single field', () => {
  const elements = ['man', 'woman'].map(value => ({ ...input('gender', value, { valid: false }), type: 'radio' }));
  assert.equal(registrationFormError({ elements }), 'Gender wajib dipilih.');
});

test('both duplicate identity messages remain visible', () => {
  assert.equal(registrationResponseError({ errors: { NIM: ['NIM sudah digunakan.'], email: ['Email sudah digunakan.'] } }), 'NIM sudah digunakan.\nEmail sudah digunakan.');
});

test('single duplicates and unrelated backend validation are preserved', () => {
  assert.equal(registrationResponseError({ errors: { NIM: ['NIM sudah digunakan.'] } }), 'NIM sudah digunakan.');
  assert.equal(registrationResponseError({ errors: { email: ['Email sudah digunakan.'] } }), 'Email sudah digunakan.');
  assert.equal(registrationResponseError({ errors: { phone: ['Nomor HP tidak valid.'], tanggal_lahir: ['Tanggal tidak valid.'] } }), 'Nomor HP tidak valid.\nTanggal tidak valid.');
});

test('backend required messages are deduplicated', () => {
  assert.equal(registrationResponseError({ errors: { NIM: ['Semua field wajib diisi.'], fullName: ['Semua field wajib diisi.'] } }), 'Semua field wajib diisi.');
});

test('server failures without field errors retain the message or fallback', () => {
  assert.equal(registrationResponseError({ message: 'Tunggu sebelum mengirim ulang OTP.' }), 'Tunggu sebelum mengirim ulang OTP.');
  assert.equal(registrationResponseError({}), 'Gagal mengirim OTP registrasi.');
});
