<?php

namespace Tests\Feature;

use App\Models\EmailOtp;
use App\Models\GoogleAccount;
use App\Models\Sessions;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthModelsTest extends TestCase
{
    public function test_otp_keeps_hash_private_and_converts_challenge_values(): void
    {
        $otp = new EmailOtp([
            'user_id' => '12',
            'email' => 'user@example.test',
            'purpose' => 'login',
            'code_hash' => 'already-hashed-otp',
            'attempts' => '0',
            'max_attempts' => '5',
            'sent_at' => '2026-09-11 10:00:00',
            'expires_at' => '2026-09-11 10:05:00',
            'consumed_at' => null,
        ]);
        $otp->setUniqueIds();

        $this->assertTrue(Str::isUuid($otp->getKey()));
        $this->assertSame('already-hashed-otp', $otp->code_hash);
        $this->assertArrayNotHasKey('code_hash', $otp->toArray());
        $this->assertSame(0, $otp->attempts);
        $this->assertSame(5, $otp->max_attempts);
        $this->assertInstanceOf(Carbon::class, $otp->expires_at);
        $this->assertNull($otp->consumed_at);
        $this->assertSame(12, $otp->user()->getQuery()->getBindings()[0]);
        $this->assertInstanceOf(User::class, $otp->user()->getRelated());
    }

    public function test_google_account_preserves_subject_and_links_to_its_user(): void
    {
        $account = new GoogleAccount([
            'user_id' => '12',
            'google_sub' => '001234567890123456789',
        ]);

        $this->assertSame('001234567890123456789', $account->google_sub);
        $this->assertSame(12, $account->user()->getQuery()->getBindings()[0]);
        $this->assertInstanceOf(User::class, $account->user()->getRelated());
    }

    public function test_guest_session_saves_with_string_id_without_timestamp_columns(): void
    {
        $migration = require database_path('migrations/2026_09_09_082710_create_sessions_table.php');
        Schema::disableForeignKeyConstraints();
        $migration->up();

        try {
            $session = Sessions::create([
                'id' => 'session-id-with-letters',
                'user_id' => null,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Test browser',
                'payload' => base64_encode('private session data'),
                'last_activity' => '1789111200',
            ])->fresh();

            $this->assertSame('session-id-with-letters', $session->getKey());
            $this->assertSame(1789111200, $session->last_activity);
            $this->assertNull($session->user);
            $this->assertArrayNotHasKey('id', $session->toArray());
            $this->assertArrayNotHasKey('payload', $session->toArray());
            $this->assertInstanceOf(User::class, $session->user()->getRelated());
        } finally {
            $migration->down();
            Schema::enableForeignKeyConstraints();
        }
    }
}
