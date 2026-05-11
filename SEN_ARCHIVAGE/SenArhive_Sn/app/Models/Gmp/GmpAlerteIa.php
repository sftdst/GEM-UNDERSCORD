<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpAlerteIa extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_alertes_ia';

    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'entite_type', 'entite_id', 'niveau',
        'titre', 'description', 'recommandation',
        'traite', 'traite_par', 'traite_le',
    ];

    protected function casts(): array
    {
        return [
            'traite' => 'boolean',
            'traite_le' => 'datetime',
        ];
    }

    public function traiteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'traite_par');
    }

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
