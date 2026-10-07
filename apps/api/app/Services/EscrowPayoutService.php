<?php

namespace App\Services;

use App\Models\Escrow;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class EscrowPayoutService
{
    private const PLATFORM_ADMIN_EMAIL = 'nanda0834665@gmail.com';

    /**
     * Release held escrow funds to the worker and, for gigs, the platform admin.
     * The caller must run this inside a database transaction.
     *
     * @return array<string, int>
     */
    public function release(Escrow $escrow): array
    {
        $grossAmount = (int) $escrow->amount;

        $admin = User::query()
            ->where('email', self::PLATFORM_ADMIN_EMAIL)
            ->first();

        abort_unless($admin, 500, 'Akun admin untuk menerima komisi tidak ditemukan.');

        $workerAmount = (int) round($grossAmount * 0.85);
        $commissionAmount = $grossAmount - $workerAmount;

        $walletUserIds = collect([$escrow->worker_id, $admin?->id])
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

        if ($admin) {
            $adminWallet = $wallets->get($admin->id);
            $adminWallet->increment('balance', $commissionAmount);

            WalletTransaction::create([
                'user_id' => $admin->id,
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
            $result['admin_wallet_balance'] = (int) $adminWallet->fresh()->balance;
        }

        return $result;
    }
}
