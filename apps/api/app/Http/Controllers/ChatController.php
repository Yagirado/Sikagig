<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Proposal;
use App\Models\JasaOrder;

class ChatController extends Controller
{
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        return response()->json(
            $conversation->messages()
                ->orderByDesc('id')
                ->cursorPaginate(50)
        );
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        $valideated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'message' => $valideated['message'],
        ]);

        $payload = $message->only([
            'id',
            'conversation_id',
            'sender_id',
            'message',
            'created_at',
        ]);

        $realtime = true;

        try {
            event(new MessageSent($payload));
        } catch (BroadcastException $exception) {
            report($exception);
            $realtime = false;
        }

        return response()->json([
            'message' => $payload,
            'realtime' => $realtime,
        ], 201);
    }

    public function index(Request $request): JsonResponse
{
    $userId = $request->user()->id;

    $conversations = Conversation::query()
        ->where(function ($query) use ($userId) {
            $query->where('client_id', $userId)
                ->orWhere('worker_id', $userId);
        })
        ->where(function ($query) {
            $query->where(function ($query) {
                $query->whereNull('jasa_order_id')
                    ->whereIn(
                        'proposal_id',
                        Proposal::select('id')
                            ->where('status', 'accepted')
                    );
            })->orWhere(function ($query) {
                $query->whereNull('proposal_id')
                    ->whereIn(
                        'jasa_order_id',
                        JasaOrder::select('id')
                            ->whereIn('status', [
                                'awaiting_payment',
                                'in_progress',
                                'completed',
                            ])
                    );
            });
        })
        ->orderByDesc('id')
        ->paginate(20);

    return response()->json($conversations);
    }
}
