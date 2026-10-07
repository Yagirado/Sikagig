<?php

namespace App\Http\Controllers;

use App\Models\Gig;
use App\Models\Jasa;
use App\Models\JasaRating;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserProfileController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $user = User::query()
            ->select(['id', 'fullName'])
            ->findOrFail($id);

        $gigs = Gig::query()
            ->where('user_id', $user->id)
            ->where('title', 'not like', '%[DUMMY]%')
            ->latest()
            ->limit(5)
            ->get(['id', 'user_id', 'title', 'category', 'description', 'budget', 'mode', 'status', 'created_at']);

        $jasas = Jasa::query()
            ->select(['id', 'user_id', 'name', 'category', 'description', 'price', 'created_at'])
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('name', 'not like', '%[DUMMY]%')
            ->withAvg('ratings as rating_average', 'score')
            ->withCount('ratings as rating_count')
            ->latest()
            ->limit(5)
            ->get();

        $reviews = JasaRating::query()
            ->with(['user:id,fullName', 'jasa:id,user_id,name'])
            ->whereHas('jasa', fn($query) => $query->where('user_id', $user->id))
            ->latest()
            ->limit(5)
            ->get(['id', 'jasa_id', 'user_id', 'score', 'created_at']);

        return response()->json([
            'success' => true,
            'user' => $user,
            'gigs' => $gigs,
            'jasas' => $jasas,
            'reviews' => $reviews,
        ]);
    }
}
