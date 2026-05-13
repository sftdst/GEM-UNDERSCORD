<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierHistorique extends Model
{
    use HasUuid;
    protected $table = 'courrier_historiques';
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $fillable = [
        'courrier_id', 'user_id', 'action',
        'ancien_statut', 'nouveau_statut',
        'destinataire_transfert', 'motif', 'details', 'ip_address',
    ];

    public function courrier(): BelongsTo
    {
        return $this->belongsTo(Courrier::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}