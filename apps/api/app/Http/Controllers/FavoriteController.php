<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Gig;
use App\Models\Jasa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    // AMBIL SEMUA FAVORIT SAYA
    public function index(): JsonResponse
    {
        $userId = Auth::id();
        $favorites = Favorite::where('user_id', $userId)->latest()->get();

        $gigIds = $favorites->where('type', 'gig')->pluck('target_id');
        $jasaIds = $favorites->where('type', 'jasa')->pluck('target_id');

        $gigs = Gig::with('user:id,fullName,nim,gender')
            ->whereIn('id', $gigIds)
            ->get();

        $jasas = Jasa::with('user:id,fullName,nim,gender')
            ->whereIn('id', $jasaIds)
            ->get();

        return response()->json([
            'success' => true,
            'gigs' => $gigs,
            'jasas' => $jasas,
        ]);
    }

    // CEK STATUS FAVORIT SUATU ITEM
    public function status(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:gig,jasa',
            'target_id' => 'required|integer',
        ]);

        $exists = Favorite::where('user_id', Auth::id())
            ->where('type', $request->query('type'))
            ->where('target_id', $request->query('target_id'))
            ->exists();

        return response()->json([
            'success' => true,
            'favorited' => $exists,
        ]);
    }

    // TOGGLE TAMBAH ATAU HAPUS FAVORIT
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:gig,jasa',
            'target_id' => 'required|integer',
        ]);

        $userId = Auth::id();
        $existing = Favorite::where('user_id', $userId)
            ->where('type', $validated['type'])
            ->where('target_id', $validated['target_id'])
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'favorited' => false,
                'message' => 'Dihapus dari favorit',
            ]);
        }

        Favorite::create([
            'user_id' => $userId,
            'type' => $validated['type'],
            'target_id' => $validated['target_id'],
        ]);

        return response()->json([
            'success' => true,
            'favorited' => true,
            'message' => 'Ditambahkan ke favorit',
        ]);
    }
}
