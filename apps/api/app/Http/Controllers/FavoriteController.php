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

        $b2 = Storage::disk('b2');
        $legacyBase = rtrim(env('APP_URL', 'http://localhost:8000'), '/') . '/storage/';

        $resolveUrls = function (array $paths) use ($b2, $legacyBase): array {
            return collect($paths)
                ->filter(fn ($p) => is_string($p) && $p !== '')
                ->map(function ($path) use ($b2, $legacyBase) {
                    try {
                        return $b2->temporaryUrl($path, now()->addMinutes(10));
                    } catch (\Throwable) {
                        return $legacyBase . $path;
                    }
                })
                ->values()
                ->all();
        };

        $gigsWithUrls = $gigs->map(function ($gig) use ($resolveUrls) {
            $arr = $gig->toArray();
            $arr['photos_urls'] = $resolveUrls($gig->photos ?? []);
            return $arr;
        })->values();

        $jasasWithUrls = $jasas->map(function ($jasa) use ($resolveUrls) {
            $arr = $jasa->toArray();
            $arr['portfolio_urls'] = $resolveUrls($jasa->portfolio ?? []);
            return $arr;
        })->values();

        return response()->json([
            'success' => true,
            'gigs' => $gigsWithUrls,
            'jasas' => $jasasWithUrls,
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
