<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalActivite extends Model
{
    use HasUuid;

    protected $table = 'journaux_activite';
    public $timestamps = false;

    protected $fillable = [
        'organisation_id', 'utilisateur_id', 'action',
        'ressource_type', 'ressource_id', 'detail',
        'ip_address', 'user_agent', 'statut',
    ];

    protected function casts(): array
    {
        return ['detail' => 'array'];
    }

    public function organisation(): BelongsTo { return $this->belongsTo(Organisation::class); }
    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
}
