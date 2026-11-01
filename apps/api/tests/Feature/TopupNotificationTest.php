<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TopupNotificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.midtrans.server_key' => 'test-server-key']);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('fullName')->nullable();
            $table->string('email')->nullable();
            $table->timestamps();
        });

        Schema::create('topups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('merchant_order_id')->unique();
            $table->string('provider_reference')->nullable();
            $table->unsignedBigInteger('amount');
            $table->string('status');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->unsignedBigInteger('balance')->default(0);
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('topups');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_successful_topup_creates_one_notification_and_credits_wallet_once(): void
    {
        DB::table('users')->insert([
            'id' => 1,
            'fullName' => 'Test User',
            'email' => 'test@example.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('topups')->insert([
            'user_id' => 1,
            'merchant_order_id' => 'TOPUP-1-TEST',
            'amount' => 10000,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'order_id' => 'TOPUP-1-TEST',
            'status_code' => '200',
            'gross_amount' => '10000.00',
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ];
        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$payload['gross_amount']
                .config('services.midtrans.server_key')
        );

        $this->postJson('/api/payments/midtrans/callback', $payload)->assertOk();
        $this->postJson('/api/payments/midtrans/callback', $payload)->assertOk();

        $this->assertDatabaseHas('wallets', [
            'user_id' => 1,
            'balance' => 10000,
        ]);
        $this->assertDatabaseHas('topups', [
            'merchant_order_id' => 'TOPUP-1-TEST',
            'status' => 'paid',
        ]);
        $this->assertDatabaseCount('notifications', 1);

        $notification = DB::table('notifications')->first();
        $data = json_decode($notification->data, true);

        $this->assertSame('topup_processed', $data['type']);
        $this->assertSame('Top up berhasil', $data['title']);
        $this->assertSame(
            'Top up sebesar Rp 10.000 berhasil ditambahkan ke saldo wallet.',
            $data['message']
        );
        $this->assertSame('/wallet-transaksi', $data['url']);
    }
}
