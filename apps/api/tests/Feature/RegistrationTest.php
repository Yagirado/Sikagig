<?php

namespace Tests\Feature;

use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\PendingRegistration;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Mail\PendingMail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Testing\TestResponse;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Auth fixture for HTTP tests; real MySQL migrations are checked separately.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('NIM', 13)->nullable()->unique();
            $table->string('fullName')->nullable();
            $table->string('email')->collation('NOCASE')->unique();
            $table->string('phone', 32)->nullable();
            $table->string('gender', 5)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->boolean('legal_agreement')->default(false);
            $table->boolean('privacy_agreement')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('profile_completed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('pending_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->collation('NOCASE');
            $table->string('provider', 16)->default('email');
            $table->string('owner_hash', 64)->nullable();
            $table->unique(['email', 'provider']);
            $table->longText('data');
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
        Schema::create('email_otps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('pending_registration_id')->nullable()->unique()
                ->constrained('pending_registrations')->cascadeOnDelete();
            $table->string('email');
            $table->string('purpose', 16);
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(5);
            $table->timestamp('sent_at');
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'purpose']);
        });
        (require database_path('migrations/2026_09_09_082710_create_sessions_table.php'))->up();
        config(['session.driver' => 'database']);
        Mail::fake();
        $this->freezeSecond();
        $this->withCredentials();
    }

    private function profile(array $overrides = []): array
    {
        return array_merge([
            'NIM' => '0123456789012', 'fullName' => 'Calon Pengguna',
            'email' => 'new@example.com', 'phone' => '081234567890',
            'gender' => 'woman', 'tanggal_lahir' => '25/12/2003',
            'legal_agreement' => true, 'privacy_agreement' => true,
        ], $overrides);
    }

    private function send(array $overrides = []): TestResponse
    {
        return $this->postJson('/api/auth/register/request-otp', $this->profile($overrides));
    }

    private function verify(string $challengeId, ?string $code = null): TestResponse
    {
        return $this->postJson('/api/auth/register/verify-otp', [
            'challenge_id' => $challengeId,
            'code' => $code ?? Mail::sent(OtpEmail::class)->last()->code,
        ]);
    }

    public function test_request_sends_registration_otp_without_creating_a_user(): void
    {
        $response = $this->send(['email' => ' NEW@example.com '])->assertOk()
            ->assertJson(['success' => true, 'expires_in' => 300, 'retry_after' => 60]);
        $this->assertDatabaseCount('users', 0);
        $draft = PendingRegistration::sole();
        $otp = EmailOtp::sole();
        $this->assertSame('new@example.com', $draft->email);
        $this->assertSame('0123456789012', $draft->data['NIM']);
        $this->assertTrue($draft->expires_at->equalTo(now()->addMinutes(30)));
        $this->assertStringNotContainsString('Calon Pengguna', DB::table('pending_registrations')->value('data'));
        $this->assertSame($draft->id, $otp->pending_registration_id);
        $this->assertNull($otp->user_id);
        $this->assertSame('register', $otp->purpose);
        $this->assertSame($otp->id, $response->json('challenge_id'));
        $this->assertTrue($otp->expires_at->equalTo(now()->addMinutes(5)));
        Mail::assertSent(OtpEmail::class, function (OtpEmail $mail) use ($otp) {
            $this->assertMatchesRegularExpression('/^[0-9]{4}$/', $mail->code);
            $this->assertTrue(Hash::check($mail->code, $otp->code_hash));
            $mail->assertSeeInHtml('Registrasi');

            return $mail->hasTo('new@example.com');
        });
        $response->assertJsonMissingPath('code')->assertJsonMissingPath('code_hash')
            ->assertJsonMissingPath('data');
        Mail::assertNothingQueued();
        $this->assertGuest();
    }

    public static function invalidFields(): array
    {
        return [
            'nim length' => ['NIM', '123'], 'nim numeric input' => ['NIM', 1234567890123],
            'nim letters' => ['NIM', '012345678901x'], 'name blank' => ['fullName', '   '],
            'email invalid' => ['email', 'invalid'], 'phone invalid' => ['phone', 'abc'],
            'phone short' => ['phone', '0812'], 'gender invalid' => ['gender', 'invalid'],
            'impossible date' => ['tanggal_lahir', '31/02/2003'],
            'future date' => ['tanggal_lahir', '2999-01-01'],
            'legal rejected' => ['legal_agreement', false],
            'privacy rejected' => ['privacy_agreement', false],
        ];
    }

    #[DataProvider('invalidFields')]
    public function test_invalid_profile_is_rejected_before_sending(string $field, mixed $value): void
    {
        $this->send([$field => $value])->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('pending_registrations', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_missing_fields_are_rejected(): void
    {
        $this->postJson('/api/auth/register/request-otp', [])->assertUnprocessable()
            ->assertJsonValidationErrors(array_keys($this->profile()));
        Mail::assertNothingOutgoing();
    }

    public function test_registered_email_or_nim_is_rejected(): void
    {
        User::create(['email' => 'EXISTING@example.com', 'NIM' => '9999999999999']);
        $this->send(['email' => 'existing@example.com'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->send(['NIM' => '9999999999999'])->assertUnprocessable()->assertJsonValidationErrors('NIM');
        $this->assertDatabaseCount('pending_registrations', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_verification_creates_complete_user_consumes_code_and_logs_in(): void
    {
        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $oldSessionId = session()->getId();
        $id = $this->send()->assertOk()->json('challenge_id');
        $response = $this->verify($id)->assertCreated()->assertJson(['success' => true]);
        $user = User::sole();
        $this->assertSame('0123456789012', $user->NIM);
        $this->assertSame('2003-12-25', $user->tanggal_lahir->format('Y-m-d'));
        $this->assertTrue($user->legal_agreement);
        $this->assertTrue($user->privacy_agreement);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->profile_completed_at);
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('pending_registrations', 0);
        $otp = EmailOtp::findOrFail($id);
        $this->assertSame($user->id, $otp->user_id);
        $this->assertNull($otp->pending_registration_id);
        $this->assertNotNull($otp->consumed_at);
        $this->assertNotSame($oldSessionId, session()->getId());
        $this->assertDatabaseMissing('sessions', ['id' => $oldSessionId]);
        $cookie = $response->getCookie(config('session.cookie'));
        $this->assertSame(now()->addDays(14)->timestamp, $cookie->getExpiresTime());
        Auth::forgetGuards();
        app('session')->forgetDrivers();
        $this->app->forgetInstance('session.store');
        $this->withCookie(config('session.cookie'), $cookie->getValue())
            ->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->verify($id)->assertUnprocessable();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_cooldown_preserves_draft_and_resend_replaces_both_draft_data_and_code(): void
    {
        $first = $this->send()->assertOk()->json('challenge_id');
        $firstCode = Mail::sent(OtpEmail::class)->last()->code;
        $this->travel(59)->seconds();
        $this->send(['fullName' => 'Nama Baru'])->assertStatus(429)->assertHeader('Retry-After', '1');
        $this->assertSame('Calon Pengguna', PendingRegistration::sole()->data['fullName']);
        $this->travel(1)->seconds();
        $second = $this->send(['fullName' => 'Nama Baru'])->assertOk()->json('challenge_id');
        $this->assertNotSame($first, $second);
        $this->assertDatabaseCount('pending_registrations', 1);
        $this->assertDatabaseCount('email_otps', 1);
        $this->verify($first, $firstCode)->assertUnprocessable();
        $this->verify($second)->assertCreated();
        $this->assertSame('Nama Baru', User::sole()->fullName);
    }

    public function test_mail_failure_cancels_draft_and_previous_otp(): void
    {
        $first = $this->send()->assertOk()->json('challenge_id');
        $this->travel(60)->seconds();
        $pending = Mockery::mock(PendingMail::class);
        $pending->shouldReceive('send')->once()->andThrow(new TransportException('SMTP unavailable'));
        Mail::shouldReceive('to')->once()->with('new@example.com')->andReturn($pending);
        $this->send()->assertStatus(503)->assertJson(['success' => false])->assertJsonMissingPath('challenge_id');
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('pending_registrations', 0);
        $this->assertDatabaseCount('email_otps', 0);
        $this->verify($first, '0482')->assertUnprocessable();
    }

    public function test_five_wrong_codes_block_registration(): void
    {
        $id = $this->send()->assertOk()->json('challenge_id');
        $correct = Mail::sent(OtpEmail::class)->last()->code;
        $wrong = $correct === '9999' ? '0000' : '9999';
        for ($i = 1; $i <= 5; $i++) {
            $this->verify($id, $wrong)->assertStatus($i === 5 ? 429 : 422);
        }
        $this->verify($id, $correct)->assertStatus(429);
        $this->assertSame(5, EmailOtp::findOrFail($id)->attempts);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_expired_code_is_rejected_and_can_be_reissued(): void
    {
        $id = $this->send()->assertOk()->json('challenge_id');
        $this->travel(5)->minutes();
        $this->verify($id)->assertUnprocessable();
        $newId = $this->send()->assertOk()->json('challenge_id');
        $this->verify($newId)->assertCreated();
    }

    public function test_email_and_nim_are_checked_again_at_verification(): void
    {
        $id = $this->send()->assertOk()->json('challenge_id');
        $other = User::create(['email' => 'other@example.com', 'NIM' => '0123456789012']);
        $this->verify($id)->assertUnprocessable()->assertJsonValidationErrors('NIM');
        $other->update(['NIM' => '9999999999999', 'email' => 'new@example.com']);
        $this->verify($id)->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertNull(EmailOtp::findOrFail($id)->consumed_at);
        $this->assertDatabaseCount('users', 1);
        $this->assertGuest();
    }

    public function test_pending_registrations_do_not_reserve_nim_permanently(): void
    {
        $this->send()->assertOk();
        $id = $this->send(['email' => 'another@example.com'])->assertOk()->json('challenge_id');
        $this->verify($id)->assertCreated();
        $this->assertSame('another@example.com', User::sole()->email);
    }

    public function test_login_and_registration_challenges_are_not_interchangeable(): void
    {
        $registerId = $this->send()->assertOk()->json('challenge_id');
        $code = Mail::sent(OtpEmail::class)->last()->code;
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $registerId, 'code' => $code])
            ->assertUnprocessable();
        $user = User::create(['email' => 'existing@example.com']);
        $loginId = $this->postJson('/api/auth/request-otp', ['email' => $user->email])
            ->assertOk()->json('challenge_id');
        $this->verify($loginId)->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_prune_deletes_only_expired_drafts_and_their_codes(): void
    {
        $expired = $this->send()->assertOk()->json('challenge_id');
        $this->travel(30)->minutes();
        $active = $this->send(['email' => 'active@example.com'])->assertOk()->json('challenge_id');
        $this->artisan('registrations:prune')->assertSuccessful();
        $this->assertDatabaseMissing('email_otps', ['id' => $expired]);
        $this->assertDatabaseHas('email_otps', ['id' => $active]);
        $this->assertDatabaseCount('pending_registrations', 1);
    }

    public function test_registration_posts_require_csrf(): void
    {
        $this->app->instance('env', 'local');
        $this->send()->assertStatus(419);
        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $response = $this->postJson('/api/auth/register/request-otp', $this->profile(), [
            'X-CSRF-TOKEN' => $csrf->json('csrf_token'),
        ])->assertOk();
        $this->verify($response->json('challenge_id'))->assertStatus(419);
        $this->postJson('/api/auth/register/verify-otp', [
            'challenge_id' => $response->json('challenge_id'),
            'code' => Mail::sent(OtpEmail::class)->last()->code,
        ], ['X-CSRF-TOKEN' => $csrf->json('csrf_token')])->assertCreated();
    }

    public function test_payload_email_must_match_the_verified_destination(): void
    {
        $id = $this->send()->assertOk()->json('challenge_id');
        $draft = PendingRegistration::sole();
        $draft->update(['data' => array_merge($draft->data, ['email' => 'different@example.com'])]);
        $this->verify($id)->assertUnprocessable();
        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }
}
