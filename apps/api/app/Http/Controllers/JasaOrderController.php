<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Escrow;
use App\Models\Jasa;
use App\Models\JasaOrder;
use App\Models\Conversation;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JasaOrderController extends Controller
{
    // BUAT ORDER JASA BARU
    public function store(Request $request, $jasaId): JsonResponse
    {
        $jasa = Jasa::findOrFail($jasaId);

        // TIDAK BISA ORDER JASA SENDIRI
        if ($jasa->user_id === Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu tidak bisa memesan jasamu sendiri.',
            ], 422);
        }

        $validated = $request->validate([
            'package_name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'brief_notes' => 'nullable|string|max:3000',
        ]);

        $wallet = Wallet::where('user_id', Auth::id())->first();
        $price = (int) round((float) $validated['price']);

        abort_unless(
            $wallet && $wallet->balance >= $price,
            422,
            'Saldo wallet tidak mencukupi untuk memesan jasa ini. Silakan top up terlebih dahulu.'
        );

        $order = JasaOrder::create([
            'jasa_id' => $jasaId,
            'buyer_id' => Auth::id(),
            'seller_id' => $jasa->user_id,
            'package_name' => $validated['package_name'],
            'price' => $validated['price'],
            'brief_notes' => $validated['brief_notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan jasa berhasil dibuat!',
            'order' => $order,
        ], 201);
    }

    // AMBIL DAFTAR PESANAN YANG SAYA BELI
    public function myOrders(): JsonResponse
    {
        $orders = JasaOrder::with(['jasa', 'seller:id,fullName'])
            ->where('buyer_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    // AMBIL DAFTAR PESANAN YANG MASUK KE JASA SAYA
    public function receivedOrders(): JsonResponse
    {
        $orders = JasaOrder::with(['jasa', 'buyer:id,fullName,nim'])
            ->where('seller_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    // AMBIL DAFTAR PESANAN UNTUK SATU JASA (HANYA PEMILIK JASA)
    public function jasaOrders($jasaId): JsonResponse
    {
        $jasa = Jasa::findOrFail($jasaId);

        abort_unless((int) $jasa->user_id === (int) Auth::id(), 403, 'Akses ditolak.');

        $orders = JasaOrder::with(['buyer:id,fullName,nim'])
            ->where('jasa_id', $jasaId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'jasa' => $jasa,
            'orders' => $orders,
        ]);
    }

    // UPDATE BRIEF / CATATAN PESANAN SAYA
    public function updateBrief(Request $request, $id): JsonResponse
    {
        $order = JasaOrder::where('buyer_id', Auth::id())->findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan pending yang catatannya dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'brief_notes' => 'required|string|max:3000',
        ]);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catatan pesanan berhasil diperbarui.',
            'order' => $order,
        ]);
    }

    // BATALKAN PESANAN (HANYA JIKA STATUS PENDING)
    public function cancelOrder($id): JsonResponse
    {
        $order = JasaOrder::where('buyer_id', Auth::id())->findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan yang sedang dikerjakan tidak dapat dibatalkan langsung.',
            ], 422);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan.',
        ]);
    }

    public function accept(Request $request, JasaOrder $order): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $order) {
            $order = JasaOrder::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $order->seller_id === (int) $request->user()->id,
                403,
                'Hanya penjual yang dapat menerima pesanan.'
            );

            abort_unless(
                $order->status === 'pending',
                422,
                'Pesanan sudah diproses.'
            );

            $order->update([
                'status' => 'awaiting_payment',
            ]);

            $escrow = Escrow::create([
                'jasa_order_id' => $order->id,
                'client_id' => $order->buyer_id,
                'worker_id' => $order->seller_id,
                'amount' => (int) round((float) $order->price),
                'status' => 'awaiting_payment',
            ]);

            $conversation = Conversation::firstOrCreate(
                ['jasa_order_id' => $order->id],
                [
                    'client_id' => $order->buyer_id,
                    'worker_id' => $order->seller_id,
                ],
            );

            return [
                'order' => $order,
                'escrow' => $escrow,
                'conversation_id' => $conversation->id,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan diterima. Menunggu pembayaran client.',
            ...$result,
        ]);
    }

    // UPDATE PROGRES PENGERJAAN OLEH PENJUAL
    public function updateProgress(Request $request, $id): JsonResponse
    {
        $order = JasaOrder::where('seller_id', Auth::id())->findOrFail($id);

        if (!in_array($order->status, ['in_progress', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan yang sedang berjalan yang dapat diupdate progresnya.',
            ], 422);
        }

        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'progress_notes' => 'nullable|string|max:500',
        ]);

        $updateData = [
            'progress' => $validated['progress'],
            'progress_notes' => $validated['progress_notes'] ?? null,
        ];

        // JIKA PROGRES 100%, OTOMATIS JADI COMPLETED
        if ($validated['progress'] === 100) {
            $updateData['status'] = 'completed';
        } elseif ($order->status === 'completed' && $validated['progress'] < 100) {
            $updateData['status'] = 'in_progress';
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Progres pesanan berhasil diperbarui.',
            'order' => $order,
        ]);
    }
}
