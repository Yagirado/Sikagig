<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Notifications\WithdrawalProcessed;
use App\Services\TelegramService;
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

        $message = "*PENARIKAN DANA BARU!*\n\n"
            . "*User:* {$request->user()->fullName}\n"
            . "*Tujuan:* {$withdrawal->provider} - {$withdrawal->destination_number}\n"
            . "*Atas nama:* {$withdrawal->account_name}\n"
            . "*Nominal:* Rp ".number_format($withdrawal->amount, 0, ',', '.')."\n\n"
            . 'Silakan periksa Dashboard Admin Sikagig.';

        TelegramService::sendNotification($message);

        return response()->json([
            'message' => 'Permintaan tarik dana berhasil dibuat.',
            'withdrawal' => $withdrawal,
        ], 201);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'withdrawals' => Withdrawal::with('user:id,fullName,email')
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function process(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $this->ensureAdmin($request);

        $withdrawal = DB::transaction(function () use ($withdrawal) {
            $withdrawal = Withdrawal::lockForUpdate()->findOrFail($withdrawal->id);
            abort_unless($withdrawal->status === 'pending', 422, 'Permintaan ini sudah diproses.');

            $withdrawal->update([
                'status' => 'processed',
                'processed_at' => now(),
            ]);

            return $withdrawal->fresh();
        });

        $withdrawal->user->notify(new WithdrawalProcessed($withdrawal));

        return response()->json([
            'message' => 'Penarikan ditandai berhasil dicairkan.',
            'withdrawal' => $withdrawal,
        ]);
    }

    public function reject(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $this->ensureAdmin($request);

        $withdrawal = DB::transaction(function () use ($withdrawal) {
            $withdrawal = Withdrawal::lockForUpdate()->findOrFail($withdrawal->id);
            abort_unless($withdrawal->status === 'pending', 422, 'Permintaan ini sudah diproses.');

            $wallet = Wallet::where('user_id', $withdrawal->user_id)
                ->lockForUpdate()
                ->firstOrFail();
            $wallet->increment('balance', $withdrawal->amount);

            $withdrawal->update([
                'status' => 'rejected',
                'processed_at' => now(),
            ]);

            return $withdrawal->fresh();
        });

        return response()->json([
            'message' => 'Penarikan ditolak dan saldo pengguna dikembalikan.',
            'withdrawal' => $withdrawal,
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()->is_admin, 403, 'Hanya admin yang dapat memproses penarikan.');
    }
}
