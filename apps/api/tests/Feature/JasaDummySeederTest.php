<?php

namespace Tests\Feature;

use App\Http\Requests\StoreJasaRequest;
use App\Models\Jasa;
use App\Models\User;
use Database\Seeders\JasaDummySeeder;
use Illuminate\Support\Facades\Validator;
use Tests\Support\CreatesAuthTables;
use Tests\TestCase;

class JasaDummySeederTest extends TestCase
{
    use CreatesAuthTables;

    protected function setUp(): void
    {
        parent::setUp();

        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertTrue(class_exists(JasaDummySeeder::class), 'JasaDummySeeder belum dibuat.');

        $this->createAuthTables();

        foreach ([
            '2026_09_19_103654_create_gigs_table.php',
            '2026_09_19_103712_create_jasas_table.php',
            '2026_09_24_191321_add_packages_to_jasas_table.php',
        ] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
    }

    public function test_seeded_packages_match_the_form_contract_and_cover_filtered_pagination(): void
    {
        $user = User::create(['fullName' => 'Penyedia Dummy', 'email' => 'provider@example.test']);

        $this->seed(JasaDummySeeder::class);

        $jasas = Jasa::all();
        $this->assertCount(650, $jasas);
        $this->assertCount(13, $jasas->groupBy('category'));
        $this->assertSame([1, 2, 3, 4], $jasas->map(fn ($jasa) => count($jasa->packages))->unique()->sort()->values()->all());

        foreach ($jasas->groupBy('category') as $categoryRows) {
            $this->assertGreaterThan(30, $categoryRows->count());
        }

        $rules = (new StoreJasaRequest)->rules();

        foreach ($jasas as $jasa) {
            $validator = Validator::make($jasa->toArray(), $rules);
            $this->assertTrue($validator->passes(), $validator->errors()->toJson());
            $this->assertEquals(min(array_column($jasa->packages, 'harga')), $jasa->price);
            $this->assertSame($user->id, $jasa->user_id);
            $this->assertSame('active', $jasa->status);
        }
    }

    public function test_rerunning_the_seeder_preserves_existing_records(): void
    {
        $user = User::create(['fullName' => 'Penyedia', 'email' => 'owner@example.test']);
        $real = Jasa::create([
            'user_id' => $user->id,
            'name' => 'Jasa milik pengguna',
            'category' => 'Coding',
            'description' => 'Tidak boleh diubah oleh seeder.',
            'price' => 123000,
            'status' => 'active',
        ]);

        $this->seed(JasaDummySeeder::class);
        $dummy = Jasa::where('id', '!=', $real->id)->firstOrFail();
        $dummy->update(['description' => 'Perubahan manual pada data dummy.']);
        $snapshot = Jasa::orderBy('id')->get()->toArray();

        $this->seed(JasaDummySeeder::class);

        $this->assertCount(651, Jasa::all());
        $this->assertSame($snapshot, Jasa::orderBy('id')->get()->toArray());
        $this->assertSame(1, User::count());
    }

    public function test_an_empty_user_table_does_not_create_orphaned_listings(): void
    {
        $this->artisan('db:seed', ['--class' => JasaDummySeeder::class])
            ->expectsOutput('Belum ada user. Buat akun terlebih dahulu.')
            ->assertExitCode(0);

        $this->assertSame(0, Jasa::count());
        $this->assertSame(0, User::count());
    }
}
