<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGigRequest;
use App\Models\Gig;
use App\Models\User;
use App\Notifications\NewListingPosted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class GigController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:255',
            'categories' => 'sometimes|array|max:13',
            'categories.*' => 'required|string|max:255',
            'sort' => 'sometimes|string|in:random,newest,highest_paid',
            'page' => 'sometimes|integer|min:1',
            'seed' => 'sometimes|integer|min:1|max:2147483647',
        ]);

        $search = $request->string('search')->trim()->lower();

        $sort = $request->query('sort', 'random');
        $seed = (int) $request->query('seed', 1);
        $selectedCategories = $request->input('categories', []);

        $query = Gig::with('user:id,fullName');

        // filter kategori
        if ($selectedCategories !== []) {
            $query->whereIn('category', $selectedCategories);
        }

        // filter judul
        if ($search->isNotEmpty()) {
            $query->where('title', 'like', "%{$search}%");
        }

        // hasil setelah filter diterapkan.
        switch($sort) {
            case 'newest':
                $query->latest()
                    ->orderByDesc('id');
                break;
            case 'highest_paid':
                $query->orderByDesc('budget')
                    ->latest()
                    ->orderByDesc('id');
                break;
            default:
                $query
                    ->orderByRaw(
                        "MD5(CONCAT(?, ':', gigs.id))",
                        [$seed]
                    )
                    ->orderBy('gigs.id');
                break;
        }

        $gigs = $query->simplePaginate(15);

        return Response()->json([
            'success' => true,
            'gigs' => $gigs->items(),
            'pagination' => [
                'current_page' => $gigs->currentPage(),
                'has_more' => $gigs->hasMorePages(),
                'next_page' => $gigs->hasMorePages() 
                    ? $gigs->currentPage() + 1
                    : null,
            ],
        ]);
    }

    public function store(StoreGigRequest $request): JsonResponse
    {
        // AMBIL DATA YANG SUDAH DIVALIDASI
        $data = $request->validated();

        // HUBUNGKAN DENGAN USER YANG SEDANG LOGIN
        $data['user_id'] = Auth::id();

        // CEK SALDO WALLET - HARUS CUKUP UNTUK BUDGET GIG
        $userBalance = $request->user()->wallet?->balance ?? 0;
        $gigBudget = (float) ($data['budget'] ?? 0);

        if ($userBalance < $gigBudget) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo tidak cukup untuk membuat gig ini.',
            ], 422);
        }

        // ATUR MAX_WORKERS BERDASARKAN MODE
        if (($data['mode'] ?? 'sendiri') === 'sendiri') {
            $data['max_workers'] = 1;
        } else {
            if (empty($data['max_workers']) || (int) $data['max_workers'] <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk mode Barengan, batas maksimal pekerja minimal 2 orang.',
                ], 422);
            }
            $data['max_workers'] = (int) $data['max_workers'];
        }

        // PROSES UPLOAD FOTO KALAU ADA (BISA MULTIPLE)
        if ($request->hasFile('photos')) {
            $data['photos'] = collect($request->file('photos'))
                ->filter(fn ($photo) => $photo && $photo->isValid())
                ->map(fn ($photo) => $photo->store('gigs', 'public'))
                ->values()
                ->all();
        }

        // SIMPAN KE DATABASE
        $gig = Gig::create($data);

        $recipients = User::query()
            ->whereKeyNot($gig->user_id)
            ->get();

        Notification::send(
            $recipients,
            new NewListingPosted(
                type: 'gig',
                listingId: $gig->id,
                title: $gig->title,
                authorName: Auth::user()->fullName ?? 'Seseorang',
            )
        );

        return response()->json([
            'success' => true,
            'message' => 'Gig berhasil dibuat!',
            'data' => $gig,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $gig = Gig::with([
                'user:id,fullName,nim,gender',
                'proposals' => fn ($q) => $q->where('status', 'accepted')->with('user:id,fullName,nim,gender'),
            ])
            ->withCount([
                'proposals',
                'proposals as accepted_count' => fn ($q) => $q->where('status', 'accepted'),
            ])
            ->findOrFail($id);

        return response()->json(['success' => true, 'gig' => $gig]);
    }

    // AMBIL SEMUA GIG MILIK SAYA
    public function myGigs(): JsonResponse
    {
        $gigs = Gig::withCount([
                'proposals',
                'proposals as accepted_count' => fn ($q) => $q->where('status', 'accepted'),
            ])
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json(['success' => true, 'gigs' => $gigs]);
    }

    // UPDATE GIG SAYA (HANYA JIKA STATUS MASIH OPEN)
    public function update(Request $request, $id): JsonResponse
    {
        $gig = Gig::where('user_id', Auth::id())->findOrFail($id);

        if ($gig->status !== 'open') {
            return response()->json(['success' => false, 'message' => 'Gig yang sudah berjalan tidak dapat diubah'], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'budget' => 'required|numeric|min:0',
            'urgency' => 'nullable|string',
            'deadline' => 'nullable|date',
            'mode' => 'nullable|string|in:sendiri,barengan',
            'max_workers' => 'nullable|integer|min:1|max:50',
        ]);

        if (($validated['mode'] ?? $gig->mode) === 'sendiri') {
            $validated['max_workers'] = 1;
        } else {
            if (isset($validated['max_workers']) && (int) $validated['max_workers'] <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk mode Barengan, batas maksimal pekerja minimal 2 orang.',
                ], 422);
            }
        }

        $gig->update($validated);

        return response()->json(['success' => true, 'message' => 'Gig berhasil diperbarui', 'gig' => $gig]);
    }

    // TOGGLE STATUS GIG (BUKA / TUTUP GIG)
    public function toggleStatus($id): JsonResponse
    {
        $gig = Gig::where('user_id', Auth::id())->findOrFail($id);
        $newStatus = $gig->status === 'closed' ? 'open' : 'closed';
        $gig->update(['status' => $newStatus]);

        // JIKA DITUTUP, OTOMATIS TOLAK SEMUA PROPOSAL YANG MASIH PENDING
        if ($newStatus === 'closed') {
            \App\Models\Proposal::where('gig_id', $gig->id)
                ->where('status', 'pending')
                ->update(['status' => 'rejected']);
        }

        return response()->json([
            'success' => true,
            'message' => $newStatus === 'closed' ? 'Gig berhasil ditutup.' : 'Gig dibuka kembali.',
            'status' => $newStatus,
            'gig' => $gig,
        ]);
    }

    // HAPUS GIG SAYA (HANYA JIKA STATUS MASIH OPEN)
    public function destroy($id): JsonResponse
    {
        $gig = Gig::where('user_id', Auth::id())->findOrFail($id);

        if ($gig->status !== 'open') {
            return response()->json(['success' => false, 'message' => 'Gig yang sudah berjalan tidak dapat dihapus'], 422);
        }

        $gig->delete();

        return response()->json(['success' => true, 'message' => 'Gig berhasil dihapus']);
    }
}

