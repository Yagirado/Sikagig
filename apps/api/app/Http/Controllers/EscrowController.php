<?php

namespace App\Http\Controllers;

use App\Models\Escrow;
use App\Models\EscrowPayment;
use App\Models\Gig;
use App\Models\JasaOrder;
use App\Models\Proposal;
use App\Models\Wallet;
use App\Services\EscrowPayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EscrowController extends Controller
{
    public function myEscrows(Request $request): JsonResponse
    {
        $role = $request->query('role', 'client');

        abort_unless(
            in_array($role, ['client', 'worker'], true),
            422,
            'Role escrow harus client atau worker.'
        );

        $ownerColumn = $role === 'client' ? 'client_id' : 'worker_id';

        $escrows = Escrow::query()
            ->where($ownerColumn, $request->user()->id)
            ->with([
                'proposal.gig:id,user_id,title,status',
                'jasaOrder.jasa:id,user_id,name,status',
                'client:id,fullName',
                'worker:id,fullName',
            ])
            ->latest()
            ->get();

        return response()->json([
            'escrows' => $escrows,
        ]);
    }
    public function show(Request $request, Escrow $escrow): JsonResponse
    {
        abort_unless(
            in_array($request->user()->id, [
                $escrow->client_id,
                $escrow->worker_id,
            ], true),
            403,
            'Kamu tidak memiliki akses ke escrow ini.'
        );

        $escrow->load([
            'proposal.gig:id,user_id,title,status',
            'jasaOrder.jasa:id,user_id,name,status',
            'client:id,fullName',
            'worker:id,fullName',
            'payments:id,escrow_id,payer_id,amount,method,status,paid_at,created_at',
        ]);

        return response()->json([
            'escrow' => $escrow,
        ]);
    }

    public function payWithWallet(
        Request $request,
        Escrow $escrow
    ): JsonResponse {
        $result = DB::transaction(function () use ($request, $escrow) {
            $escrow = Escrow::whereKey($escrow->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $escrow->client_id === (int) $request->user()->id,
                403,
                'Hanya client yang dapat membayar escrow.'
            );

            abort_unless(
                $escrow->status === 'awaiting_payment',
                422,
                'Escrow ini tidak dapat dibayar.'
            );

            $wallet = Wallet::where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->first();

            abort_unless(
                $wallet && $wallet->balance >= $escrow->amount,
                422,
                'Saldo wallet tidak mencukupi.'
            );

            $wallet->decrement('balance', $escrow->amount);

            $payment = EscrowPayment::create([
                'escrow_id' => $escrow->id,
                'payer_id' => $request->user()->id,
                'amount' => $escrow->amount,
                'method' => 'wallet',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $escrow->update([
                'payment_method' => 'wallet',
                'status' => 'holding',
                'held_at' => now(),
            ]);

            $this->startWork($escrow);

            return [
                'escrow' => $escrow->fresh(),
                'payment' => $payment,
                'wallet_balance' => $wallet->fresh()->balance,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil. Dana sedang ditahan di escrow.',
            ...$result,
        ]);
    }

    public function release(
        Request $request,
        Escrow $escrow,
        EscrowPayoutService $payoutService
    ): JsonResponse {
        $result = DB::transaction(function () use ($request, $escrow, $payoutService) {
            $escrow = Escrow::whereKey($escrow->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $escrow->client_id === (int) $request->user()->id,
                403,
                'Hanya client yang dapat melepaskan dana escrow.'
            );

            abort_unless(
                $escrow->status === 'holding',
                422,
                'Dana escrow belum dapat dilepaskan.'
            );

            $payout = $payoutService->release($escrow);

            $escrow->update([
                'status' => 'released',
                'released_at' => now(),
            ]);

            $this->completeWork($escrow);

            return [
                'escrow' => $escrow->fresh(),
                ...$payout,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => isset($result['platform_commission'])
                ? 'Dana escrow dibagi: 85% ke wallet freelancer dan 15% ke wallet platform.'
                : 'Dana escrow berhasil dilepas ke wallet freelancer.',
            ...$result,
        ]);
    }

    private function startWork(Escrow $escrow): void
    {
        if ($escrow->proposal_id) {
            $proposal = Proposal::whereKey($escrow->proposal_id)
                ->lockForUpdate()
                ->firstOrFail();

            Gig::whereKey($proposal->gig_id)
                ->where('status', 'awaiting_payment')
                ->update([
                    'status' => 'in_progress',
                ]);

            return;
        }

        if ($escrow->jasa_order_id) {
            JasaOrder::whereKey($escrow->jasa_order_id)
                ->where('status', 'awaiting_payment')
                ->update([
                    'status' => 'in_progress',
                ]);
        }
    }

    private function completeWork(Escrow $escrow): void
    {
        if ($escrow->proposal_id) {
            $proposal = Proposal::whereKey($escrow->proposal_id)
                ->lockForUpdate()
                ->firstOrFail();

            Gig::whereKey($proposal->gig_id)
                ->update([
                    'status' => 'completed',
                ]);

            return;
        }

        if ($escrow->jasa_order_id) {
            JasaOrder::whereKey($escrow->jasa_order_id)
                ->update([
                    'status' => 'completed',
                ]);
        }
    }
}
