<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpTypeMarche extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_types_marche';

    protected $fillable = [
        'organisation_id', 'code', 'libelle', 'description', 'actif',
    ];

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    public function marchesPrevus(): HasMany
    {
        return $this->hasMany(GmpMarchePrevu::class, 'type_marche_id');
    }

    public function appelsOffres(): HasMany
    {
        return $this->hasMany(GmpAppelOffre::class, 'type_marche_id');
    }

    public function marches(): HasMany
    {
        return $this->hasMany(GmpMarche::class, 'type_marche_id');
    }

    public function seuilsReglementaires(): HasMany
    {
        return $this->hasMany(GmpSeuilReglementaire::class, 'type_marche_id');
    }
}
