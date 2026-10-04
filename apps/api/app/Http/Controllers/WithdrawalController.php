<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Withdrawal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WithdrawalController extends Controller
{
    private const EWALLETS = ['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'];

    private const BANKS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga', 'Permata', 'BSI'];

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'withdrawals' => $request->user()->withdrawals()
                ->latest()
                ->limit(50)
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'destination_number' => preg_replace('/[\s-]+/', '', (string) $request->input('destination_number')),
        ]);

        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:10000'],
            'destination_type' => ['required', Rule::in(['ewallet', 'bank'])],
            'provider' => ['required', 'string', 'max:50'],
            'account_name' => ['required', 'string', 'min:2', 'max:100'],
            'destination_number' => ['required', 'string', 'max:30'],
        ], [
            'amount.min' => 'Minimal tarik dana Rp 10.000.',
            'destination_number.required' => 'Nomor tujuan wajib diisi.',
        ]);

        $providers = $data['destination_type'] === 'bank' ? self::BANKS : self::EWALLETS;
        if (!in_array($data['provider'], $providers, true)) {
            return response()->json(['message' => 'Penyedia dana tidak valid.'], 422);
        }

        $numberIsValid = $data['destination_type'] === 'bank'
            ? (bool) preg_match('/^[0-9]{8,30}$/', $data['destination_number'])
            : (bool) preg_match('/^\+?[0-9]{8,20}$/', $data['destination_number']);

        if (!$numberIsValid) {
            return response()->json([
                'message' => $data['destination_type'] === 'bank'
                    ? 'Nomor rekening harus terdiri dari 8–30 digit.'
                    : 'Nomor telepon e-wallet harus terdiri dari 8–20 digit.',
            ], 422);
        }

        $withdrawal = DB::transaction(function () use ($request, $data) {
            $wallet = Wallet::where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->first();

            if (!$wallet || $wallet->balance < $data['amount']) {
                abort(response()->json(['message' => 'Saldo wallet tidak mencukupi.'], 422));
            }

            $wallet->decrement('balance', $data['amount']);

            return Withdrawal::create([
                ...$data,
                'user_id' => $request->user()->id,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Permintaan tarik dana berhasil dibuat.',
            'withdrawal' => $withdrawal,
        ], 201);
    }
}
