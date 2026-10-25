<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) ($request->query('per_page', 30)), 100);

        $transactions = $request->user()
            ->walletTransactions()
            ->latest()
            ->paginate($perPage, [
                'id',
                'escrow_id',
                'amount',
                'direction',
                'type',
                'title',
                'description',
                'created_at',
            ]);

        return response()->json([
            'transactions' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'has_more' => $transactions->hasMorePages(),
                'next_page' => $transactions->hasMorePages()
                    ? $transactions->currentPage() + 1
                    : null,
                'total' => $transactions->total(),
            ],
        ]);
    }
}
