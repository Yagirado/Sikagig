<?php

namespace App\Services;

use App\Models\Escrow;
use App\Models\JasaOrder;
use App\Models\Proposal;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Storage;

class EscrowPayoutService
{
    /**
     * Release held escrow funds to the worker and, for gigs, the platform admin.
     * The caller must run this inside a database transaction.
     *
     * @return array<string, int>
     */
    public function release(Escrow $escrow): array
    {
        $this->assertWorkSubmitted($escrow);

        $grossAmount = (int) $escrow->amount;

        $platformUserId = config('services.platform.user_id');
        abort_unless(
            is_numeric($platformUserId) && (int) $platformUserId > 0,
            500,
            'PLATFORM_WALLET_USER_ID belum dikonfigurasi dengan benar.'
        );

        $platformUser = User::query()->find((int) $platformUserId);
        abort_unless(
            $platformUser && $platformUser->is_admin,
            500,
            'PLATFORM_WALLET_USER_ID harus menunjuk ke akun admin yang valid.'
        );
        abort_unless(
            (int) $platformUser->id !== (int) $escrow->worker_id,
            500,
            'Akun wallet platform tidak boleh sama dengan akun worker.'
        );

        $workerAmount = (int) round($grossAmount * 0.85);
        $commissionAmount = $grossAmount - $workerAmount;

        $walletUserIds = collect([$escrow->worker_id, $platformUser->id])
            ->filter()
            ->unique()
            ->sort()
            ->values();

        foreach ($walletUserIds as $userId) {
            Wallet::firstOrCreate(
                ['user_id' => $userId],
                ['balance' => 0]
            );
        }

        $wallets = Wallet::query()
            ->whereIn('user_id', $walletUserIds)
            ->orderBy('user_id')
            ->lockForUpdate()
            ->get()
            ->keyBy('user_id');

        $workerWallet = $wallets->get($escrow->worker_id);
        $workerWallet->increment('balance', $workerAmount);

        WalletTransaction::create([
            'user_id' => $escrow->worker_id,
            'escrow_id' => $escrow->id,
            'amount' => $workerAmount,
            'direction' => 'credit',
            'type' => $escrow->proposal_id ? 'gig_income' : 'jasa_income',
            'title' => $escrow->proposal_id ? 'Pendapatan Gig' : 'Pendapatan Jasa',
            'description' => 'Dana escrow telah dilepas setelah pekerjaan disetujui.',
        ]);

        $result = [
            'worker_amount' => $workerAmount,
            'worker_wallet_balance' => (int) $workerWallet->fresh()->balance,
        ];

        $platformWallet = $wallets->get($platformUser->id);
        $platformWallet->increment('balance', $commissionAmount);

        WalletTransaction::create([
            'user_id' => $platformUser->id,
            'escrow_id' => $escrow->id,
            'amount' => $commissionAmount,
            'direction' => 'credit',
            'type' => $escrow->proposal_id ? 'gig_commission' : 'jasa_commission',
            'title' => $escrow->proposal_id ? 'Komisi Gig' : 'Komisi Jasa',
            'description' => $escrow->proposal_id
                ? 'Komisi platform dari pekerjaan gig yang selesai.'
                : 'Komisi platform dari pekerjaan jasa yang selesai.',
        ]);

        $result['platform_commission'] = $commissionAmount;
        $result['admin_wallet_balance'] = (int) $platformWallet->fresh()->balance;

        return $result;
    }

    private function assertWorkSubmitted(Escrow $escrow): void
    {
        if ($escrow->proposal_id) {
            $work = Proposal::whereKey($escrow->proposal_id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                in_array($work->status, ['accepted', 'in_progress', 'completed'], true)
                && $work->submission_status === 'under_review',
                422,
                'Pekerjaan belum dikirim untuk ditinjau.'
            );
        } elseif ($escrow->jasa_order_id) {
            $work = JasaOrder::whereKey($escrow->jasa_order_id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                in_array($work->status, ['in_progress', 'completed'], true)
                && $work->submission_status === 'under_review',
                422,
                'Pekerjaan belum dikirim untuk ditinjau.'
            );
        } else {
            abort(422, 'Escrow tidak terhubung ke pekerjaan yang valid.');
        }

        $hasPrivateFile = is_string($work->proof_file)
            && str_starts_with($work->proof_file, 'proofs/')
            && Storage::disk('local')->exists($work->proof_file);
        $hasProofLink = is_string($work->proof_link)
            && trim($work->proof_link) !== '';

        abort_unless(
            $hasPrivateFile || $hasProofLink,
            422,
            'Bukti pekerjaan belum tersedia.'
        );
    }
}
