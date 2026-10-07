<?php

namespace App\Http\Controllers;

use App\Models\Topup;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MidtransController extends Controller
{
    public function createTopup(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'amount' => ['required', 'integer', 'min:10000', 'max:10000000'],
            ],
            [
                'amount.required' => 'Nominal top up wajib diisi.',
                'amount.integer' => 'Nominal top up wajib berupa angka.',
                'amount.min' => 'Minimal top up Rp 10.000',
                'amount.max' => 'Maksimal top up Rp 10.000.000',
            ]
        );

        $user = $request->user();
        $amount = $data['amount'];

        $orderId = 'TOPUP-' . $user->id . '-' . Str::upper(Str::random(16));

        $topup = Topup::create([
            'user_id' => $user->id,
            'merchant_order_id' => $orderId,
            'amount' => $amount,
            'payment_method' => 'snap',
            'status' => 'pending',
            'expires_at' => now()->addMinutes(30),
        ]);

        $response = Http::withBasicAuth(
            config('services.midtrans.server_key'),
            ''
        )
            ->acceptJson()
            ->post(config('services.midtrans.snap_url'), [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $amount,
                ],
                'item_details' => [
                    [
                        'id' => 'TOPUP',
                        'price' => $amount,
                        'quantity' => 1,
                        'name' => 'Top Up Wallet Sikagig',
                    ],
                ],
                'customer_details' => [
                    'first_name' => $user->fullName ?? 'User Sikagig',
                    'email' => $user->email,
                    'phone' => $user->phone ?? '081234567890',
                ],
                'callbacks' => [
                    'finish' => config('services.midtrans.frontend_url')
                        . '/profile?topup=' . $orderId,
                ],
                'expiry' => [
                    'unit' => 'minutes',
                    'duration' => 30,
                ],
            ]);

        if ($response->failed()) {
            $topup->update(['status' => 'failed']);

            return response()->json([
                'message' => 'Midtrans gagal membuat pembayaran.',
                'midtrans' => $response->json(),
            ], 502);
        }

        $result = $response->json();

        $topup->update([
            'provider_reference' => $result['token'] ?? null,
            'payment_url' => $result['redirect_url'] ?? null,
        ]);

        return response()->json([
            'message' => 'Invoice pembayaran berhasil dibuat.',
            'order_id' => $topup->merchant_order_id,
            'amount' => $topup->amount,
            'token' => $result['token'] ?? null,
            'redirect_url' => $result['redirect_url'] ?? null,
        ], 201);
    }

    public function callback(Request $request)
    {
        $orderId = $request->input('order_id');
        $statusCode = (string) $request->input('status_code');
        $grossAmount = (string) $request->input('gross_amount');
        $signature = (string) $request->input('signature_key');

        $expectedSignature = hash(
            'sha512',
            $orderId . $statusCode . $grossAmount
                . config('services.midtrans.server_key')
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return response('Invalid signature', 403);
        }

        $topup = Topup::where('merchant_order_id', $orderId)->firstOrFail();

        $this->processStatus($topup, $request->all());

        return response('OK', 200);
    }

    private function processStatus(Topup $topup, array $data): void
    {
        DB::transaction(function () use ($topup, $data) {
            $topup = Topup::where('id', $topup->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($topup->status === 'paid') {
                return;
            }

            $grossAmount = (string) ($data['gross_amount'] ?? $topup->amount);
            if ((int) round((float) $grossAmount) !== $topup->amount) {
                throw new \RuntimeException('Nominal callback tidak sesuai.');
            }

            $transactionStatus = $data['transaction_status'] ?? null;
            $fraudStatus = $data['fraud_status'] ?? null;
            $transactionId = $data['transaction_id'] ?? null;

            if (
                in_array($transactionStatus, ['capture', 'settlement'], true)
                && ($fraudStatus === null || $fraudStatus === 'accept')
            ) {
                $wallet = Wallet::firstOrCreate(
                    ['user_id' => $topup->user_id],
                    ['balance' => 0]
                );

                $wallet->increment('balance', $topup->amount);

                $topup->update([
                    'status' => 'paid',
                    'provider_reference' => $transactionId ?? $topup->provider_reference,
                    'paid_at' => now(),
                ]);

                return;
            }

            if ($transactionStatus === 'pending') {
                $topup->update(['status' => 'pending']);
                return;
            }

            if ($transactionStatus === 'expire') {
                $topup->update(['status' => 'expired']);
                return;
            }

            if (in_array($transactionStatus, ['cancel', 'deny'], true)) {
                $topup->update(['status' => 'failed']);
            }
        });
    }

    private function syncFromMidtrans(Topup $topup): void
    {
        $statusBaseUrl = config('services.midtrans.status_base_url');

        if (!$statusBaseUrl) {
            return;
        }

        try {
            $response = Http::withBasicAuth(
                config('services.midtrans.server_key'),
                ''
            )
                ->acceptJson()
                ->connectTimeout(5)
                ->timeout(10)
                ->get($statusBaseUrl . '/' . $topup->merchant_order_id . '/status');
        } catch (\Illuminate\Http\Client\ConnectionException) {
            // Midtrans tidak reachable: biarkan status tetap pending,
            // sync akan dicoba lagi pada polling berikutnya.
            return;
        }

        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['transaction_status'])) {
                $this->processStatus($topup, $data);
            }
        }
    }

    public function topupStatus(
        Request $request,
        string $merchantOrderId
    ): JsonResponse {
        $topup = $request->user()
            ->topups()
            ->where('merchant_order_id', $merchantOrderId)
            ->firstOrFail();

        if ($topup->status === 'pending') {
            $this->syncFromMidtrans($topup);
            $topup->refresh();
        }

        if (
            $topup->status === 'pending'
            && $topup->expires_at?->isPast()
        ) {
            $topup->update([
                'status' => 'expired',
            ]);
        }

        return response()->json([
            'topup' => [
                'merchant_order_id' => $topup->merchant_order_id,
                'amount' => $topup->amount,
                'status' => $topup->status,
                'payment_url' => $topup->payment_url,
                'paid_at' => $topup->paid_at,
                'expires_at' => $topup->expires_at,
            ],
        ]);
    }

    public function topupHistory(Request $request): JsonResponse
    {
        $topups = $request->user()
            ->topups()
            ->latest('created_at')
            ->limit(50)
            ->get([
                'id',
                'merchant_order_id',
                'amount',
                'payment_method',
                'payment_url',
                'status',
                'paid_at',
                'created_at',
            ]);

        return response()->json([
            'topups' => $topups,
        ]);
    }
}