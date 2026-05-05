<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeEssai extends Model
{
    protected $table = 'demandes_essai';

    protected $fillable = [
        'organisation_id',
        'utilisateur_id',
        'statut',
        'secteur_activite',
        'nb_utilisateurs_prevu',
        'message',
        'traite_par',
        'raison_rejet',
        'traite_le',
    ];

    protected $casts = [
        'traite_le'            => 'datetime',
        'nb_utilisateurs_prevu'=> 'integer',
    ];

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class);
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function isEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }
}
