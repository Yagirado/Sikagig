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
        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:10000', 'max:10000000'],
        ]);

        $user = $request->user();
        $amount = $data['amount'];
        $paymentMethod = 'SP'; // SHOPEEPAY QRIS
        $merchantCode = config('services.duitku.merchant_code');
        $apiKey = config('services.duitku.api_key');

        $orderId = 'TOPUP-' . $user->id . '-' . Str::upper(Str::random(16));

        $topup = Topup::create([
            'user_id' => $user->id,
            'merchant_order_id' => $orderId,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'status' => 'pending',
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
}