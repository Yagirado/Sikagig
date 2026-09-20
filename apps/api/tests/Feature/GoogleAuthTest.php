<?php

namespace Tests\Feature;

use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\GoogleAccount;
use App\Models\PendingRegistration;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Http\Client\Factory;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\CreatesAuthTables;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use CreatesAuthTables;

    private static $key;

    private array $oauth = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->createAuthTables();
        config([
            'session.driver' => 'database', 'services.google.client_id' => 'test-client',
            'services.google.client_secret' => 'test-secret',
            'services.google.redirect' => 'http://localhost/api/auth/google/callback',
            'services.google.frontend_url' => 'http://localhost:5173',
        ]);
        self::$key ??= openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'config' => dirname(__DIR__).'/Support/openssl.cnf']);
        $this->assertNotFalse(self::$key, 'Could not generate an isolated RSA test key.');
        Http::preventStrayRequests();
        Mail::fake();
        $this->withCredentials();
    }

    private function begin(string $path = '/api/auth/google/redirect'): TestResponse
    {
        $response = $this->get($path)->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $this->oauth);
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());

        return $response;
    }

    private function finishGoogle(array $claims = [], array $people = [], string $algorithm = 'RS256'): TestResponse
    {
        $claims = array_merge([
            'iss' => 'https://accounts.google.com', 'aud' => 'test-client',
            'sub' => 'google-sub-1', 'email' => 'new@gmail.com', 'email_verified' => true,
            'name' => 'Nama Google', 'iat' => time(), 'exp' => time() + 300,
            'nonce' => $this->oauth['nonce'],
        ], $claims);
        $rsa = openssl_pkey_get_details(self::$key)['rsa'];
        $token = JWT::encode($claims, $algorithm === 'RS256' ? self::$key : str_repeat('x', 64), $algorithm, 'test-key');
        // Each OAuth exchange has a different nonce; discard previous HTTP stubs.
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'id_token' => $token,
                'access_token' => 'access-token',
                'scope' => implode(' ', [
                    'openid',
                    'email',
                    'profile',
                    'https://www.googleapis.com/auth/user.phonenumbers.read',
                    'https://www.googleapis.com/auth/user.gender.read',
                    'https://www.googleapis.com/auth/user.birthday.read',
                ]),
            ]),
            'https://www.googleapis.com/oauth2/v3/certs' => Http::response(['keys' => [[
                'kty' => 'RSA', 'kid' => 'test-key', 'alg' => 'RS256', 'use' => 'sig',
                'n' => JWT::urlsafeB64Encode($rsa['n']), 'e' => JWT::urlsafeB64Encode($rsa['e']),
            ]]]),
            'https://people.googleapis.com/*' => Http::response($people),
        ]);
        $response = $this->get('/api/auth/google/callback?'.http_build_query(['code' => 'authorization-code', 'state' => $this->oauth['state']]));
        if ($cookie = $response->getCookie(config('session.cookie'))) {
            $this->withCookie(config('session.cookie'), $cookie->getValue());
        }

        return $response;
    }

    private function form(array $overrides = []): array
    {
        return array_merge([
            'NIM' => '0123456789012', 'fullName' => 'Nama Diperiksa', 'phone' => '081234567890',
            'gender' => 'woman', 'tanggal_lahir' => '25/12/2003',
            'legal_agreement' => true, 'privacy_agreement' => true,
        ], $overrides);
    }

    public function test_redirect_uses_state_nonce_pkce_and_basic_scopes(): void
    {
        $this->begin();
        $this->assertNotEmpty($this->oauth['state']);
        $this->assertNotEmpty($this->oauth['nonce']);
        $this->assertSame('S256', $this->oauth['code_challenge_method']);
        $this->assertSame('openid email profile', $this->oauth['scope']);
        $this->assertSame('test-client', $this->oauth['client_id']);
        $this->assertArrayNotHasKey('client_secret', $this->oauth);
        Http::assertNothingSent();
    }

    public function test_signup_existing_email_opens_draft_without_logging_in_or_linking(): void
    {
        User::create(['email' => 'new@gmail.com']);
        $this->begin('/api/auth/google/register/redirect');
        $this->finishGoogle()->assertRedirect('http://localhost:5173/google');
        $this->getJson('/api/auth/google/draft')->assertOk()->assertJsonPath('profile.email', 'new@gmail.com');
        $this->assertGuest();
        $this->assertDatabaseCount('google_accounts', 0);
        $this->postJson('/api/auth/google/register', $this->form())
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
        $this->assertGuest();
    }

    public function test_signup_existing_sub_opens_draft_and_rejects_duplicate_on_submit(): void
    {
        $user = User::create(['email' => 'previous@example.com']);
        GoogleAccount::create(['user_id' => $user->id, 'google_sub' => 'google-sub-1']);
        $this->begin('/api/auth/google/register/redirect');
        $this->finishGoogle()->assertRedirect('http://localhost:5173/google');
        $this->assertGuest();
        $this->postJson('/api/auth/google/register', $this->form())->assertUnprocessable();
        $this->assertDatabaseCount('users', 1);
        $this->assertSame('previous@example.com', $user->fresh()->email);
        $this->assertSame($user->id, GoogleAccount::sole()->user_id);
    }

    public function test_signup_new_account_prefills_profile_and_completes_registration(): void
    {
        $this->begin('/api/auth/google/register/redirect');
        $this->finishGoogle([], ['genders' => [['value' => 'female']]])->assertRedirect('http://localhost:5173/google');
        $this->getJson('/api/auth/google/draft')->assertOk()
            ->assertJsonPath('profile.fullName', 'Nama Google')->assertJsonPath('profile.gender', 'woman');
        $this->assertDatabaseCount('users', 0);
        $this->postJson('/api/auth/google/register', $this->form())->assertCreated();
        $this->assertAuthenticatedAs(User::sole());
        $this->assertDatabaseCount('pending_registrations', 0);
        $this->assertSame('google-sub-1', GoogleAccount::sole()->google_sub);
    }

    public function test_signup_external_email_otp_does_not_log_in_an_existing_account(): void
    {
        User::create(['email' => 'new@example.com']);
        $this->begin('/api/auth/google/register/redirect');
        $this->finishGoogle(['email' => 'new@example.com'])->assertRedirect('http://localhost:5173/google?step=verify-email');
        $this->postJson('/api/auth/google/register', $this->form())->assertForbidden();
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $this->postJson('/api/auth/google/email/verify-otp', [
            'challenge_id' => $id, 'code' => Mail::sent(OtpEmail::class)->last()->code,
        ])->assertOk()->assertJsonPath('next', '/google');
        $this->assertGuest();
        $this->assertDatabaseCount('google_accounts', 0);
        $this->postJson('/api/auth/google/register', $this->form())->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_signup_callback_still_requires_valid_state_and_identity(): void
    {
        $this->begin('/api/auth/google/register/redirect');
        $this->finishGoogle(['nonce' => 'wrong'])->assertRedirect('http://localhost:5173/login?error=google_invalid');
        $this->assertDatabaseCount('pending_registrations', 0);
        $this->assertGuest();
    }

    public function test_wrong_state_and_replayed_callback_are_rejected(): void
    {
        $this->begin();
        $this->get('/api/auth/google/callback?code=code&state=wrong')
            ->assertRedirect('http://localhost:5173/login?error=google_invalid');
        Http::assertNothingSent();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/login?error=google_invalid');
        $this->assertGuest();
    }

    public static function invalidClaims(): array
    {
        return [
            'issuer' => [['iss' => 'https://attacker.example']],
            'audience' => [['aud' => 'other-client']],
            'expired' => [['exp' => 1]], 'nonce' => [['nonce' => 'wrong']],
            'missing expiry' => [['exp' => null]], 'missing sub' => [['sub' => '']],
            'invalid email' => [['email' => 'invalid']], 'authorized party' => [['azp' => 'other-client']],
        ];
    }

    #[DataProvider('invalidClaims')]
    public function test_invalid_google_identity_does_not_create_an_account(array $claims): void
    {
        $this->begin();
        $this->finishGoogle($claims)->assertRedirect('http://localhost:5173/login?error=google_invalid');
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('pending_registrations', 0);
        $this->assertGuest();
    }

    public function test_wrong_signature_algorithm_is_rejected(): void
    {
        $this->begin();
        $this->finishGoogle([], [], 'HS256')->assertRedirect('http://localhost:5173/login?error=google_invalid');
        $this->assertGuest();
    }

    public function test_existing_google_sub_logs_into_its_linked_user_without_replacing_email(): void
    {
        $user = User::create(['email' => 'existing@example.com']);
        GoogleAccount::create(['user_id' => $user->id, 'google_sub' => 'google-sub-1']);
        $this->begin();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertSame('existing@example.com', $user->fresh()->email);
        $this->assertDatabaseCount('pending_registrations', 0);
    }

    public function test_trusted_existing_email_links_google_and_logs_in(): void
    {
        $user = User::create(['email' => 'new@gmail.com']);
        $this->begin();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('google_accounts', ['user_id' => $user->id, 'google_sub' => 'google-sub-1']);
    }

    public function test_conflicting_google_link_is_not_replaced(): void
    {
        $user = User::create(['email' => 'new@gmail.com']);
        GoogleAccount::create(['user_id' => $user->id, 'google_sub' => 'different-sub']);
        $this->begin();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/login?error=google_conflict');
        $this->assertSame('different-sub', GoogleAccount::sole()->google_sub);
        $this->assertGuest();
    }

    public function test_new_google_user_gets_prefilled_draft_and_no_account_yet(): void
    {
        $this->begin();
        $this->finishGoogle([], [
            'phoneNumbers' => [['value' => '+62 812-3456-7890']],
            'genders' => [['value' => 'female']],
            'birthdays' => [['date' => ['year' => 2003, 'month' => 12, 'day' => 25]]],
        ])->assertRedirect('http://localhost:5173/google');
        $this->getJson('/api/auth/google/draft')->assertOk()->assertJson([
            'needs_email_verification' => false,
            'profile' => ['email' => 'new@gmail.com', 'fullName' => 'Nama Google',
                'phone' => '+6281234567890', 'gender' => 'woman', 'tanggal_lahir' => '2003-12-25',
                'legal_agreement' => false, 'privacy_agreement' => false],
        ])->assertJsonMissingPath('access_token')->assertJsonMissingPath('google_sub');
        $this->assertSame('google', PendingRegistration::sole()->provider);
        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }

    public function test_google_registration_uses_server_identity_and_creates_verified_account(): void
    {
        $this->begin();
        $this->finishGoogle();
        $this->postJson('/api/auth/google/register', $this->form(['email' => 'attacker@example.com', 'google_sub' => 'attacker']))
            ->assertUnprocessable();
        $response = $this->postJson('/api/auth/google/register', $this->form())->assertCreated();
        $user = User::sole();
        $this->assertSame('new@gmail.com', $user->email);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->profile_completed_at);
        $this->assertSame('google-sub-1', GoogleAccount::sole()->google_sub);
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('pending_registrations', 0);
        $this->assertEqualsWithDelta(time() + 14 * 86400, $response->getCookie(config('session.cookie'))->getExpiresTime(), 3);
        $this->postJson('/api/auth/google/register', $this->form(['NIM' => '9999999999999']))->assertStatus(410);
    }

    public function test_google_draft_cannot_be_read_from_another_session(): void
    {
        $this->begin();
        $this->finishGoogle();
        $this->defaultCookies = [];
        Auth::forgetGuards();
        app('session')->forgetDrivers();
        $this->app->forgetInstance('session.store');
        $this->getJson('/api/auth/google/draft')->assertStatus(410);
        $this->postJson('/api/auth/google/register', $this->form())->assertStatus(410);
    }

    public function test_new_google_login_invalidates_older_draft_in_another_session(): void
    {
        $this->begin();
        $this->finishGoogle();
        $oldCookies = $this->defaultCookies;
        $this->begin();
        $this->finishGoogle();
        $this->defaultCookies = $oldCookies;
        app('session')->forgetDrivers();
        $this->app->forgetInstance('session.store');
        $this->getJson('/api/auth/google/draft')->assertStatus(410);
    }

    public function test_optional_profile_permission_denial_keeps_manual_registration_available(): void
    {
        $this->begin();
        $this->finishGoogle();
        $this->begin('/api/auth/google/profile/redirect');
        $this->assertStringContainsString('user.birthday.read', $this->oauth['scope']);
        $this->get('/api/auth/google/callback?'.http_build_query(['error' => 'access_denied', 'state' => $this->oauth['state']]))
            ->assertRedirect('http://localhost:5173/google?profile=unavailable');
        $this->getJson('/api/auth/google/draft')->assertOk();
        $this->postJson('/api/auth/google/register', $this->form())->assertCreated();
    }

    public function test_optional_profile_callback_rejects_account_switch(): void
    {
        $this->begin();
        $this->finishGoogle();
        $this->begin('/api/auth/google/profile/redirect');
        $this->finishGoogle(['sub' => 'different-sub'])->assertRedirect('http://localhost:5173/google?profile=unavailable');
        $this->getJson('/api/auth/google/draft')->assertJsonPath('profile.email', 'new@gmail.com');
    }

    public function test_incomplete_birthday_and_unknown_gender_remain_empty(): void
    {
        $this->begin();
        $this->finishGoogle([], ['genders' => [['value' => 'unspecified']], 'birthdays' => [['date' => ['month' => 12, 'day' => 25]]]]);
        $this->getJson('/api/auth/google/draft')->assertJsonPath('profile.gender', null)->assertJsonPath('profile.tanggal_lahir', null);
    }

    public function test_external_email_requires_otp_before_linking_existing_user(): void
    {
        $user = User::create(['email' => 'new@example.com']);
        $this->begin();
        $this->finishGoogle(['email' => $user->email])->assertRedirect('http://localhost:5173/google?step=verify-email');
        $this->assertGuest();
        $this->assertDatabaseCount('google_accounts', 0);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => Mail::sent(OtpEmail::class)->last()->code])
            ->assertOk()->assertJsonPath('next', '/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('google_accounts', ['user_id' => $user->id, 'google_sub' => 'google-sub-1']);
    }

    public function test_external_email_registration_cannot_skip_otp(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $this->postJson('/api/auth/google/register', $this->form())->assertStatus(403);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $code = Mail::sent(OtpEmail::class)->last()->code;
        $this->postJson('/api/auth/register/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertUnprocessable();
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertOk();
        $this->postJson('/api/auth/google/register', $this->form())->assertCreated();
        $this->assertSame('new@example.com', User::sole()->email);
    }

    public function test_email_and_google_drafts_do_not_overwrite_each_other(): void
    {
        $this->postJson('/api/auth/register/request-otp', $this->form(['email' => 'new@gmail.com']))->assertOk();
        $emailDraft = PendingRegistration::where('provider', 'email')->sole();
        $this->begin();
        $this->finishGoogle();
        $this->assertDatabaseCount('pending_registrations', 2);
        $this->assertDatabaseHas('pending_registrations', ['id' => $emailDraft->id, 'provider' => 'email']);
    }

    public function test_expired_draft_and_duplicate_nim_cannot_create_an_account(): void
    {
        $this->begin();
        $this->finishGoogle();
        User::create(['email' => 'other@example.com', 'NIM' => '0123456789012']);
        $this->postJson('/api/auth/google/register', $this->form())->assertUnprocessable()->assertJsonValidationErrors('NIM');
        PendingRegistration::where('provider', 'google')->update(['expires_at' => now()->subSecond()]);
        $this->postJson('/api/auth/google/register', $this->form(['NIM' => '9999999999999']))->assertStatus(410);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_google_otp_cooldown_attempt_limit_and_replay(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $code = Mail::sent(OtpEmail::class)->last()->code;
        $this->postJson('/api/auth/google/email/request-otp')->assertStatus(429);
        $wrong = $code === '0000' ? '0001' : '0000';
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $wrong])
                ->assertStatus($attempt === 5 ? 429 : 422);
        }
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertStatus(429);
        EmailOtp::whereKey($id)->update(['sent_at' => now()->subSeconds(61)]);
        $newId = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertUnprocessable();
        $payload = ['challenge_id' => $newId, 'code' => Mail::sent(OtpEmail::class)->last()->code];
        $this->postJson('/api/auth/google/email/verify-otp', $payload)->assertOk();
        $this->postJson('/api/auth/google/email/verify-otp', $payload)->assertUnprocessable();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_expired_google_otp_cannot_prove_email(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        EmailOtp::whereKey($id)->update(['expires_at' => now()->subSecond()]);
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => Mail::sent(OtpEmail::class)->last()->code])
            ->assertUnprocessable();
        $this->getJson('/api/auth/google/draft')->assertJsonPath('needs_email_verification', true);
    }

    public function test_google_email_delivery_failure_preserves_draft_for_retry(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        Mail::shouldReceive('to')->with('new@example.com')->once()->andThrow(new \RuntimeException('transport unavailable'));
        $this->postJson('/api/auth/google/email/request-otp')->assertStatus(503);
        $this->assertDatabaseCount('email_otps', 0);
        $this->getJson('/api/auth/google/draft')->assertOk()->assertJsonPath('needs_email_verification', true);
        Mail::swap(new MailManager($this->app));
        Mail::fake();
        $this->postJson('/api/auth/google/email/request-otp')->assertOk();
    }

    public function test_google_otp_is_bound_to_the_session_that_started_login(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $code = Mail::sent(OtpEmail::class)->last()->code;
        $this->defaultCookies = [];
        app('session')->forgetDrivers();
        $this->app->forgetInstance('session.store');
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertStatus(410);
        $this->postJson('/api/auth/google/email/request-otp')->assertStatus(410);
        $this->assertFalse(PendingRegistration::sole()->data['google']['email_proven']);
    }

    public function test_changed_existing_email_cannot_be_linked_using_old_google_otp(): void
    {
        $user = User::create(['email' => 'new@example.com']);
        $this->begin();
        $this->finishGoogle(['email' => $user->email]);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $user->update(['email' => 'changed@example.com']);
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => Mail::sent(OtpEmail::class)->last()->code])
            ->assertStatus(409);
        $this->assertGuest();
        $this->assertDatabaseCount('google_accounts', 0);
    }

    public function test_optional_profile_success_fills_missing_fields(): void
    {
        $this->begin();
        $this->finishGoogle();
        $this->begin('/api/auth/google/profile/redirect');
        $this->finishGoogle([], ['phoneNumbers' => [['canonicalForm' => '+6281234567890']]])
            ->assertRedirect('http://localhost:5173/google');
        $this->getJson('/api/auth/google/draft')->assertOk()->assertJsonPath('profile.phone', '+6281234567890');
    }

    public function test_successful_callback_cannot_be_replayed(): void
    {
        $this->begin();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/google');
        $this->finishGoogle()->assertRedirect('http://localhost:5173/login?error=google_invalid');
        Http::assertNothingSent();
        $this->assertDatabaseCount('pending_registrations', 1);
    }

    public function test_oauth_context_expires_after_ten_minutes(): void
    {
        $this->begin();
        $context = session('google_oauth');
        $context['created_at'] = time() - 601;
        $this->withSession(['google_oauth' => $context]);
        session()->save();
        $this->finishGoogle()->assertRedirect('http://localhost:5173/login?error=google_invalid');
        Http::assertNothingSent();
    }

    public function test_google_mutations_require_csrf(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $this->app->instance('env', 'local');
        $this->postJson('/api/auth/google/register', $this->form())->assertStatus(419);
        $this->postJson('/api/auth/google/email/request-otp')->assertStatus(419);
        $this->postJson('/api/auth/google/email/verify-otp')->assertStatus(419);
        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk();
        $this->postJson('/api/auth/google/email/request-otp', [], ['X-CSRF-TOKEN' => $csrf->json('csrf_token')])->assertOk();
    }

    public function test_verified_workspace_email_can_link_without_otp(): void
    {
        $user = User::create(['email' => 'student@campus.example']);
        $this->begin();
        $this->finishGoogle(['email' => $user->email, 'hd' => 'campus.example'])
            ->assertRedirect('http://localhost:5173/dashboard');
        $this->assertAuthenticatedAs($user);
        Mail::assertNothingSent();
    }

    public function test_restarting_google_login_does_not_bypass_otp_cooldown(): void
    {
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com']);
        $id = $this->postJson('/api/auth/google/email/request-otp')->assertOk()->json('challenge_id');
        $code = Mail::sent(OtpEmail::class)->last()->code;
        $this->begin();
        $this->finishGoogle(['email' => 'new@example.com'])->assertRedirect('http://localhost:5173/google?step=verify-email');
        $this->postJson('/api/auth/google/email/request-otp')->assertStatus(429);
        $this->postJson('/api/auth/google/email/verify-otp', ['challenge_id' => $id, 'code' => $code])->assertUnprocessable();
        Mail::assertSentCount(1);
    }
}
