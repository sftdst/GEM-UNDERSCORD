<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpSecteurIntervention extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_secteurs_intervention';

    protected $fillable = [
        'organisation_id', 'code', 'libelle', 'description',
        'actif', 'couleur', 'icone', 'ordre',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'ordre' => 'integer',
        ];
    }

    public function marchesPrevus(): HasMany
    {
        return $this->hasMany(GmpMarchePrevu::class, 'secteur_id');
    }

    public function enveloppesSectorielles(): HasMany
    {
        return $this->hasMany(GmpEnveloppeSectorielle::class, 'secteur_id');
    }
}
