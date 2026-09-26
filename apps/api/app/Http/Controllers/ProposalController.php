<?php

namespace App\Http\Controllers;

use App\Models\Gig;
use App\Models\Proposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        // HANYA BISA MELAMAR GIG YANG BERSTATUS OPEN
        if ($gig->status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'Gig ini sudah tidak menerima lamaran.',
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
        $proposals = Proposal::with(['gig.user:id,fullName'])
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

        $proposals = Proposal::with(['user:id,fullName,nim,gender'])
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
        $proposal = Proposal::with('gig')->findOrFail($id);
        $gig = $proposal->gig;

        abort_unless($gig->user_id === Auth::id(), 403, 'Akses ditolak.');

        if ($gig->status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'Gig ini sudah memiliki pelamar yang diterima.',
            ], 422);
        }

        // SET PROPOSAL DITERIMA
        $proposal->update(['status' => 'accepted']);

        // UBAH STATUS GIG JADI IN_PROGRESS
        $gig->update(['status' => 'in_progress']);

        // TOLAK OTOMATIS PROPOSAL LAINNYA
        Proposal::where('gig_id', $gig->id)
            ->where('id', '!=', $proposal->id)
            ->where('status', 'pending')
            ->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran berhasil diterima! Gig sekarang sedang berjalan.',
            'proposal' => $proposal,
        ]);
    }

    // PEMILIK GIG MENOLAK PELAMAR
    public function reject($id): JsonResponse
    {
        $proposal = Proposal::with('gig')->findOrFail($id);
        $gig = $proposal->gig;

        abort_unless($gig->user_id === Auth::id(), 403, 'Akses ditolak.');

        $proposal->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran berhasil ditolak.',
        ]);
    }
}
