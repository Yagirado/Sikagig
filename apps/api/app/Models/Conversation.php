<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'proposal_id',
        'jasa_order_id',
        'client_id',
        'worker_id',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'worker_id');
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    public function canAccess(User $user): bool {
        $isParticipant = in_array((int) $user->id, [
            (int) $this->client_id,
            (int) $this->worker_id,
        ], true);

        if(! $isParticipant) return false;

        if($this->proposal_id && ! $this->jasa_order_id) {
            return Proposal::whereKey($this->proposal_id)
            ->where('status', 'accepted')
            ->exists();
        }

        if($this->jasa_order_id && ! $this->proposal_id){
            return JasaOrder::whereKey($this->jasa_order_id)
                ->whereIn('status', ['awaiting_payment', 'in_progress', 'completed'])
                ->exists();
        }

        return false;
    }
}
