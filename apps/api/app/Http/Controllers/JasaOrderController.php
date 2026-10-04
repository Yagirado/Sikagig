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
            'brief_notes' => 'nullable|string|max:3000',
        ]);

        $package = collect($jasa->packages ?? [])->first(
            fn ($package) => is_array($package)
                && ($package['nama'] ?? null) === $validated['package_name']
                && (bool) ($package['tampilkan'] ?? false)
        );

        if (! $package || ! is_numeric($package['harga'] ?? null) || $package['harga'] < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Paket jasa tidak tersedia.',
            ], 422);
        }

        // CEK SALDO WALLET - HARUS CUKUP UNTUK HARGA ORDER
        $userBalance = $request->user()->wallet?->balance ?? 0;
        $orderPrice = (int) $package['harga'];

        if ($userBalance < $orderPrice) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo tidak cukup untuk memesan jasa ini.',
            ], 422);
        }

        $order = JasaOrder::create([
            'jasa_id' => $jasaId,
            'buyer_id' => Auth::id(),
            'seller_id' => $jasa->user_id,
            'package_name' => $validated['package_name'],
            'price' => $orderPrice,
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
        $orders = JasaOrder::with(['jasa', 'seller:id,fullName', 'conversation:id,jasa_order_id'])
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
        $orders = JasaOrder::with(['jasa', 'buyer:id,fullName,nim', 'conversation:id,jasa_order_id'])
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

        $orders = JasaOrder::with(['buyer:id,fullName,nim', 'conversation:id,jasa_order_id'])
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

    // SUBMIT BUKTI PEKERJAAN OLEH PENJUAL JASA
    public function submitProof(Request $request, $id): JsonResponse
    {
        $order = JasaOrder::where('seller_id', Auth::id())->findOrFail($id);

        if (!in_array($order->status, ['in_progress', 'awaiting_payment', 'completed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan yang sedang berjalan yang dapat mengirimkan bukti tugas.',
            ], 422);
        }

        $validated = $request->validate([
            'student_name' => 'nullable|string|max:255',
            'student_nim' => 'nullable|string|max:50',
            'student_phone' => 'nullable|string|max:30',
            'proof_notes' => 'nullable|string|max:2000',
            'proof_link' => 'nullable|string|max:500',
            'proof_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf,zip,rar,doc,docx|max:10240',
        ]);

        $proofFilePath = $order->proof_file;
        if ($request->hasFile('proof_file')) {
            $proofFilePath = $request->file('proof_file')->store('proofs', 'public');
        }

        $order->update([
            'student_name' => $validated['student_name'] ?? $order->student_name ?? Auth::user()->fullName,
            'student_nim' => $validated['student_nim'] ?? $order->student_nim ?? Auth::user()->nim,
            'student_phone' => $validated['student_phone'] ?? $order->student_phone,
            'proof_notes' => $validated['proof_notes'] ?? $order->proof_notes,
            'proof_link' => $validated['proof_link'] ?? $order->proof_link,
            'proof_file' => $proofFilePath,
            'submission_status' => 'under_review',
            'progress' => 100,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti tugas berhasil dikirim dan sedang dalam tahap review oleh pembeli!',
            'order' => $order->fresh(),
        ]);
    }

    // PEMBELI JASA MENYETUJUI HASIL PEKERJAAN (APPROVE & SELESAI)
    public function approveSubmission(Request $request, $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $order = JasaOrder::whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $order->buyer_id === (int) $request->user()->id,
                403,
                'Hanya pembeli yang dapat menyetujui hasil pekerjaan.'
            );

            $order->update([
                'submission_status' => 'completed',
                'status' => 'completed',
                'progress' => 100,
            ]);

            // Release escrow jika ada
            $escrow = Escrow::where('jasa_order_id', $order->id)
                ->where('status', 'holding')
                ->lockForUpdate()
                ->first();

            if ($escrow) {
                $escrow->update([
                    'status' => 'released',
                    'released_at' => now(),
                ]);

                // Tambah saldo ke dompet penjual
                $sellerWallet = \App\Models\Wallet::firstOrCreate(
                    ['user_id' => $order->seller_id],
                    ['balance' => 0]
                );
                $sellerWallet = \App\Models\Wallet::whereKey($sellerWallet->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $sellerWallet->increment('balance', $escrow->amount);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pesanan jasa berhasil disetujui dan diselesaikan! Dana telah dilepas ke penjual.',
                'order' => $order->fresh(),
            ]);
        });
    }
}
