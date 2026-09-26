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
            $data['portfolio'] = collect($request->file('portfolio'))
                ->filter(fn ($port) => $port && $port->isValid())
                ->map(fn ($port) => $port->store('jasas', 'public'))
                ->values()
                ->all();
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

    // AMBIL SEMUA JASA MILIK SAYA
    public function myJasas(): JsonResponse
    {
        $jasas = Jasa::withCount('orders')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json(['success' => true, 'jasas' => $jasas]);
    }

    // UPDATE JASA SAYA
    public function update(Request $request, $id): JsonResponse
    {
        $jasa = Jasa::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'description' => 'required|string',
            'packages' => 'nullable',
        ]);

        if (isset($validated['packages']) && is_string($validated['packages'])) {
            $validated['packages'] = json_decode($validated['packages'], true);
        }

        $jasa->update($validated);

        return response()->json(['success' => true, 'message' => 'Jasa berhasil diperbarui', 'jasa' => $jasa]);
    }

    // TOGGLE STATUS JASA (AKTIF / NONAKTIF)
    public function toggleStatus($id): JsonResponse
    {
        $jasa = Jasa::where('user_id', Auth::id())->findOrFail($id);
        $newStatus = $jasa->status === 'active' ? 'inactive' : 'active';
        $jasa->update(['status' => $newStatus]);

        return response()->json(['success' => true, 'status' => $newStatus]);
    }

    // HAPUS JASA SAYA
    public function destroy($id): JsonResponse
    {
        $jasa = Jasa::where('user_id', Auth::id())->findOrFail($id);
        $jasa->delete();

        return response()->json(['success' => true, 'message' => 'Jasa berhasil dihapus']);
    }
}

