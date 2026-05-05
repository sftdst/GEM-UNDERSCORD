<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationCustom extends Model
{
    use HasUuid;

    protected $table = 'notifications_custom';
    public $timestamps = false;

    protected $fillable = [
        'utilisateur_id', 'acteur_id', 'type', 'titre', 'message',
        'lien', 'document_id', 'lu', 'lu_le',
    ];

    protected function casts(): array
    {
        return [
            'lu' => 'boolean',
            'lu_le' => 'datetime',
        ];
    }

    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
    public function acteur(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'acteur_id'); }
    public function document(): BelongsTo { return $this->belongsTo(Document::class); }

    public function marquerCommeLu(): void
    {
        $this->update(['lu' => true, 'lu_le' => now()]);
    }
}
