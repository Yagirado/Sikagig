<?php

namespace App\Services;

use App\Exceptions\GoogleAuthException;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Throwable;

class GoogleOAuthClient
{
    private const CERTS = 'https://www.googleapis.com/oauth2/v3/certs';

    public function authorizationUrl(Request $request, string $flow = 'login', ?string $draftId = null, ?string $sub = null): string
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret') || ! config('services.google.redirect')) {
            throw new GoogleAuthException('google_unavailable');
        }
        $context = [
            'state' => Str::random(64), 'nonce' => Str::random(64), 'verifier' => Str::random(96),
            'created_at' => time(), 'flow' => $flow, 'draft_id' => $draftId,
            'redirect_uri' => config('services.google.redirect'),
        ];
        $request->session()->put('google_oauth', $context);
        $scopes = ['openid', 'email', 'profile'];
        if (in_array($flow, ['register', 'profile'], true)) {
            $scopes = array_merge($scopes, [
                'https://www.googleapis.com/auth/user.phonenumbers.read',
                'https://www.googleapis.com/auth/user.gender.read',
                'https://www.googleapis.com/auth/user.birthday.read',
            ]);
        }

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query(array_filter([
            'client_id' => config('services.google.client_id'), 'redirect_uri' => $context['redirect_uri'],
            'response_type' => 'code', 'scope' => implode(' ', $scopes),
            'state' => $context['state'], 'nonce' => $context['nonce'],
            'code_challenge' => JWT::urlsafeB64Encode(hash('sha256', $context['verifier'], true)),
            'code_challenge_method' => 'S256', 'include_granted_scopes' => 'true',
            'prompt' => $flow === 'profile' ? 'consent' : 'select_account', 'login_hint' => $sub,
        ], fn ($value) => $value !== null), '', '&', PHP_QUERY_RFC3986);
    }

    public function consumeContext(Request $request): array
    {
        $context = $request->session()->pull('google_oauth');
        $state = $request->input('state');
        if (! is_array($context) || ! is_string($state) || ! hash_equals($context['state'], $state)
            || $context['created_at'] < time() - 600) {
            throw new GoogleAuthException;
        }

        return $context;
    }

    public function exchange(string $code, array $context): array
    {
        $tokens = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'), 'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $context['redirect_uri'], 'grant_type' => 'authorization_code',
            'code' => $code, 'code_verifier' => $context['verifier'],
        ])->throw()->json();
        if (! is_array($tokens) || ! is_string($tokens['id_token'] ?? null)) {
            throw new GoogleAuthException;
        }
        $claims = $this->verifyIdToken($tokens['id_token'], $context['nonce']);

        $scopeString = is_string($tokens['scope'] ?? null)
            ? $tokens['scope']
            : '';

        $grantedScopes = preg_split(
            '/\s+/',
            trim($scopeString),
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        return [
            'identity' => $claims,
            'access_token' => is_string($tokens['access_token'] ?? null)
                ? $tokens['access_token']
                : null,
            'granted_scopes' => $grantedScopes,
        ];
    }

    private function verifyIdToken(string $token, string $nonce): array
    {
        $headers = new \stdClass;
        $keys = Cache::remember('google.oidc.public-keys', 3600, fn () => Http::timeout(10)->get(self::CERTS)->throw()->json());
        try {
            $claims = (array) JWT::decode($token, JWK::parseKeySet($keys, 'RS256'), $headers);
        } catch (Throwable) {
            // Refresh once for Google's key rotation. Never use a key URL from the token.
            Cache::forget('google.oidc.public-keys');
            $keys = Http::timeout(10)->get(self::CERTS)->throw()->json();
            $claims = (array) JWT::decode($token, JWK::parseKeySet($keys, 'RS256'), $headers);
            Cache::put('google.oidc.public-keys', $keys, 3600);
        }
        $clientId = config('services.google.client_id');
        $audiences = is_array($claims['aud'] ?? null) ? $claims['aud'] : [$claims['aud'] ?? null];
        if (($headers->alg ?? null) !== 'RS256'
            || ! in_array($claims['iss'] ?? null, ['https://accounts.google.com', 'accounts.google.com'], true)
            || ! in_array($clientId, $audiences, true)
            || (isset($claims['azp']) && $claims['azp'] !== $clientId)
            || (count($audiences) > 1 && ($claims['azp'] ?? null) !== $clientId)
            || ! is_int($claims['exp'] ?? null) || $claims['exp'] <= time()
            || ! is_int($claims['iat'] ?? null) || $claims['iat'] > time() + 60
            || ! is_string($claims['nonce'] ?? null) || ! hash_equals($nonce, $claims['nonce'])
            || ! is_string($claims['sub'] ?? null) || $claims['sub'] === '' || strlen($claims['sub']) > 255
            || ! is_string($claims['email'] ?? null)
            || Validator::make(['email' => $claims['email']], ['email' => 'required|email:rfc|max:255'])->fails()) {
            throw new GoogleAuthException;
        }
        $email = strtolower($claims['email']);
        $authoritative = ($claims['email_verified'] ?? false) === true
            && (str_ends_with($email, '@gmail.com') || (is_string($claims['hd'] ?? null) && $claims['hd'] !== ''));

        return [
            'sub' => $claims['sub'], 'email' => $email, 'email_proven' => $authoritative,
            'name' => is_string($claims['name'] ?? null) ? $claims['name'] : null,
        ];
    }

    public function profile(?string $accessToken, array $grantedScopes): array
    {
        if (! $accessToken) {
            return [];
        }

        $scopeFields = [
            'https://www.googleapis.com/auth/user.phonenumbers.read' => 'phoneNumbers',
            'https://www.googleapis.com/auth/user.gender.read' => 'genders',
            'https://www.googleapis.com/auth/user.birthday.read' => 'birthdays',
        ];

        $personFields = [];

        foreach ($scopeFields as $scope => $field) {
            if (in_array($scope, $grantedScopes, true)) {
                $personFields[] = $field;
            }
        }

        if ($personFields === []) {
            return [];
        }

        try {
            $person = Http::withToken($accessToken)->timeout(10)->get('https://people.googleapis.com/v1/people/me', [
                'personFields' => implode(',', $personFields), 'sources' => 'READ_SOURCE_TYPE_PROFILE',
            ])->throw()->json();
            $phone = $person['phoneNumbers'][0]['canonicalForm'] ?? $person['phoneNumbers'][0]['value'] ?? null;
            $phone = is_string($phone) ? preg_replace('/[\s()-]/', '', $phone) : null;
            $phone = $phone && preg_match('/^(?:08[0-9]{8,11}|\+62[0-9]{9,12})$/', $phone) ? $phone : null;
            $gender = match ($person['genders'][0]['value'] ?? null) {
                'male' => 'man', 'female' => 'woman', default => null
            };
            $birthday = $person['birthdays'][0]['date'] ?? [];
            $date = null;
            if (is_int($birthday['year'] ?? null) && is_int($birthday['month'] ?? null) && is_int($birthday['day'] ?? null)
                && checkdate($birthday['month'], $birthday['day'], $birthday['year'])) {
                $candidate = sprintf('%04d-%02d-%02d', $birthday['year'], $birthday['month'], $birthday['day']);
                $date = $candidate <= date('Y-m-d') ? $candidate : null;
            }

            return ['phone' => $phone, 'gender' => $gender, 'tanggal_lahir' => $date];
        } catch (Throwable) {
            return []; // Missing optional consent/data must not block manual signup.
        }
    }
}
