import { getCsrfToken } from './api.js';

export function otpEndpoint(flow, action) {
  if (!['login', 'register'].includes(flow)) {
    throw new Error('Alur OTP tidak valid. Silakan minta OTP kembali.');
  }
  return `/api/auth/${flow === 'register' ? 'register/' : ''}${action}-otp`;
}

export function retryDeadline(seconds = 60, now = Date.now()) {
  const duration = Number(seconds);
  return now + (Number.isFinite(duration) && duration >= 0 ? duration : 60) * 1000;
}

export function remainingSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

async function postOtp(endpoint, payload) {
  const csrfToken = await getCsrfToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const messages = Object.values(data.errors ?? {}).flat()
      .filter((message) => typeof message === 'string' && message.trim());
    const error = new Error([...new Set(messages)].join('\n') || data.message || 'Permintaan OTP gagal. Silakan coba lagi.');
    if (response.status === 429) {
      error.retryAfter = data.retry_after ?? response.headers.get('Retry-After') ?? 60;
    }
    throw error;
  }
  return data;
}

export async function verifyOtp({ flow, challengeId, code }) {
  if (!challengeId) throw new Error('Data OTP tidak tersedia. Silakan minta OTP kembali.');
  if (!/^[0-9]{4}$/.test(code)) throw new Error('Masukkan kode OTP lengkap, 4 digit angka.');
  return postOtp(otpEndpoint(flow, 'verify'), { challenge_id: challengeId, code });
}

export async function resendOtp({ flow, email, registrationPayload }) {
  if (!email || (flow === 'register' && !registrationPayload)) {
    throw new Error('Data pendaftaran tidak tersedia. Silakan kembali ke formulir untuk meminta OTP.');
  }
  const payload = flow === 'register' ? registrationPayload : { email };
  const data = await postOtp(otpEndpoint(flow, 'request'), payload);
  if (!data.challenge_id) throw new Error('Respons OTP tidak lengkap. Silakan minta OTP kembali.');
  return data;
}
