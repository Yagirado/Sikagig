<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SecureProofFiles extends Command
{
    protected $signature = 'proofs:secure {--apply : Move proof files to private storage and remove public copies}';

    protected $description = 'Move existing proof files from public to private storage';

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $paths = $public->allFiles('proofs');

        if ($paths === []) {
            $this->info('Tidak ada file bukti di disk public.');

            return self::SUCCESS;
        }

        $apply = (bool) $this->option('apply');
        $moved = 0;
        $skipped = 0;

        foreach ($paths as $path) {
            if (! str_starts_with($path, 'proofs/') || str_contains($path, '..')) {
                $this->warn("Lewati path yang tidak aman: {$path}");
                $skipped++;

                continue;
            }

            $publicContents = $public->get($path);
            $publicHash = hash('sha256', $publicContents);

            if ($private->exists($path)) {
                $privateHash = hash('sha256', $private->get($path));

                if (! hash_equals($privateHash, $publicHash)) {
                    $this->warn("Konflik file; salinan public dibiarkan: {$path}");
                    $skipped++;

                    continue;
                }

                if ($apply) {
                    if (! $public->delete($path)) {
                        $this->error("Gagal menghapus salinan public: {$path}");
                        $skipped++;

                        continue;
                    }
                }

                $this->line($apply ? "Public copy dihapus: {$path}" : "Akan hapus public copy: {$path}");
                $moved++;

                continue;
            }

            if (! $apply) {
                $this->line("Akan dipindahkan: {$path}");
                $moved++;

                continue;
            }

            if (! $private->put($path, $publicContents)) {
                $this->error("Gagal menyalin file: {$path}");
                $skipped++;

                continue;
            }

            $privateHash = hash('sha256', $private->get($path));
            if (! hash_equals($publicHash, $privateHash)) {
                $this->error("Verifikasi salinan gagal; file public dipertahankan: {$path}");
                $skipped++;

                continue;
            }

            if (! $public->delete($path)) {
                $this->error("File sudah tersalin ke private, tetapi salinan public gagal dihapus: {$path}");
                $skipped++;

                continue;
            }

            $this->line("Dipindahkan ke private: {$path}");
            $moved++;
        }

        $this->info(($apply ? 'Selesai' : 'Dry-run selesai').": {$moved} file; {$skipped} dilewati.");

        return $skipped === 0 ? self::SUCCESS : self::FAILURE;
    }
}
