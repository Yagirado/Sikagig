<?php

namespace App\Services;

use App\Exceptions\GoogleAuthException;
use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class GoogleEmailOtp
{
    public function __construct(private GoogleDrafts $drafts, private GoogleAccounts $accounts) {}

    public function send(Request $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $draft = $this->drafts->current($request, true);
            if ($draft->data['google']['email_proven']) {
                return $this->failure('Email sudah terverifikasi.', 422);
            }
            $previous = $draft->otp()->lockForUpdate()->first();
            $retry = $previous ? max(0, $previous->sent_at->timestamp + 60 - now()->timestamp) : 0;
            if ($retry > 0) {
                return response()->json(['success' => false, 'message' => 'Tunggu sebelum mengirim ulang OTP.', 'retry_after' => $retry], 429)
                    ->header('Retry-After', (string) $retry);
            }
            $previous?->delete();
            $code = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $otp = EmailOtp::create([
                'pending_registration_id' => $draft->id, 'user_id' => null,
                'email' => $draft->email, 'purpose' => 'register', 'code_hash' => Hash::make($code),
                'attempts' => 0, 'max_attempts' => 5, 'sent_at' => now(), 'expires_at' => now()->addMinutes(5),
            ]);
            try {
                Mail::to($draft->email)->send(new OtpEmail($code, 'google'));
            } catch (Throwable $exception) {
                $otp->delete();
                Log::warning('Google email OTP delivery failed.', ['exception' => $exception::class]);

                return $this->failure('Kode OTP gagal dikirim. Silakan coba lagi.', 503);
            }

            return response()->json(['success' => true, 'challenge_id' => $otp->id, 'expires_in' => 300, 'retry_after' => 60]);
        });
    }

    public function verify(Request $request, string $challengeId, string $code): User|JsonResponse
    {
        return DB::transaction(function () use ($request, $challengeId, $code) {
            $draft = $this->drafts->current($request, true);
            $otp = $draft->otp()->whereKey($challengeId)->lockForUpdate()->first();
            $data = $draft->data;
            if (! $otp || $otp->user_id !== null || $otp->email !== $draft->email
                || $data['google']['email'] !== $draft->email || $otp->consumed_at !== null
                || $otp->expires_at->lessThanOrEqualTo(now())) {
                return $this->failure('OTP tidak valid atau sudah kedaluwarsa.', 422);
            }
            if ($otp->attempts >= $otp->max_attempts) {
                return $this->failure('Batas percobaan OTP tercapai. Silakan minta kode baru.', 429);
            }
            if (! Hash::check($code, $otp->code_hash)) {
                $otp->increment('attempts');

                return $this->failure('OTP tidak valid.', $otp->attempts >= $otp->max_attempts ? 429 : 422);
            }
            if ($data['target_user_id'] !== null) {
                $user = User::whereKey($data['target_user_id'])->lockForUpdate()->first();
                if (! $user || strtolower($user->email) !== $draft->email) {
                    throw new GoogleAuthException('google_conflict');
                }
                $this->accounts->link($user, $data['google']['sub']);
                $draft->delete();

                return $user;
            }
            $otp->update(['consumed_at' => now()]);
            $data['google']['email_proven'] = true;
            $draft->update(['data' => $data]);

            return response()->json(['success' => true, 'next' => '/google']);
        });
    }

    private function failure(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}
