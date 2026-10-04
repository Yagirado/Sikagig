<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Escrow;
use App\Models\Conversation;
use App\Models\Gig;
use App\Models\Proposal;
use App\Services\EscrowPayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    // KIRIM PROPOSAL / LAMAR GIG
    public function store(Request $request, $gigId): JsonResponse
    {
        $gig = Gig::findOrFail($gigId);

        // TIDAK BISA MELAMAR GIG SENDIRI
        if ($gig->user_id === Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu tidak bisa melamar Gig buatanmu sendiri.',
            ], 422);
        }

        // HANYA BISA MELAMAR GIG YANG TIDAK DITUTUP
        if (!in_array($gig->status, ['open', 'awaiting_payment', 'in_progress'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Gig ini sudah tidak menerima lamaran.',
            ], 422);
        }

        $maxWorkers = $gig->mode === 'barengan' ? max(1, (int) ($gig->max_workers ?? 3)) : 1;
        $acceptedCount = Proposal::where('gig_id', $gigId)->where('status', 'accepted')->count();

        if ($acceptedCount >= $maxWorkers) {
            return response()->json([
                'success' => false,
                'message' => 'Kuota pekerja untuk Gig ini sudah penuh.',
            ], 422);
        }

        // CEK APAKAH SUDAH PERNAH MELAMAR
        $existing = Proposal::where('gig_id', $gigId)
            ->where('user_id', Auth::id())
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu sudah pernah mengajukan penawaran untuk Gig ini.',
            ], 422);
        }

        $validated = $request->validate([
            'cover_letter' => 'required|string|max:2000',
            'bid_amount' => 'required|numeric|min:1000',
        ]);

        $proposal = Proposal::create([
            'gig_id' => $gigId,
            'user_id' => Auth::id(),
            'cover_letter' => $validated['cover_letter'],
            'bid_amount' => $validated['bid_amount'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran berhasil dikirim!',
            'proposal' => $proposal,
        ], 201);
    }

    // AMBIL DAFTAR GIG YANG SAYA AJUKAN
    public function myProposals(): JsonResponse
    {
        $proposals = Proposal::with(['gig.user:id,fullName', 'conversation:id,proposal_id', 'user:id,fullName,NIM,gender'])
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'proposals' => $proposals,
        ]);
    }

    // AMBIL DAFTAR PELAMAR UNTUK SATU GIG (HANYA PEMILIK GIG)
    public function gigProposals($gigId): JsonResponse
    {
        $gig = Gig::findOrFail($gigId);

        abort_unless($gig->user_id === Auth::id(), 403, 'Akses ditolak.');

        $proposals = Proposal::with(['user:id,fullName,NIM,gender', 'conversation:id,proposal_id'])
            ->where('gig_id', $gigId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'gig' => $gig,
            'proposals' => $proposals,
        ]);
    }

    // UPDATE PENAWARAN (HANYA JIKA STATUS PENDING)
    public function update(Request $request, $id): JsonResponse
    {
        $proposal = Proposal::where('user_id', Auth::id())->findOrFail($id);

        if ($proposal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Penawaran yang sudah diproses tidak dapat diubah.',
            ], 422);
        }

        $validated = $request->validate([
            'cover_letter' => 'required|string|max:2000',
            'bid_amount' => 'required|numeric|min:1000',
        ]);

        $proposal->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran berhasil diperbarui.',
            'proposal' => $proposal,
        ]);
    }

    // TARIK / BATALKAN LAMARAN (HANYA JIKA STATUS PENDING)
    public function withdraw($id): JsonResponse
    {
        $proposal = Proposal::where('user_id', Auth::id())->findOrFail($id);

        if ($proposal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya penawaran yang berstatus pending yang dapat ditarik.',
            ], 422);
        }

        $proposal->update(['status' => 'withdrawn']);

        return response()->json([
            'success' => true,
            'message' => 'Lamaran berhasil ditarik.',
        ]);
    }

    // PEMILIK GIG MENERIMA PELAMAR
    public function accept($id): JsonResponse
    {
        $proposal = Proposal::findOrFail($id);

        $result = DB::transaction(function () use ($proposal) {
            $gig = Gig::whereKey($proposal->gig_id)
                ->lockForUpdate()
                ->firstOrFail();
                
            abort_unless((int) $gig->user_id === (int) Auth::id(), 403, 'Akses ditolak.');
            
            $proposal = Proposal::whereKey($proposal->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $proposal->status === 'pending'
                && in_array($gig->status, ['open', 'awaiting_payment', 'in_progress'], true),
                422,
                'Proposal sudah diproses atau Gig sudah ditutup.'
            );

            $maxWorkers = $gig->mode === 'barengan' ? max(1, (int) ($gig->max_workers ?? 3)) : 1;
            $currentAccepted = Proposal::where('gig_id', $gig->id)->where('status', 'accepted')->count();

            abort_unless(
                $currentAccepted < $maxWorkers,
                422,
                "Kuota pekerja untuk Gig ini sudah penuh ({$currentAccepted}/{$maxWorkers} pekerja diterima)."
            );

            $wallet = Wallet::where('user_id', $gig->user_id)->first();

            abort_unless(
                $wallet && $wallet->balance >= (int) round((float) $proposal->bid_amount),
                422,
                'Saldo wallet tidak mencukupi untuk menerima proposal ini. Silakan top up terlebih dahulu.'
            );

            $proposal->update(['status' => 'accepted']);
            $newAcceptedCount = $currentAccepted + 1;

            // Jika mode sendiri ATAU kuota pekerja barengan sudah tercapai
            if ($gig->mode === 'sendiri' || empty($gig->mode) || $newAcceptedCount >= $maxWorkers) {
                if ($gig->status === 'open') {
                    $gig->update(['status' => 'awaiting_payment']);
                }
                // Tolak sisa pelamar yang masih pending
                Proposal::where('gig_id', $gig->id)
                    ->where('id', '!=', $proposal->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'rejected']);
            } else {
                // Masih ada sisa kuota lowongan pekerja barengan
                if ($gig->status === 'open') {
                    $gig->update(['status' => 'awaiting_payment']);
                }
            }

            $escrow = Escrow::create([
                'proposal_id' => $proposal->id,
                'client_id' => $gig->user_id,
                'worker_id' => $proposal->user_id,
                'amount' => (int) round((float) $proposal->bid_amount),
                'status' => 'awaiting_payment',
            ]);

            $conversation = Conversation::firstOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'client_id' => $gig->user_id,
                    'worker_id' => $proposal->user_id,
                ]
            );

            return [
                'proposal' => $proposal,
                'escrow' => $escrow,
                'conversation_id' => $conversation->id,
                'accepted_count' => $newAcceptedCount,
                'max_workers' => $maxWorkers,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Proposal diterima. Menunggu pembayaran client.',
            ...$result,
        ]);
    }

    // PEMILIK GIG MENOLAK PELAMAR
    public function reject($id): JsonResponse
    {
        $proposal = Proposal::findOrFail($id);

        DB::transaction(function () use ($proposal) {
            $gig = Gig::whereKey($proposal->gig_id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $gig->user_id === (int) Auth::id(),
                403,
                'Akses ditolak.'
            );

            $proposal = Proposal::whereKey($proposal->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $proposal->status === 'pending',
                422,
                'Hanya penawaran yang berstatus pending yang dapat ditolak.'
            );

            $proposal->update(['status' => 'rejected']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Penawaran berhasil ditolak.',
        ]);
    }

    // UPDATE PROGRES PENGERJAAN GIG OLEH PEKERJA
    public function updateProgress(Request $request, $id): JsonResponse
    {
        $proposal = Proposal::where('user_id', Auth::id())->findOrFail($id);

        if (!in_array($proposal->status, ['accepted', 'in_progress', 'completed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya lamaran yang telah diterima yang dapat diperbarui progresnya.',
            ], 422);
        }

        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'progress_notes' => 'nullable|string|max:500',
        ]);

        $proposal->update([
            'progress' => $validated['progress'],
            'progress_notes' => $validated['progress_notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Progres pengerjaan berhasil diperbarui!',
            'proposal' => $proposal,
        ]);
    }

    // SUBMIT BUKTI PEKERJAAN OLEH PEKERJA GIG
    public function submitProof(Request $request, $id): JsonResponse
    {
        $proposal = Proposal::where('user_id', Auth::id())->findOrFail($id);

        if (!in_array($proposal->status, ['accepted', 'in_progress', 'completed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya lamaran yang telah diterima yang dapat mengirimkan bukti tugas.',
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

        $proofFilePath = $proposal->proof_file;
        if ($request->hasFile('proof_file')) {
            $proofFilePath = $request->file('proof_file')->store('proofs', 'public');
        }

        $proposal->update([
            'student_name' => $validated['student_name'] ?? $proposal->student_name ?? Auth::user()->fullName,
            'student_nim' => $validated['student_nim'] ?? $proposal->student_nim ?? (Auth::user()->NIM ?? Auth::user()->nim),
            'student_phone' => $validated['student_phone'] ?? $proposal->student_phone,
            'proof_notes' => $validated['proof_notes'] ?? $proposal->proof_notes,
            'proof_link' => $validated['proof_link'] ?? $proposal->proof_link,
            'proof_file' => $proofFilePath,
            'submission_status' => 'under_review',
            'progress' => 100,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti tugas berhasil dikirim dan sedang dalam tahap review oleh pemilik Gig!',
            'proposal' => $proposal->fresh(),
        ]);
    }

    // PEMILIK GIG MENYETUJUI HASIL PEKERJAAN (APPROVE & SELESAI)
    public function approveSubmission(
        Request $request,
        $id,
        EscrowPayoutService $payoutService
    ): JsonResponse
    {
        $proposal = Proposal::with('gig')->findOrFail($id);
        $gig = $proposal->gig;

        abort_unless((int) $gig->user_id === (int) Auth::id(), 403, 'Hanya pemilik Gig yang dapat menyetujui hasil pekerjaan.');

        return DB::transaction(function () use ($proposal, $gig, $payoutService) {
            $proposal->update([
                'submission_status' => 'completed',
                'status' => 'completed',
                'progress' => 100,
            ]);

            // Cek apakah semua proposal di gig ini sudah selesai
            $pendingOrActive = Proposal::where('gig_id', $gig->id)
                ->whereIn('status', ['accepted', 'pending'])
                ->where('id', '!=', $proposal->id)
                ->count();

            if ($pendingOrActive === 0) {
                $gig->update(['status' => 'completed']);
            }

            // Release escrow jika ada
            $escrow = Escrow::where('proposal_id', $proposal->id)
                ->where('status', 'holding')
                ->lockForUpdate()
                ->first();

            $payout = null;
            if ($escrow) {
                $payout = $payoutService->release($escrow);

                $escrow->update([
                    'status' => 'released',
                    'released_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $payout
                    ? 'Pekerjaan disetujui. 85% dana masuk ke wallet freelancer dan 15% ke wallet platform.'
                    : 'Pekerjaan berhasil disetujui dan diselesaikan.',
                'proposal' => $proposal->fresh(),
                'payout' => $payout,
            ]);
        });
    }
}
