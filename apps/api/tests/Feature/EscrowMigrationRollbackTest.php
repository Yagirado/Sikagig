<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EscrowMigrationRollbackTest extends TestCase
{
    public function test_rollback_drops_escrow_payments_table(): void
    {
        Schema::create('escrows', function (Blueprint $table) {
            $table->id();
        });
        Schema::create('escrow_payments', function (Blueprint $table) {
            $table->id();
        });

        (require database_path('migrations/2026_10_01_092946_create_escrows_and_escrows_payment_tables.php'))
            ->down();

        $this->assertFalse(Schema::hasTable('escrow_payments'));
        $this->assertFalse(Schema::hasTable('escrows'));
    }
}
