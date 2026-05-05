<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageTicket extends Model
{
    use HasUuid;

    protected $table = 'messages_ticket';
    public $timestamps = false;

    protected $fillable = [
        'ticket_id', 'utilisateur_id', 'message', 'est_interne',
    ];

    protected function casts(): array
    {
        return [
            'est_interne' => 'boolean',
            'created_at'  => 'datetime',
        ];
    }

    public function ticket(): BelongsTo { return $this->belongsTo(TicketSupport::class, 'ticket_id'); }
    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
}
