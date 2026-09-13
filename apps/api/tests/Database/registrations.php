<?php

// Run: php tests/Database/registrations.php
// Uses only a uniquely named scratch database on the configured MySQL server.
use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\GoogleAccount;
use App\Models\PendingRegistration;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(ConsoleKernel::class)->bootstrap();
$originalConnection = DB::getDefaultConnection();
$admin = DB::connection();
if ($admin->getDriverName() !== 'mysql') {
    throw new RuntimeException('This integration check requires the configured MySQL server.');
}
$pdo = $admin->getPdo();
$originalDatabase = $admin->getDatabaseName();
$scratch = 'sikagig_registration_test_'.bin2hex(random_bytes(8));
$created = false;
$failure = null;

function ensureRegistration(bool $condition, string $message): void
{
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

$cookies = [];
$http = function (string $method, string $uri, array $data = []) use ($app, &$cookies): array {
    Auth::forgetGuards();
    app('session')->forgetDrivers();
    $app->forgetInstance('session.store');
    $request = Request::create($uri, $method, $data, $cookies, [], ['HTTP_ACCEPT' => 'application/json']);
    $kernel = $app->make(HttpKernel::class);
    $response = $kernel->handle($request);
    $kernel->terminate($request, $response);
    foreach ($response->headers->getCookies() as $cookie) {
        $cookies[$cookie->getName()] = $cookie->getValue();
    }

    return [$response->getStatusCode(), json_decode($response->getContent(), true), $response];
};

try {
    $pdo->exec("CREATE DATABASE `$scratch` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $created = true;
    $testConfig = $admin->getConfig();
    $testConfig['database'] = $scratch;
    $testConfig['url'] = null;
    $testConfig['name'] = 'registration_test';
    config([
        'database.connections.registration_test' => $testConfig,
        'session.driver' => 'database', 'session.connection' => 'registration_test',
        'cache.default' => 'array', 'app.debug' => false,
    ]);
    DB::setDefaultConnection('registration_test');
    ensureRegistration(DB::connection()->getName() === 'registration_test'
        && DB::connection()->getDatabaseName() === $scratch, 'Scratch connection identity mismatch.');
    foreach ([User::class, EmailOtp::class, PendingRegistration::class, GoogleAccount::class] as $model) {
        $connection = (new $model)->getConnection();
        ensureRegistration($connection->getName() === 'registration_test'
            && $connection->getDatabaseName() === $scratch, 'Model is not isolated to scratch database.');
    }
    Mail::fake();

    foreach ([
        '0001_01_01_000000_create_users_table.php',
        '2026_09_09_082604_create_email_otps_table.php',
        '2026_09_09_082612_create_google_accounts_table.php',
        '2026_09_09_082710_create_sessions_table.php',
    ] as $file) {
        (require database_path('migrations/'.$file))->up();
    }
    $existing = User::create(['email' => 'existing@example.test']);
    $legacyOtp = EmailOtp::create([
        'user_id' => $existing->id, 'email' => $existing->email, 'purpose' => 'login',
        'code_hash' => Hash::make('0482'), 'attempts' => 0, 'max_attempts' => 5,
        'sent_at' => now(), 'expires_at' => now()->addMinutes(5),
    ]);
    $legacyValues = (array) DB::table('email_otps')->where('id', $legacyOtp->id)->first();
    $pendingMigration = require database_path('migrations/2026_09_13_100000_create_pending_registrations_table.php');
    $linkMigration = require database_path('migrations/2026_09_13_100001_link_registration_otps_to_pending_registrations.php');
    $pendingMigration->up();
    $linkMigration->up();
    $legacyDraft = PendingRegistration::create(['email' => 'legacy-draft@example.com', 'data' => ['email' => 'legacy-draft@example.com'], 'expires_at' => now()->addMinutes(30)]);
    $googleMigration = require database_path('migrations/2026_09_13_120000_separate_google_registration_drafts.php');
    $googleMigration->up();
    ensureRegistration($legacyDraft->fresh()->provider === 'email' && $legacyDraft->fresh()->data['email'] === $legacyDraft->email,
        'Google migration changed an existing email draft.');
    $legacyDraft->delete();
    $upgradedValues = (array) DB::table('email_otps')->where('id', $legacyOtp->id)->first();
    ensureRegistration(array_intersect_key($upgradedValues, $legacyValues) === $legacyValues, 'Upgrade changed an existing login OTP.');
    echo "PASS MySQL upgrade preserves existing user and OTP\n";

    [$status, $csrf] = $http('GET', '/api/auth/csrf-token');
    ensureRegistration($status === 200, 'CSRF bootstrap failed.');
    $profile = [
        'NIM' => '0123456789012', 'fullName' => 'Registration Test',
        'email' => 'new@example.com', 'phone' => '081234567890',
        'gender' => 'woman', 'tanggal_lahir' => '25/12/2003',
        'legal_agreement' => true, 'privacy_agreement' => true,
        '_token' => $csrf['csrf_token'],
    ];
    [$status, $sent] = $http('POST', '/api/auth/register/request-otp', $profile);
    ensureRegistration($status === 200, 'Registration send failed with HTTP '.$status);
    ensureRegistration(User::count() === 1, 'User created before verification.');
    $code = Mail::sent(OtpEmail::class)->last()->code;
    [$status] = $http('POST', '/api/auth/register/verify-otp', [
        'challenge_id' => $sent['challenge_id'], 'code' => $code, '_token' => $csrf['csrf_token'],
    ]);
    ensureRegistration($status === 201, 'Registration verify failed with HTTP '.$status);
    $user = User::where('email', 'new@example.com')->sole();
    ensureRegistration($user->NIM === '0123456789012' && $user->email_verified_at !== null
        && $user->profile_completed_at !== null, 'Verified profile is incomplete.');
    ensureRegistration(DB::table('pending_registrations')->count() === 0, 'Successful registration retained the draft.');
    ensureRegistration(EmailOtp::findOrFail($sent['challenge_id'])->consumed_at !== null, 'Code was not consumed.');
    [$status, $me] = $http('GET', '/api/auth/me');
    ensureRegistration($status === 200 && $me['user']['id'] === $user->id, 'Cookie did not restore login.');
    echo "PASS MySQL HTTP registration, profile CHECK constraints, OTP consumption, CSRF and session\n";

    // MySQL unicode_ci equates accented and unaccented domains, even though
    // they are distinct delivery addresses. Replacement must bind the new data
    // to the exact address receiving the new code.
    [$status, $csrf] = $http('GET', '/api/auth/csrf-token');
    $variantProfile = array_merge($profile, [
        'email' => 'owner@tést.example.com', 'NIM' => '8888888888888', '_token' => $csrf['csrf_token'],
    ]);
    [$status, $variant] = $http('POST', '/api/auth/register/request-otp', $variantProfile);
    ensureRegistration($status === 200, 'IDN email fixture was rejected.');
    DB::table('email_otps')->where('id', $variant['challenge_id'])->update(['sent_at' => now()->subSeconds(61)]);
    $variantProfile['email'] = 'owner@test.example.com';
    [$status, $variant] = $http('POST', '/api/auth/register/request-otp', $variantProfile);
    ensureRegistration($status === 200, 'Collation-equivalent resend was rejected.');
    ensureRegistration(Mail::sent(OtpEmail::class)->last()->hasTo('owner@test.example.com'),
        'OTP was sent to a different email than the submitted registration.');
    $variantOtp = EmailOtp::findOrFail($variant['challenge_id']);
    ensureRegistration($variantOtp->email === $variantProfile['email'], 'OTP destination differs from submitted email.');
    echo "PASS MySQL collation-equivalent emails keep exact OTP destination binding\n";

    // Exercise Google HTTP callbacks against real MySQL constraints, with only
    // Google's HTTP responses faked. The signature is verified by the real JWT library.
    config(['services.google.client_id' => 'mysql-test-client', 'services.google.client_secret' => 'mysql-test-secret',
        'services.google.redirect' => 'http://localhost/auth-google-callback', 'services.google.frontend_url' => 'http://localhost:5173']);
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA,
        'config' => dirname(__DIR__).'/Support/openssl.cnf']);
    ensureRegistration($key !== false, 'Could not generate isolated Google test key.');
    $rsa = openssl_pkey_get_details($key)['rsa'];
    $googleSignIn = function (string $email, string $sub) use ($http, $key, $rsa): string {
        [$status, , $redirect] = $http('GET', '/api/auth/google/redirect');
        ensureRegistration($status === 302, 'Google redirect failed.');
        parse_str(parse_url($redirect->headers->get('Location'), PHP_URL_QUERY), $oauth);
        $token = JWT::encode(['iss' => 'https://accounts.google.com', 'aud' => 'mysql-test-client',
            'sub' => $sub, 'email' => $email, 'email_verified' => true, 'hd' => 'example.com',
            'name' => 'Google MySQL', 'iat' => time(), 'exp' => time() + 300, 'nonce' => $oauth['nonce']], $key, 'RS256', 'mysql-key');
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['id_token' => $token, 'access_token' => 'test-token']),
            'https://www.googleapis.com/oauth2/v3/certs' => Http::response(['keys' => [[
                'kty' => 'RSA', 'kid' => 'mysql-key', 'alg' => 'RS256', 'use' => 'sig',
                'n' => JWT::urlsafeB64Encode($rsa['n']), 'e' => JWT::urlsafeB64Encode($rsa['e']),
            ]]]),
            'https://people.googleapis.com/*' => Http::response([], 403),
        ]);
        [$status, , $callback] = $http('GET', '/auth-google-callback?'.http_build_query(['code' => 'test-code', 'state' => $oauth['state']]));
        ensureRegistration($status === 302, 'Google callback did not redirect.');

        return $callback->headers->get('Location');
    };
    // An accented domain and its unaccented equivalent are equal under the
    // database collation, but must never grant access to each other's account.
    $existing->update(['email' => 'owner@tést.example.com']);
    ensureRegistration($googleSignIn('owner@test.example.com', 'mysql-conflicting-sub') === 'http://localhost:5173/login?error=google_conflict',
        'Google linked a collation-equivalent but different email.');
    ensureRegistration(GoogleAccount::count() === 0, 'Unexpected Google link after email conflict.');
    ensureRegistration($googleSignIn('owner@test.example.com', 'mysql-new-sub') === 'http://localhost:5173/login?error=google_conflict',
        'Google repeated email conflict unexpectedly succeeded.');
    $cookies = [];
    ensureRegistration($googleSignIn('mysql-new@gmail.com', 'mysql-new-sub') === 'http://localhost:5173/google', 'Google draft callback failed.');
    [$status, $draft] = $http('GET', '/api/auth/google/draft');
    ensureRegistration($status === 200 && $draft['profile']['email'] === 'mysql-new@gmail.com', 'Google draft unavailable.');
    [$status, $csrf] = $http('GET', '/api/auth/csrf-token');
    $googleForm = $profile;
    unset($googleForm['email']);
    $googleForm['NIM'] = '2222222222222';
    $googleForm['_token'] = $csrf['csrf_token'];
    [$status] = $http('POST', '/api/auth/google/register', $googleForm);
    ensureRegistration($status === 201 && GoogleAccount::where('google_sub', 'mysql-new-sub')->count() === 1,
        'Google registration or unique/FK constraints failed. HTTP '.$status);
    [$status, $me] = $http('GET', '/api/auth/me');
    ensureRegistration($status === 200 && $me['user']['email'] === 'mysql-new@gmail.com', 'Google session did not persist.');
    echo "PASS MySQL Google JWT callback, exact-email linking, registration constraints and persistent session\n";

    [$status, $csrf] = $http('GET', '/api/auth/csrf-token');
    [$status] = $http('POST', '/api/auth/register/request-otp', array_merge($profile, [
        'email' => 'pending@example.com', 'NIM' => '9999999999999', '_token' => $csrf['csrf_token'],
    ]));
    ensureRegistration($status === 200, 'Could not create rollback fixture.');
    $googleMigration->down();
    $linkMigration->down();
    $pendingMigration->down();
    ensureRegistration(User::count() === 3 && GoogleAccount::count() === 1, 'Rollback deleted registered users or Google links.');
    ensureRegistration(EmailOtp::find($legacyOtp->id) !== null, 'Rollback deleted legacy login OTP.');
    ensureRegistration(EmailOtp::whereNull('user_id')->count() === 0, 'Rollback retained an unowned OTP.');
    ensureRegistration(EmailOtp::find($sent['challenge_id']) !== null, 'Rollback deleted consumed user OTP.');
    echo "PASS MySQL rollback preserves accounts and user OTPs\n";

    $pendingMigration->up();
    $linkMigration->up();
    $googleMigration->up();
    echo "PASS MySQL migrations can be applied again after rollback\n";
} catch (Throwable $exception) {
    $failure = $exception;
} finally {
    DB::purge('registration_test');
    DB::setDefaultConnection($originalConnection);
    if ($created && preg_match('/^sikagig_registration_test_[a-f0-9]{16}$/D', $scratch)
        && $scratch !== $originalDatabase) {
        $pdo->exec("DROP DATABASE `$scratch`");
    }
}
if ($failure !== null) {
    fwrite(STDERR, 'FAIL: '.$failure->getMessage().PHP_EOL);
    exit(1);
}
