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

        // PROSES UPLOAD FOTO KALAU ADA (BISA MULTIPLE)
        // Laravel otomatis normalisasi 'photos[]' jadi key 'photos'
        $photoFiles = $request->file('photos') ?? [];
        if (!empty($photoFiles)) {
            $paths = [];
            foreach ((array) $photoFiles as $photo) {
                if ($photo && $photo->isValid()) {
                    $paths[] = $photo->store('gigs', 'public');
                }
            }
            if (!empty($paths)) {
                $data['photos'] = $paths;
            }
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
        $gig = Gig::with('user:id,fullName,nim,gender')->findOrFail($id);

        return response()->json(['success' => true, 'gig' => $gig]);
    }
}
