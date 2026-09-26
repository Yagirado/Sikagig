<?php

namespace App\Http\Controllers;

use App\Models\Jasa;
use App\Models\JasaOrder;
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
}
