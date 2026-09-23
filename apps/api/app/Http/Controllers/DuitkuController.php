<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use App\Models\Topup;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DuitkuController extends Controller
{
    public function paymentMethods(): JsonResponse
    {
        $amount = 10000;
        $datetime = now()->format('Y-m-d H:i:s');

        $merchantCode = config('services.duitku.merchant_code');
        $apiKey = config('services.duitku.api_key');

        $signature = hash_hmac(
            'sha256',
            $merchantCode . $amount . $datetime,
            $apiKey
        );

        $response = Http::acceptJson()
            ->post(
                config('services.duitku.base_url')
                    . '/webapi/api/merchant/paymentmethod/getpaymentmethod',
                [
                    'merchantcode' => $merchantCode,
                    'amount' => $amount,
                    'datetime' => $datetime,
                    'signature' => $signature,
                ]
            );

        if ($response->failed()) {
            return response()->json([
                'message' => 'Gagal mengambil metode pembayaran Duitku.',
                'duitku' => $response->json(),
            ], $response->status());
        }

        $methods = collect($response->json('paymentFee', []))
            ->filter(fn (array $method) =>
                str_contains(strtoupper($method['paymentName'] ?? ''), 'QRIS')
            )
            ->values();

        return response()->json([
            'qris_methods' => $methods,
        ]);
    }
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
        $paymentMethod = 'SP';
        $merchantCode = config('services.duitku.merchant_code');
        $apiKey = config('services.duitku.api_key');

        $orderId = 'TOPUP-' . $user->id . '-' . Str::upper(Str::random(16));

        $topup = Topup::create([
            'user_id' => $user->id,
            'merchant_order_id' => $orderId,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(30),
        ]);

        $signature = hash_hmac(
            'sha256',
            $merchantCode . $orderId . $amount,
            $apiKey
        );

        $response = Http::acceptJson()->post(
            config('services.duitku.base_url')
                . '/webapi/api/merchant/v2/inquiry',
            [
                'merchantCode' => $merchantCode,
                'paymentAmount' => $amount,
                'paymentMethod' => $paymentMethod,
                'merchantOrderId' => $orderId,
                'productDetails' => 'Top Up Wallet Sikagig',
                'merchantUserInfo' => (string) $user->id,
                'customerVaName' => $user->fullName ?? 'User Sikagig',
                'email' => $user->email,
                'phoneNumber' => $user->phone ?? '081234567890',
                'callbackUrl' => config('app.url')
                    . '/api/payments/duitku/callback',
                'returnUrl' => config('services.duitku.frontend_url')
                    . '/profile?topup=' . $orderId,
                'expiryPeriod' => 30,
                'signature' => $signature,
            ]
        );

        if ($response->failed()) {
            $topup->update(['status' => 'failed']);

            return response()->json([
                'message' => 'Duitku gagal membuat pembayaran.',
                'duitku' => $response->json(),
            ], 502);
        }

        $result = $response->json();

        $topup->update([
            'duitku_reference' => $result['reference'] ?? null,
        ]);

        return response()->json([
            'message' => 'Invoice QRIS berhasil dibuat.',
            'order_id' => $topup->merchant_order_id,
            'amount' => $topup->amount,
            'payment_url' => $result['paymentUrl'],
        ], 201);
    }

    public function callback(Request $request)
    {
        $merchantCode = $request->input('merchantCode');
        $amount = $request->input('amount');
        $orderId = $request->input('merchantOrderId');
        $signature = $request->input('signature');

        $expectedSignature = hash_hmac(
            'sha256',
            $merchantCode . $amount . $orderId,
            config('services.duitku.api_key')
        );

        if (
            $merchantCode !== config('services.duitku.merchant_code')
            || !hash_equals($expectedSignature, (string) $signature)
        ) {
            return response('Invalid signature', 403);
        }

        DB::transaction(function () use ($request, $amount, $orderId) {
            $topup = Topup::where('merchant_order_id', $orderId)
                ->lockForUpdate()
                ->firstOrFail();

            // Callback yang sama bisa dikirim Duitku berulang kali.
            if ($topup->status === 'paid') {
                return;
            }

            if ($request->input('resultCode') !== '00') {
                $topup->update(['status' => 'failed']);
                return;
            }

            if ((int) $amount !== $topup->amount) {
                throw new \RuntimeException('Nominal callback tidak sesuai.');
            }

            $wallet = Wallet::firstOrCreate(
                ['user_id' => $topup->user_id],
                ['balance' => 0]
            );

            $wallet->increment('balance', $topup->amount);

            $topup->update([
                'status' => 'paid',
                'duitku_reference' => $request->input('reference'),
                'paid_at' => now(),
            ]);
        });

        return response('SUCCESS', 200);
    }

    public function topupStatus(
        Request $request,
        string $merchantOrderId
    ): JsonResponse {
        $topup = $request->user()
            ->topups()
            ->where('merchant_order_id', $merchantOrderId)
            ->firstOrFail();

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
                'status',
                'paid_at',
                'created_at',
            ]);

        return response()->json([
            'topups' => $topups,
        ]);
    }
}