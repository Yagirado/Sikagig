<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJasaRequest;
use App\Models\Jasa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        // PROSES UPLOAD FILE KALAU ADA
        if ($request->hasFile('portfolio')) {
            $path = $request->file('portfolio')->store('jasas', 'public');
            $data['portfolio'] = $path;
        }

        // SIMPAN KE DATABASE
        $jasa = Jasa::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Jasa berhasil dibuat!',
            'data' => $jasa,
        ], 201);
    }
}
