<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OtpAuthController extends Controller
{
    private const EXPIRY_MINUTES = 5;

    private const COOLDOWN_SECONDS = 60;

    private const MAX_ATTEMPTS = 5;

    public function csrfToken(Request $request): JsonResponse
    {
        return response()->json(['csrf_token' => $request->session()->token()])
            ->header('Cache-Control', 'no-store');
    }

    public function send(SendOtpRequest $request): JsonResponse
    {
        // Lock the user even if no OTP exists yet. All OTP operations lock
        // user -> challenge in this order to serialize resends and verification.
        return DB::transaction(function () use ($request): JsonResponse {
            $user = User::where('email', $request->validated('email'))->lockForUpdate()->first();

            if (! $user) {
                return $this->failure('Email belum terdaftar. Silakan daftar terlebih dahulu.', 422);
            }

            $previous = EmailOtp::where('user_id', $user->id)
                ->where('purpose', 'login')->lockForUpdate()->first();
            $now = now();
            $retryAfter = $previous
                ? max(0, $previous->sent_at->timestamp + self::COOLDOWN_SECONDS - $now->timestamp)
                : 0;

            if ($retryAfter > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tunggu sebelum mengirim ulang kode OTP.',
                    'retry_after' => $retryAfter,
                ], 429)->header('Retry-After', (string) $retryAfter);
            }

            $code = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $previous?->delete();
            $otp = EmailOtp::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => 'login',
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'max_attempts' => self::MAX_ATTEMPTS,
                'sent_at' => $now,
                'expires_at' => $now->copy()->addMinutes(self::EXPIRY_MINUTES),
                'consumed_at' => null,
            ]);

            try {
                // Synchronous: no plaintext OTP in the database queue, and a
                // transport failure can be returned in this HTTP response.
                Mail::to($user->email)->send(new OtpEmail($code));
            } catch (Throwable $exception) {
                $otp->delete();
                // Do not log SMTP transcripts, credentials, or the OTP itself.
                Log::warning('OTP mail delivery failed.', [
                    'challenge_id' => $otp->id,
                    'exception' => $exception::class,
                ]);

                // Return instead of throwing: commit invalidation of both codes.
                return $this->failure('Kode OTP gagal dikirim. Silakan coba lagi.', 503);
            }

            return response()->json([
                'success' => true,
                'message' => 'Permintaan pengiriman OTP diterima. Silakan cek email kamu.',
                'challenge_id' => $otp->id,
                'expires_in' => self::EXPIRY_MINUTES * 60,
                'retry_after' => self::COOLDOWN_SECONDS,
            ]);
        });
    }

    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $candidate = EmailOtp::whereKey($request->validated('challenge_id'))
            ->where('purpose', 'login')->first();

        if (! $candidate) {
            return $this->invalidCode();
        }

        $result = DB::transaction(function () use ($request, $candidate): User|JsonResponse {
            $user = User::whereKey($candidate->user_id)->lockForUpdate()->first();
            $otp = EmailOtp::whereKey($candidate->id)->where('purpose', 'login')
                ->lockForUpdate()->first();

            if (! $user || ! $otp || $otp->email !== $user->email
                || $otp->consumed_at !== null || $otp->expires_at->lessThanOrEqualTo(now())) {
                return $this->invalidCode();
            }

            if ($otp->attempts >= $otp->max_attempts) {
                return $this->failure('Batas percobaan OTP tercapai. Silakan minta kode baru.', 429);
            }

            if (! Hash::check($request->validated('code'), $otp->code_hash)) {
                $otp->increment('attempts');

                // Return instead of throwing so the failed attempt is committed.
                return $otp->attempts >= $otp->max_attempts
                    ? $this->failure('Batas percobaan OTP tercapai. Silakan minta kode baru.', 429)
                    : $this->invalidCode();
            }

            $otp->update(['consumed_at' => now()]);
            if ($user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            return $user;
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }

        Auth::guard('web')->login($result);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'user' => $result->only(['id', 'email', 'fullName']),
        ])->header('Cache-Control', 'no-store');
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->user('web')->only(['id', 'email', 'fullName']),
        ])->header('Cache-Control', 'no-store');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true, 'message' => 'Logout berhasil.']);
    }

    private function invalidCode(): JsonResponse
    {
        return $this->failure('OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa.', 422);
    }

    private function failure(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}
