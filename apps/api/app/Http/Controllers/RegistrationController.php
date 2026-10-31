<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Throwable;

class RegistrationController extends Controller
{
    public function send(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['legal_agreement'] = true;
        $data['privacy_agreement'] = true;

        // The unique email handles concurrent first submissions. firstOrCreate
        // recovers a conflicting insert; the transaction then locks that row.
        $candidate = PendingRegistration::firstOrCreate(['email' => $data['email'], 'provider' => 'email'], [
            'data' => $data,
            'expires_at' => now()->addMinutes(30),
        ]);

        return DB::transaction(function () use ($candidate, $data): JsonResponse {
            $draft = PendingRegistration::whereKey($candidate->id)->where('provider', 'email')->lockForUpdate()->first();
            if (! $draft) {
                return $this->failure('Pendaftaran sudah berakhir. Silakan kirim formulir kembali.', 422);
            }

            $previous = $draft->otp()->lockForUpdate()->first();
            $now = now();
            $retryAfter = $previous ? max(0, $previous->sent_at->timestamp + 60 - $now->timestamp) : 0;
            if ($retryAfter > 0) {
                return response()->json([
                    'success' => false, 'message' => 'Tunggu sebelum mengirim ulang kode OTP.',
                    'retry_after' => $retryAfter,
                ], 429)->header('Retry-After', (string) $retryAfter);
            }

            // Replace the form and challenge together; an old challenge must
            // never authorize a newer form submitted for the same email.
            // unicode_ci can equate distinct delivery addresses. Always persist
            // the exact submitted email together with the form being verified.
            $draft->update(['email' => $data['email'], 'data' => $data, 'expires_at' => $now->copy()->addMinutes(30)]);
            $previous?->delete();
            $code = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $otp = EmailOtp::create([
                'pending_registration_id' => $draft->id, 'user_id' => null,
                'email' => $draft->email, 'purpose' => 'register',
                'code_hash' => Hash::make($code), 'attempts' => 0, 'max_attempts' => 5,
                'sent_at' => $now, 'expires_at' => $now->copy()->addMinutes(5),
            ]);

            try {
                Mail::to($draft->email)->send(new OtpEmail($code, 'register'));
            } catch (Throwable $exception) {
                $draft->delete(); // FK cascade invalidates the OTP as well.
                Log::warning('Registration OTP mail delivery failed.', [
                    'challenge_id' => $otp->id, 'exception' => $exception::class,
                ]);

                return $this->failure('Kode OTP gagal dikirim. Silakan coba lagi.', 503);
            }

            return response()->json([
                'success' => true,
                'message' => 'Permintaan pengiriman OTP diterima. Silakan cek email kamu.',
                'challenge_id' => $otp->id, 'expires_in' => 300, 'retry_after' => 60,
            ]);
        });
    }

    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $candidate = EmailOtp::whereKey($request->validated('challenge_id'))
            ->where('purpose', 'register')->whereNotNull('pending_registration_id')->first();
        if (! $candidate) {
            return $this->invalidCode();
        }

        try {
            $result = DB::transaction(function () use ($candidate, $request): User|JsonResponse {
                // Same lock order as send/prune: draft first, then challenge.
                $draft = PendingRegistration::whereKey($candidate->pending_registration_id)->where('provider', 'email')->lockForUpdate()->first();
                $otp = EmailOtp::whereKey($candidate->id)->where('purpose', 'register')->lockForUpdate()->first();
                if (! $draft || ! $otp || $otp->user_id !== null
                    || $otp->pending_registration_id !== $draft->id || $otp->email !== $draft->email
                    || $otp->consumed_at !== null || $otp->expires_at->lessThanOrEqualTo(now())
                    || $draft->expires_at->lessThanOrEqualTo(now())) {
                    return $this->invalidCode();
                }
                $data = $draft->data;
                if (($data['email'] ?? null) !== $otp->email) {
                    return $this->invalidCode();
                }
                if ($otp->attempts >= $otp->max_attempts) {
                    return $this->attemptLimit();
                }
                if (! Hash::check($request->validated('code'), $otp->code_hash)) {
                    $otp->increment('attempts');

                    return $otp->attempts >= $otp->max_attempts ? $this->attemptLimit() : $this->invalidCode();
                }

                $validator = Validator::make($data, [
                    'email' => ['unique:users,email'], 'NIM' => ['unique:users,NIM'],
                ], ['email.unique' => 'Email sudah terdaftar. Silakan login.', 'NIM.unique' => 'NIM sudah digunakan.']);
                if ($validator->fails()) {
                    return response()->json([
                        'success' => false, 'message' => 'Email atau NIM sudah digunakan.',
                        'errors' => $validator->errors(),
                    ], 422);
                }

                $user = new User($data);
                $user->forceFill(['email_verified_at' => now(), 'profile_completed_at' => now()])->save();
                // Keep the consumed OTP attached to the new user before deleting
                // the draft, so the cascade only removes abandoned challenges.
                $otp->update(['user_id' => $user->id, 'pending_registration_id' => null, 'consumed_at' => now()]);
                $draft->delete();

                return $user;
            });
        } catch (UniqueConstraintViolationException $exception) {
            // Another registration may claim this NIM/email between the check
            // and INSERT. The DB unique index is the final authority; roll back.
            return $this->failure('Email atau NIM sudah digunakan. Silakan periksa data pendaftaran.', 422);
        }

        if ($result instanceof JsonResponse) {
            return $result;
        }
        Auth::guard('web')->login($result);
        $request->session()->regenerate();

        return response()->json([
            'success' => true, 'message' => 'Registrasi berhasil.',
            'user' => $result->only(['id', 'email', 'fullName']),
        ], 201)->header('Cache-Control', 'no-store');
    }

    private function invalidCode(): JsonResponse
    {
        return $this->failure('OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa.', 422);
    }

    private function attemptLimit(): JsonResponse
    {
        return $this->failure('Batas percobaan OTP tercapai. Silakan minta kode baru.', 429);
    }

    private function failure(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}
