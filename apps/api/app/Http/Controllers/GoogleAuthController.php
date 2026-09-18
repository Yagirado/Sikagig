<?php

namespace App\Http\Controllers;

use App\Exceptions\GoogleAuthException;
use App\Http\Requests\GoogleRegisterRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Models\GoogleAccount;
use App\Models\User;
use App\Services\GoogleAccounts;
use App\Services\GoogleDrafts;
use App\Services\GoogleEmailOtp;
use App\Services\GoogleOAuthClient;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class GoogleAuthController extends Controller
{
    public function __construct(private GoogleOAuthClient $google, private GoogleAccounts $accounts,
        private GoogleDrafts $drafts, private GoogleEmailOtp $otp) {}

    public function redirect(Request $request): RedirectResponse
    {
        try {
            return redirect()->away($this->google->authorizationUrl($request));
        } catch (GoogleAuthException $exception) {
            return $this->frontend('/login?error='.$exception->reason);
        }
    }

    public function profileRedirect(Request $request): RedirectResponse
    {
        $draft = $this->drafts->current($request);
        try {
            return redirect()->away($this->google->authorizationUrl($request, 'profile', $draft->id, $draft->data['google']['sub']));
        } catch (GoogleAuthException) {
            return $this->frontend('/google?profile=unavailable');
        }
    }

    public function registerRedirect(Request $request): RedirectResponse
    {
        try {
            return redirect()->away($this->google->authorizationUrl($request, 'register'));
        } catch (GoogleAuthException $exception) {
            return $this->frontend('/login?error='.$exception->reason);
        }
    }

    public function callback(Request $request): RedirectResponse
    {
        $context = null;
        try {
            $context = $this->google->consumeContext($request);
            if ($request->has('error')) {
                return $this->frontend($context['flow'] === 'profile' ? '/google?profile=unavailable' : '/login?error=google_cancelled');
            }
            $code = $request->query('code');
            if (! is_string($code) || $code === '') {
                throw new GoogleAuthException;
            }
            $result = $this->google->exchange($code, $context);
            $identity = $result['identity'];
            if ($context['flow'] === 'profile') {
                $this->drafts->updateProfile($request, $context, $identity, $this->google->profile($result['access_token'], $result['granted_scopes']));

                return $this->frontend('/google');
            }
            if ($context['flow'] === 'register') {
                // Signup never resolves or links an existing user. Uniqueness
                // is enforced when the completed registration is submitted.
                $this->drafts->create($request, $identity, $this->google->profile($result['access_token'], $result['granted_scopes']), null);

                return $this->frontend($identity['email_proven'] ? '/google' : '/google?step=verify-email');
            }
            $account = DB::transaction(fn () => $this->accounts->resolve($identity));
            if ($account['user']) {
                $this->login($request, $account['user']);

                return $this->frontend('/dashboard');
            }
            $profile = $account['target_user_id'] === null ? $this->google->profile($result['access_token'], $result['granted_scopes']) : [];
            $this->drafts->create($request, $identity, $profile, $account['target_user_id']);

            return $this->frontend($identity['email_proven'] ? '/google' : '/google?step=verify-email');
        } catch (Throwable $exception) {
            Log::notice('Google authentication did not complete.', ['exception' => $exception::class]);
            if (($context['flow'] ?? null) === 'profile') {
                return $this->frontend('/google?profile=unavailable');
            }
            $reason = $exception instanceof GoogleAuthException ? $exception->reason
                : ($exception instanceof UniqueConstraintViolationException ? 'google_conflict' : 'google_invalid');

            return $this->frontend('/login?error='.$reason);
        }
    }

    public function draft(Request $request): JsonResponse
    {
        $draft = $this->drafts->current($request);

        return response()->json(['success' => true, 'profile' => $draft->data['profile'],
            'needs_email_verification' => ! $draft->data['google']['email_proven'],
            'existing_account' => $draft->data['target_user_id'] !== null,
            'expires_at' => $draft->expires_at->toIso8601String(),
        ])->header('Cache-Control', 'no-store');
    }

    public function register(GoogleRegisterRequest $request): JsonResponse
    {
        try {
            $result = DB::transaction(function () use ($request): User|JsonResponse {
                $draft = $this->drafts->current($request, true);
                $identity = $draft->data['google'];
                if (! $identity['email_proven']) {
                    return $this->failure('Verifikasi email terlebih dahulu.', 403);
                }
                if ($draft->data['target_user_id'] !== null || $draft->email !== $identity['email']) {
                    return $this->failure('Silakan ulangi login Google untuk akun ini.', 409);
                }
                $data = $request->safe()->only(['NIM', 'fullName', 'phone', 'gender', 'tanggal_lahir']);
                $data += ['email' => $draft->email, 'legal_agreement' => true, 'privacy_agreement' => true];
                $validator = Validator::make($data, ['email' => 'unique:users,email', 'NIM' => 'unique:users,NIM'], [
                    'email.unique' => 'Email sudah terdaftar. Silakan login.',
                    'NIM.unique' => 'NIM sudah digunakan.',
                ]);
                if ($validator->fails()) {
                    return response()->json(['success' => false, 'message' => 'Email atau NIM sudah digunakan.', 'errors' => $validator->errors()], 422);
                }
                if (GoogleAccount::where('google_sub', $identity['sub'])->exists()) {
                    throw new GoogleAuthException('google_conflict');
                }
                $user = new User($data);
                $user->forceFill(['email_verified_at' => now(), 'profile_completed_at' => now()])->save();
                GoogleAccount::create(['user_id' => $user->id, 'google_sub' => $identity['sub']]);
                $draft->delete();

                return $user;
            });
        } catch (UniqueConstraintViolationException|GoogleAuthException) {
            return $this->failure('Email, NIM, atau akun Google sudah digunakan. Silakan ulangi login.', 422);
        }
        if ($result instanceof JsonResponse) {
            return $result;
        }
        $this->login($request, $result);

        return response()->json(['success' => true, 'user' => $result->only(['id', 'email', 'fullName']), 'next' => '/dashboard'], 201)
            ->header('Cache-Control', 'no-store');
    }

    public function sendEmailOtp(Request $request): JsonResponse
    {
        return $this->otp->send($request)->header('Cache-Control', 'no-store');
    }

    public function verifyEmailOtp(VerifyOtpRequest $request): JsonResponse
    {
        try {
            $result = $this->otp->verify($request, $request->validated('challenge_id'), $request->validated('code'));
        } catch (UniqueConstraintViolationException|GoogleAuthException) {
            return $this->failure('Akun berubah atau sudah terhubung. Silakan ulangi login Google.', 409);
        }
        if ($result instanceof JsonResponse) {
            return $result->header('Cache-Control', 'no-store');
        }
        $this->login($request, $result);

        return response()->json(['success' => true, 'user' => $result->only(['id', 'email', 'fullName']), 'next' => '/dashboard'])
            ->header('Cache-Control', 'no-store');
    }

    private function login(Request $request, User $user): void
    {
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $this->drafts->forget($request);
    }

    private function frontend(string $path): RedirectResponse
    {
        return redirect()->away(rtrim(config('services.google.frontend_url'), '/').$path)
            ->header('Cache-Control', 'no-store');
    }

    private function failure(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}
