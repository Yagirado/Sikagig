<?php

namespace App\Services;

use App\Exceptions\GoogleAuthException;
use App\Models\PendingRegistration;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GoogleDrafts
{
    public function create(Request $request, array $identity, array $profile, ?int $targetId): void
    {
        $secret = Str::random(64);
        $data = [
            'google' => $identity, 'target_user_id' => $targetId,
            'profile' => array_merge([
                'NIM' => null, 'fullName' => $identity['name'], 'email' => $identity['email'],
                'phone' => null, 'gender' => null, 'tanggal_lahir' => null,
                'legal_agreement' => false, 'privacy_agreement' => false,
            ], $profile),
        ];
        $candidate = PendingRegistration::firstOrCreate(['email' => $identity['email'], 'provider' => 'google'], [
            'owner_hash' => hash('sha256', $secret), 'data' => $data, 'expires_at' => now()->addMinutes(30),
        ]);
        DB::transaction(function () use ($candidate, $identity, $data, $secret) {
            $draft = PendingRegistration::whereKey($candidate->id)->lockForUpdate()->first();
            if (! $draft) {
                throw new GoogleAuthException;
            }
            // Invalidate the old proof without erasing the resend cooldown.
            $draft->otp()->update(['consumed_at' => now()]);
            $draft->update(['email' => $identity['email'], 'owner_hash' => hash('sha256', $secret),
                'data' => $data, 'expires_at' => now()->addMinutes(30)]);
        });
        $request->session()->regenerate(true);
        $request->session()->put(['google_draft_id' => $candidate->id, 'google_draft_secret' => $secret]);
    }

    public function current(Request $request, bool $lock = false): PendingRegistration
    {
        $id = $request->session()->get('google_draft_id');
        $secret = $request->session()->get('google_draft_secret');
        $query = PendingRegistration::where('provider', 'google')->whereKey(is_string($id) ? $id : '');
        $draft = ($lock ? $query->lockForUpdate() : $query)->first();
        if (! $draft || ! is_string($secret) || ! is_string($draft->owner_hash)
            || ! hash_equals($draft->owner_hash, hash('sha256', $secret)) || $draft->expires_at->lessThanOrEqualTo(now())) {
            throw new HttpResponseException(response()->json([
                'success' => false, 'message' => 'Draft Google sudah berakhir. Silakan masuk melalui Google kembali.',
            ], 410));
        }

        return $draft;
    }

    public function updateProfile(Request $request, array $context, array $identity, array $profile): void
    {
        DB::transaction(function () use ($request, $context, $identity, $profile) {
            $draft = $this->current($request, true);
            $data = $draft->data;
            if ($context['draft_id'] !== $draft->id || $data['google']['sub'] !== $identity['sub']
                || $draft->email !== $identity['email']) {
                throw new GoogleAuthException;
            }
            $data['profile'] = array_merge($data['profile'], array_filter($profile, fn ($value) => $value !== null));
            $draft->update(['data' => $data]);
        });
    }

    public function forget(Request $request): void
    {
        $request->session()->forget(['google_draft_id', 'google_draft_secret']);
    }
}
