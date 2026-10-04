<?php

namespace Tests\Feature;

use App\Models\Jasa;
use App\Models\JasaOrder;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class JasaOrderPricingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('fullName')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('jasas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 15, 2);
            $table->text('description');
            $table->text('packages')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('jasa_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jasa_id')->constrained();
            $table->foreignId('buyer_id')->constrained('users');
            $table->foreignId('seller_id')->constrained('users');
            $table->string('package_name');
            $table->decimal('price', 15, 2);
            $table->text('brief_notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained();
            $table->unsignedBigInteger('balance')->default(0);
            $table->timestamps();
        });
    }

    public function test_order_price_comes_from_the_selected_active_package(): void
    {
        $seller = User::create(['email' => 'seller@example.test']);
        $buyer = User::create(['email' => 'buyer@example.test']);
        $buyer->wallet()->create(['balance' => 50000]);
        $jasa = Jasa::create([
            'user_id' => $seller->id,
            'name' => 'Desain poster',
            'category' => 'Desain Grafis',
            'price' => 50000,
            'description' => 'Paket desain.',
            'packages' => [
                ['nama' => 'Basic', 'harga' => 50000, 'tampilkan' => true],
                ['nama' => 'Private', 'harga' => 250000, 'tampilkan' => false],
            ],
            'status' => 'active',
        ]);

        $this->actingAs($buyer, 'web')
            ->postJson("/api/jasas/{$jasa->id}/orders", [
                'package_name' => 'Basic',
                'price' => 1,
            ])
            ->assertCreated();

        $this->assertSame(50000.0, (float) JasaOrder::sole()->price);
    }

    public function test_hidden_or_unknown_package_cannot_be_ordered(): void
    {
        $seller = User::create(['email' => 'seller@example.test']);
        $buyer = User::create(['email' => 'buyer@example.test']);
        $buyer->wallet()->create(['balance' => 50000]);
        $jasa = Jasa::create([
            'user_id' => $seller->id,
            'name' => 'Desain poster',
            'category' => 'Desain Grafis',
            'price' => 50000,
            'description' => 'Paket desain.',
            'packages' => [
                ['nama' => 'Private', 'harga' => 250000, 'tampilkan' => false],
            ],
            'status' => 'active',
        ]);

        $this->actingAs($buyer, 'web')
            ->postJson("/api/jasas/{$jasa->id}/orders", [
                'package_name' => 'Private',
                'price' => 1,
            ])
            ->assertUnprocessable();

        $this->assertSame(0, JasaOrder::count());
    }
}
