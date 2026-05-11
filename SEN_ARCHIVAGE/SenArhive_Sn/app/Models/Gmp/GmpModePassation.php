<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpModePassation extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_modes_passation';

    protected $fillable = [
        'organisation_id', 'code', 'libelle', 'description', 'actif',
    ];

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    public function marchesPrevus(): HasMany
    {
        return $this->hasMany(GmpMarchePrevu::class, 'mode_passation_id');
    }

    public function appelsOffres(): HasMany
    {
        return $this->hasMany(GmpAppelOffre::class, 'mode_passation_id');
    }

    public function seuilsReglementaires(): HasMany
    {
        return $this->hasMany(GmpSeuilReglementaire::class, 'mode_passation_id');
    }
}
