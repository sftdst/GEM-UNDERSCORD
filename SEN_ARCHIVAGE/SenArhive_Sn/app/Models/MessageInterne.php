<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageInterne extends Model
{
    use HasUuid;

    protected $table = 'messages_internes';

    protected $fillable = [
        'expediteur_id',
        'destinataire_id',
        'contenu',
        'document_id',
        'lu',
        'lu_le',
    ];

    protected function casts(): array
    {
        return [
            'lu' => 'boolean',
            'lu_le' => 'datetime',
        ];
    }

    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'expediteur_id');
    }

    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'destinataire_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
