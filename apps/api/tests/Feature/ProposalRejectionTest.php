<?php

namespace Tests\Feature;

use App\Models\Gig;
use App\Models\Proposal;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProposalRejectionTest extends TestCase
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

        Schema::create('gigs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('title');
            $table->string('category');
            $table->string('urgency');
            $table->string('mode')->default('sendiri');
            $table->unsignedInteger('max_workers')->default(1);
            $table->date('deadline')->nullable();
            $table->text('description');
            $table->decimal('budget', 15, 2);
            $table->string('photos')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gig_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->text('cover_letter');
            $table->decimal('bid_amount', 15, 2);
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function test_gig_owner_cannot_reject_an_accepted_proposal(): void
    {
        $owner = User::create([
            'email' => 'owner@example.test',
            'fullName' => 'Pemilik Gig',
        ]);
        $applicant = User::create([
            'email' => 'applicant@example.test',
            'fullName' => 'Pelamar',
        ]);
        $gig = Gig::create([
            'user_id' => $owner->id,
            'title' => 'Buat aplikasi',
            'category' => 'Coding',
            'urgency' => 'normal',
            'description' => 'Deskripsi gig',
            'budget' => 100000,
            'status' => 'in_progress',
        ]);
        $proposal = Proposal::create([
            'gig_id' => $gig->id,
            'user_id' => $applicant->id,
            'cover_letter' => 'Saya siap mengerjakan.',
            'bid_amount' => 100000,
            'status' => 'accepted',
        ]);

        $this->actingAs($owner, 'web')
            ->patchJson("/api/proposals/{$proposal->id}/reject")
            ->assertUnprocessable();

        $this->assertDatabaseHas('proposals', [
            'id' => $proposal->id,
            'status' => 'accepted',
        ]);
    }
}
