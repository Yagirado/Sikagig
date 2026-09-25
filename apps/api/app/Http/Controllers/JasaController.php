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
        $query = Jasa::with('user:id,fullName');

        if ($request->query('sort') === 'newest') {
            $query->latest();
        } else {
            // JIKA REKOMENDASI (RANDOM)
            $query->inRandomOrder();
        }

        // AMBIL MAKSIMAL 10 JASA
        $jasas = $query->limit(10)->get();

        return response()->json(['success' => true, 'jasas' => $jasas]);
    }

    public function store(StoreJasaRequest $request): JsonResponse
    {
        // AMBIL DATA YANG SUDAH DIVALIDASI
        $data = $request->validated();

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

        // SIMPAN PACKAGES (KALAU STRING, JADIKAN ARRAY)
        if (isset($data['packages']) && is_string($data['packages'])) {
            $data['packages'] = json_decode($data['packages'], true);
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
        $jasa = Jasa::with('user:id,fullName,nim,gender')->findOrFail($id);

        return response()->json(['success' => true, 'jasa' => $jasa]);
    }
}
