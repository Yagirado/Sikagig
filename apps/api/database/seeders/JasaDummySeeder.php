<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JasaDummySeeder extends Seeder
{
    public function run(): void
    {
        $userIds = User::pluck('id')->all();

        if ($userIds === []) {
            $this->command?->error('Belum ada user. Buat akun terlebih dahulu.');

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
        $packageNames = ['Standar', 'Plus', 'Premium', 'Eksklusif'];
        $total = 0;
        $skipped = 0;

        DB::transaction(function () use ($userIds, $categories, $packageNames, &$total, &$skipped): void {
            // Nama dummy yang tetap mencegah duplikasi saat dijalankan ulang.
            $existingNames = array_fill_keys(
                DB::table('jasas')->where('name', 'like', '[DUMMY] Jasa %')->pluck('name')->all(),
                true
            );

            foreach ($categories as $category) {
                $rows = [];

                // Lebih dari tiga halaman per kategori (15 jasa per halaman).
                for ($i = 1; $i <= 50; $i++) {
                    $name = sprintf('[DUMMY] Jasa %s #%03d', $category, $i);

                    if (isset($existingNames[$name])) {
                        $skipped++;

                        continue;
                    }

                    $basePrice = fake()->numberBetween(5, 100) * 5000;
                    $packageCount = (($i - 1) % 4) + 1;
                    $packages = [];

                    for ($p = 0; $p < $packageCount; $p++) {
                        $packages[] = [
                            'id' => $p + 1,
                            'nama' => 'Paket '.$packageNames[$p],
                            'deskripsi' => sprintf('Layanan %s dengan cakupan paket %s.', $category, $packageNames[$p]),
                            'harga' => $basePrice * ($p + 1),
                            'estimasi' => ($p + 1).' hari kerja',
                            'revisi' => $p,
                            'termasukList' => ['Konsultasi kebutuhan', 'Pengerjaan sesuai kesepakatan'],
                            'tampilkan' => true,
                        ];
                    }

                    // Paket termurah tidak selalu berada pada posisi pertama.
                    if ($i % 2 === 0) {
                        $packages = array_reverse($packages);
                    }

                    $createdAt = fake()->dateTimeBetween('-60 days', 'now')->format('Y-m-d H:i:s');

                    $rows[] = [
                        'user_id' => fake()->randomElement($userIds),
                        'name' => $name,
                        'category' => $category,
                        'price' => min(array_column($packages, 'harga')),
                        'description' => sprintf('Menawarkan layanan %s untuk kebutuhan harian dan kegiatan kampus. Data dummy untuk pengujian pencarian, filter, dan pilihan paket.', $category),
                        'brief_requirements' => 'Jelaskan kebutuhan, tenggat waktu, dan referensi yang diperlukan.',
                        'portfolio' => null,
                        'packages' => json_encode($packages, JSON_THROW_ON_ERROR),
                        'status' => 'active',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }

                if ($rows !== []) {
                    DB::table('jasas')->insert($rows);
                    $total += count($rows);
                }
            }
        });

        $this->command?->info("{$total} jasa dummy ditambahkan; {$skipped} data yang sudah ada dilewati.");
    }
}
