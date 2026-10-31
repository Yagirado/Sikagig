<?php

namespace Tests\Feature;

use App\Mail\OtpEmail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Mail\PendingMail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Mockery;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class OtpAuthTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Production migrations contain MySQL-only ALTER TABLE CHECK syntax.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('fullName')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('email_otps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
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

    private function user(): User
    {
        return User::create(['email' => 'user@example.com', 'fullName' => 'Pengguna']);
    }

    private function challenge(User $user, array $attributes = []): EmailOtp
    {
        return EmailOtp::create(array_merge([
            'user_id' => $user->id,
            'email' => $user->email,
            'purpose' => 'login',
            'code_hash' => Hash::make('0482'),
            'attempts' => 0,
            'max_attempts' => 5,
            'sent_at' => now(),
            'expires_at' => now()->addMinutes(5),
        ], $attributes));
    }

    public function test_unregistered_email_does_not_create_a_user_or_send_mail(): void
    {
        $this->postJson('/api/auth/request-otp', ['email' => 'unknown@example.com'])
            ->assertStatus(422)->assertJson([
                'success' => false,
                'message' => 'Email belum terdaftar. Silakan daftar terlebih dahulu.',
            ]);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('email_otps', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_invalid_email_is_rejected(): void
    {
        $this->postJson('/api/auth/request-otp', ['email' => 'bukan-email'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        Mail::assertNothingOutgoing();
    }

    public function test_registered_email_receives_four_digits_and_only_a_hash_is_stored(): void
    {
        $user = $this->user();
        $response = $this->postJson('/api/auth/request-otp', ['email' => ' user@example.com '])
            ->assertOk()->assertJson(['success' => true, 'expires_in' => 300, 'retry_after' => 60]);
        $otp = EmailOtp::sole();
        $this->assertSame($otp->id, $response->json('challenge_id'));
        $this->assertTrue(Str::isUuid($otp->id));
        $this->assertSame($user->id, $otp->user_id);
        $this->assertSame('login', $otp->purpose);
        $this->assertTrue($otp->expires_at->equalTo(now()->addMinutes(5)));
        $this->assertSame(0, $otp->attempts);
        $this->assertSame(5, $otp->max_attempts);
        Mail::assertSent(OtpEmail::class, function (OtpEmail $mail) use ($user, $otp, $response) {
            $this->assertMatchesRegularExpression('/^[0-9]{4}$/', $mail->code);
            $this->assertTrue(Hash::check($mail->code, $otp->code_hash));
            $this->assertNotSame($mail->code, $otp->code_hash);
            $this->assertArrayNotHasKey('code', $response->json());
            $this->assertArrayNotHasKey('code_hash', $response->json());

            return $mail->hasTo($user->email);
        });
        Mail::assertNothingQueued();
        $this->assertGuest();
    }

    public function test_resending_before_sixty_seconds_keeps_the_existing_code(): void
    {
        $user = $this->user();
        $otp = $this->challenge($user);
        $this->travel(59)->seconds();
        $this->postJson('/api/auth/request-otp', ['email' => $user->email])
            ->assertStatus(429)->assertHeader('Retry-After', '1')
            ->assertJson(['success' => false, 'retry_after' => 1]);
        $this->assertSame($otp->id, EmailOtp::sole()->id);
        Mail::assertNothingOutgoing();
    }

    public function test_resending_after_sixty_seconds_replaces_the_challenge(): void
    {
        $user = $this->user();
        $old = $this->challenge($user, ['attempts' => 3]);
        $this->travel(60)->seconds();
        $this->postJson('/api/auth/request-otp', ['email' => $user->email])->assertOk();
        $new = EmailOtp::sole();
        $this->assertNotSame($old->id, $new->id);
        $this->assertSame(0, $new->attempts);
        $this->assertNull($new->consumed_at);
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $old->id, 'code' => '0482'])
            ->assertUnprocessable();
        Mail::assertSentCount(1);
        $this->assertGuest();
    }

    public function test_mail_failure_invalidates_the_new_and_replaced_codes(): void
    {
        $user = $this->user();
        $old = $this->challenge($user);
        $this->travel(60)->seconds();
        $pending = Mockery::mock(PendingMail::class);
        $pending->shouldReceive('send')->once()->andThrow(new TransportException('SMTP unavailable'));
        Mail::shouldReceive('to')->once()->with($user->email)->andReturn($pending);

        $this->postJson('/api/auth/request-otp', ['email' => $user->email])
            ->assertStatus(503)->assertJson(['success' => false])
            ->assertJsonMissingPath('challenge_id');
        $this->assertDatabaseCount('email_otps', 0);
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $old->id, 'code' => '0482'])
            ->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_otp_email_can_render_the_original_code_and_expiry(): void
    {
        $mail = new OtpEmail('0482');
        $mail->assertSeeInHtml('0482');
        $mail->assertSeeInHtml('5 menit');
        $mail->assertSeeInText('0482');
    }

    public function test_valid_code_logs_in_marks_email_verified_and_consumes_the_challenge(): void
    {
        $user = $this->user();
        $otp = $this->challenge($user);
        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $oldSessionId = session()->getId();

        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertOk()->assertJson(['success' => true, 'user' => ['id' => $user->id]])
            ->assertJsonMissingPath('user.remember_token');
        $this->assertAuthenticatedAs($user);
        $this->assertNotSame($oldSessionId, session()->getId());
        $this->assertNotNull($otp->fresh()->consumed_at);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertDatabaseMissing('sessions', ['id' => $oldSessionId]);
    }

    public function test_five_wrong_attempts_block_even_the_correct_code(): void
    {
        $otp = $this->challenge($this->user());
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '9999'])
                ->assertStatus($attempt === 5 ? 429 : 422);
            $this->assertSame($attempt, $otp->fresh()->attempts);
        }
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertStatus(429);
        $this->assertSame(5, $otp->fresh()->attempts);
        $this->assertGuest();
    }

    public function test_code_expires_at_exactly_five_minutes(): void
    {
        $otp = $this->challenge($this->user());
        $this->travel(5)->minutes();
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_used_code_cannot_be_replayed(): void
    {
        $otp = $this->challenge($this->user(), ['consumed_at' => now()]);
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_register_challenge_cannot_be_used_for_login(): void
    {
        $otp = $this->challenge($this->user(), ['purpose' => 'register']);
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_challenge_for_a_previous_email_cannot_log_in(): void
    {
        $user = $this->user();
        $otp = $this->challenge($user);
        $user->update(['email' => 'changed@example.com']);
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_verification_requires_a_uuid_and_exactly_four_digits(): void
    {
        $this->postJson('/api/auth/verify-otp', ['challenge_id' => 'invalid', 'code' => '12345'])
            ->assertUnprocessable()->assertJsonValidationErrors(['challenge_id', 'code']);
        $this->assertGuest();
    }

    public function test_session_cookie_restores_login_and_logout_invalidates_it(): void
    {
        $user = $this->user();
        $otp = $this->challenge($user);
        $response = $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertOk();
        $cookie = $response->getCookie(config('session.cookie'));
        $this->assertSame(now()->addDays(14)->timestamp, $cookie->getExpiresTime());
        $this->assertTrue($cookie->isHttpOnly());
        $sessionId = session()->getId();

        // Drop the cached guard so the next request must restore auth from storage.
        Auth::forgetGuards();
        $this->withCookie(config('session.cookie'), $cookie->getValue())
            ->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => $sessionId]);
        Auth::forgetGuards();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_guest_cannot_access_current_user(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_csrf_cookie_and_token_are_required_for_post_requests(): void
    {
        $user = $this->user();
        // Disable the framework's unit-test CSRF bypass, keeping the isolated
        // database and fake mailer configured by this test application.
        $this->app->instance('env', 'local');
        $this->postJson('/api/auth/request-otp', ['email' => $user->email])->assertStatus(419);
        Mail::assertNothingOutgoing();

        $csrf = $this->getJson('/api/auth/csrf-token')->assertOk();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $this->postJson('/api/auth/request-otp', ['email' => $user->email], [
            'X-CSRF-TOKEN' => $csrf->json('csrf_token'),
        ])->assertOk();
        Mail::assertSentCount(1);
    }

    public function test_request_rate_limit_also_covers_unknown_email_addresses(): void
    {
        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->postJson('/api/auth/request-otp', ['email' => "unknown{$attempt}@example.com"])
                ->assertUnprocessable();
        }
        $this->postJson('/api/auth/request-otp', ['email' => 'unknown11@example.com'])->assertStatus(429);
        $this->assertDatabaseCount('email_otps', 0);
        Mail::assertNothingOutgoing();
    }

    public function test_session_survives_thirteen_days_but_expires_after_fourteen_idle_days(): void
    {
        $user = $this->user();
        $otp = $this->challenge($user);
        $response = $this->postJson('/api/auth/verify-otp', ['challenge_id' => $otp->id, 'code' => '0482'])
            ->assertOk();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());

        $this->forgetSessionInMemory();
        $this->travel(13)->days();
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);

        $this->forgetSessionInMemory();
        $this->travel(15)->days();
        // Send the old cookie even though a browser would have expired it.
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    private function forgetSessionInMemory(): void
    {
        Auth::forgetGuards();
        app('session')->forgetDrivers();
        $this->app->forgetInstance('session.store');
    }
}
