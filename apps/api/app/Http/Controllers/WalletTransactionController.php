<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'transactions' => $request->user()
                ->walletTransactions()
                ->latest()
                ->get([
                    'id',
                    'escrow_id',
                    'amount',
                    'direction',
                    'type',
                    'title',
                    'description',
                    'created_at',
                ]),
        ]);
    }
}
