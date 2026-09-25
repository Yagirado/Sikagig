<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GigDummySeeder extends Seeder
{
    public function run(): void
    {
        $userIds = User::pluck('id')->all();

        if ($userIds === []) {
            $this->command->error(
                'Belum ada user. Buat akun terlebih dahulu.'
            );

            return;
        }

        $categories = [
            'Joki Tugas',
            'Desain Grafis',
            'Anterin',
            'Coding',
            'Survey & Data',
            'Jastip',
            'Antriin',
            'Fisik',
            'Curhat',
            'Hiburan & Mabar',
            'Fotografi & Video',
            'Editing',
            'Random',
        ];

        $urgencies = ['santai', 'segera', 'mendesak'];
        $total = 0;

        foreach ($categories as $category) {
            $rows = [];

            for ($i = 1; $i <= 50; $i++) {
                $createdAt = fake()
                    ->dateTimeBetween('-60 days', 'now')
                    ->format('Y-m-d H:i:s');

                $rows[] = [
                    'user_id' => fake()->randomElement($userIds),

                    'title' => sprintf(
                        '[DUMMY] Butuh bantuan %s #%03d',
                        $category,
                        $i
                    ),

                    'category' => $category,
                    'urgency' => $urgencies[($i - 1) % 3],

                    'description' => sprintf(
                        'Mencari bantuan untuk pekerjaan kategori %s. %s',
                        $category,
                        fake()->paragraph(3)
                    ),

                    // Rp 25.000 sampai Rp 2.000.000.
                    'budget' => fake()->numberBetween(5, 400) * 5000,

                    'photos' => null,
                    'status' => 'open',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }

            DB::table('gigs')->insert($rows);

            $total += count($rows);
        }

        $this->command->info(
            "{$total} gig dummy berhasil ditambahkan."
        );
    }
}