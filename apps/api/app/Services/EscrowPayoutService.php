<?php

namespace App\Services;

use App\Models\Escrow;
use App\Models\User;
use App\Models\Wallet;

class EscrowPayoutService
{
    private const PLATFORM_ADMIN_EMAIL = 'nugrahadani@gmail.com';

    /**
     * Release held escrow funds to the worker and, for gigs, the platform admin.
     * The caller must run this inside a database transaction.
     *
     * @return array<string, int>
     */
    public function release(Escrow $escrow): array
    {
        $grossAmount = (int) $escrow->amount;
        $workerAmount = $grossAmount;
        $commissionAmount = 0;
        $admin = null;

        if ($escrow->proposal_id) {
            $admin = User::query()
                ->where('email', self::PLATFORM_ADMIN_EMAIL)
                ->first();

            abort_unless($admin, 500, 'Akun admin untuk menerima komisi tidak ditemukan.');

            $workerAmount = (int) round($grossAmount * 0.85);
            $commissionAmount = $grossAmount - $workerAmount;
        }

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

        $result = [
            'worker_amount' => $workerAmount,
            'worker_wallet_balance' => (int) $workerWallet->fresh()->balance,
        ];

        if ($admin) {
            $adminWallet = $wallets->get($admin->id);
            $adminWallet->increment('balance', $commissionAmount);

            $result['platform_commission'] = $commissionAmount;
            $result['admin_wallet_balance'] = (int) $adminWallet->fresh()->balance;
        }

        return $result;
    }
}
