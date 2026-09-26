<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJasaRequest;
use App\Models\Jasa;
use App\Models\User;
use App\Notifications\NewListingPosted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class JasaController extends Controller
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

        $search = mb_strtolower(
        trim((string) $request->query('search', ''))
        );

        $sort = $request->query('sort', 'random');
        $seed = (int) $request->query('seed', 1);
        $categories = $request->input('categories', []);

        $query = Jasa::query()
            ->with('user:id,fullName')
            ->where('status', 'active')
            ->withAvg('ratings as rating_average', 'score')
            ->withCount('ratings as rating_count');

        if ($categories !== []) {
            $query->whereIn('category', $categories);
        }

        // Judul jasa tersimpan di kolom name.
        if ($search !== '') {
            $query->whereRaw(
                'LOCATE(?, LOWER(name)) > 0',
                [$search]
            );
        }

        switch ($sort) {
            case 'newest':
                $query->latest()
                    ->orderByDesc('id');
                break;

            case 'highest_paid':
                // Untuk jasa, urutkan berdasarkan harga mulai.
                $query->orderByDesc('price')
                    ->latest()
                    ->orderByDesc('id');
                break;

            default:
                // Urutan acak tetap sama selama seed dan datanya sama.
                $query->orderByRaw(
                    "MD5(CONCAT(?, ':', jasas.id))",
                    [$seed]
                )->orderBy('jasas.id');
                break;
        }

        $jasas = $query->simplePaginate(15);

        return response()->json([
            'success' => true,
            'jasas' => $jasas->items(),
            'pagination' => [
                'current_page' => $jasas->currentPage(),
                'has_more' => $jasas->hasMorePages(),
                'next_page' => $jasas->hasMorePages()
                    ? $jasas->currentPage() + 1
                    : null,
            ],
        ]);
    }

    public function store(StoreJasaRequest $request): JsonResponse
    {
        // AMBIL DATA YANG SUDAH DIVALIDASI
        $data = $request->validated();
        $activePackages = collect($data['packages'])
            ->filter(fn(array $paket) => (bool) $paket['tampilkan'])
            ->map(function (array $paket) {
                $paket['harga'] = (int) $paket['harga'];
                $paket['tampilkan'] = true;

                $paket['revisi'] = isset($paket['revisi'])
                    && $paket['revisi'] !== ''
                        ? (int) $paket['revisi']
                        : null;

                return $paket;
            })
            ->values();

        if($activePackages->isEmpty()){
            throw \Illuminate\Validation\ValidationException::withMessages([
                'packages' => 'Minimal satu paket harus ditampilkan.',
            ]);
        }

        $data['packages'] = $activePackages->all();
        $data['price'] = $activePackages->min('harga');
        $data['user_id'] = $request->user()->id;

        // HUBUNGKAN DENGAN USER YANG SEDANG LOGIN
        $data['user_id'] = Auth::id();

        // PROSES UPLOAD FILE KALAU ADA (BISA MULTIPLE)
        if ($request->hasFile('portfolio')) {
            $paths = [];
            foreach ($request->file('portfolio') as $port) {
                $paths[] = $port->store('jasas', 'public');
            }
            $data['portfolio'] = $paths;
        }

        // SIMPAN KE DATABASE
        $jasa = Jasa::create($data);

        $recipients = User::query()
            ->whereKeyNot($jasa->user_id)
            ->get();

        Notification::send(
            $recipients,
            new NewListingPosted(
                type: 'jasa',
                listingId: $jasa->id,
                title: $jasa->name,
                authorName: Auth::user()->fullName ?? 'Seseorang',
            )
        );

        return response()->json([
            'success' => true,
            'message' => 'Jasa berhasil dibuat!',
            'data' => $jasa,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $jasa = Jasa::query()
            ->with('user:id,fullName,nim,gender')
            ->withAvg('ratings as rating_average', 'score')
            ->withCount('ratings as rating_count')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'jasa' => $jasa,
        ]);
    }
}
