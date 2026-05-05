<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketSupport extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'tickets_support';

    protected $fillable = [
        'organisation_id', 'utilisateur_id', 'sujet', 'description',
        'priorite', 'statut', 'agent_id', 'vu_superadmin',
    ];

    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
    public function agent(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'agent_id'); }
    public function messages(): HasMany { return $this->hasMany(MessageTicket::class, 'ticket_id'); }
}
