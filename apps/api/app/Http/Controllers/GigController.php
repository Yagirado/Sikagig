<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGigRequest;
use App\Models\Gig;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GigController extends Controller
{
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Gig::with('user:id,fullName');

        if ($request->query('sort') === 'newest') {
            $query->latest();
        } else {
            // JIKA REKOMENDASI (RANDOM)
            $query->inRandomOrder();
        }

        $gigs = $query->limit(10)->get();
        
        return response()->json(['success' => true, 'gigs' => $gigs]);
    }
    public function store(StoreGigRequest $request): JsonResponse
    {
        // AMBIL DATA YANG SUDAH DIVALIDASI
        $data = $request->validated();
        
        // HUBUNGKAN DENGAN USER YANG SEDANG LOGIN
        $data['user_id'] = Auth::id();

        // PROSES UPLOAD FOTO KALAU ADA
        if ($request->hasFile('photos')) {
            $path = $request->file('photos')->store('gigs', 'public');
            $data['photos'] = $path;
        }

        // SIMPAN KE DATABASE
        $gig = Gig::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Gig berhasil dibuat!',
            'data' => $gig
        ], 201);
    }
}
