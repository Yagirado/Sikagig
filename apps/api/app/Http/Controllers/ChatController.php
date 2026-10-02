<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\ChatMessageAttachment;
use App\Models\Conversation;
use App\Models\JasaOrder;
use App\Models\Proposal;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ChatController extends Controller
{
    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        $conversation->load([
            'client:id,fullName',
            'worker:id,fullName',
        ]);

        $otherUser = (int) $conversation->client_id === (int) $request->user()->id
            ? $conversation->worker
            : $conversation->client;

        return response()->json([
            'other_user' => $otherUser?->only(['id', 'fullName']),
        ]);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        $messages = $conversation->messages()
            ->with('attachments')
            ->orderByDesc('id')
            ->cursorPaginate(50)
            ->through(fn ($message) => $this->messagePayload($message));

        return response()->json($messages);
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
            'attachments' => ['sometimes', 'array', 'max:5'],
            'attachments.*' => [
                'required',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip',
            ],
        ]);

        $files = $request->file('attachments', []);
        $text = trim($validated['message'] ?? '');

        if ($text === '' && count($files) === 0) {
            return response()->json([
                'message' => 'Tulis pesan atau pilih setidaknya satu file.',
            ], 422);
        }

        $storedPaths = [];

        try {
            $message = DB::transaction(function () use (
                $conversation,
                $request,
                $files,
                $text,
                &$storedPaths
            ) {
                $message = $conversation->messages()->create([
                    'sender_id' => $request->user()->id,
                    'message' => $text === '' ? null : $text,
                ]);

                foreach ($files as $file) {
                    $path = $file->store('chat-attachments/'.$conversation->id, 'local');

                    if ($path === false) {
                        throw new \RuntimeException('File gagal disimpan.');
                    }

                    $storedPaths[] = $path;
                    $message->attachments()->create([
                        'disk' => 'local',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                        'size' => $file->getSize(),
                    ]);
                }

                return $message->load('attachments');
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        $payload = $this->messagePayload($message);

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

    public function downloadAttachment(
        Request $request,
        Conversation $conversation,
        ChatMessageAttachment $attachment
    ) {
        abort_unless(
            $conversation->canAccess($request->user()),
            403
        );

        abort_unless(
            (int) $attachment->message->conversation_id === (int) $conversation->id,
            404
        );

        $isImage = str_starts_with($attachment->mime_type, 'image/');

        return Storage::disk($attachment->disk)->response(
            $attachment->path,
            $attachment->original_name,
            [
                'Content-Type' => $attachment->mime_type,
                'X-Content-Type-Options' => 'nosniff',
            ],
            $isImage ? 'inline' : 'attachment'
        );
    }

    private function messagePayload($message): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'message' => $message->message,
            'created_at' => $message->created_at,
            'attachments' => $message->attachments->map(fn ($attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'url' => route('chat.attachments.show', [
                    'conversation' => $message->conversation_id,
                    'attachment' => $attachment->id,
                ], false),
            ])->values(),
        ];
    }

    public function index(Request $request): JsonResponse
{
    $userId = $request->user()->id;

    $conversations = Conversation::query()
        ->with([
            'client:id,fullName',
            'worker:id,fullName',
            'lastMessage.attachments',
        ])
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

    $conversations->getCollection()->transform(function (Conversation $conversation) use ($userId) {
        $otherUser = (int) $conversation->client_id === (int) $userId
            ? $conversation->worker
            : $conversation->client;

        $conversation->setAttribute('other_user', $otherUser?->only(['id', 'fullName']));
        $conversation->setAttribute('last_message', $conversation->lastMessage?->only([
            'id',
            'sender_id',
            'message',
            'created_at',
        ]));
        if ($conversation->lastMessage) {
            $conversation->setAttribute('last_message', array_merge(
                $conversation->last_message,
                ['attachments' => $conversation->lastMessage->attachments->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                ])->values()]
            ));
        }
        $conversation->makeHidden(['client', 'worker', 'lastMessage']);

        return $conversation;
    });

    return response()->json($conversations);
    }
}
