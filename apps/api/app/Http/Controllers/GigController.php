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

        $search = mb_strtolower(trim((string) $request->query('search', '')));

        $sort = $request->query('sort', 'random');
        $seed = (int) $request->query('seed', 1);
        $selectedCategories = $request->input('categories', []);

        $query = Gig::with('user:id,fullName');

        // filter kategori
        if ($selectedCategories !== []) {
            $query->whereIn('category', $selectedCategories);
        }

        // filter judul
        if($search !== ''){
            $query->whereRaw(
                'LOCATE(?, LOWER(title)) > 0', 
                [$search]
            );
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
