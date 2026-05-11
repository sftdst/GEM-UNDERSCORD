<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpSourceFinancement extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_sources_financement';

    protected $fillable = [
        'organisation_id', 'code', 'libelle', 'description', 'actif',
    ];

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    public function marchesPrevus(): HasMany
    {
        return $this->hasMany(GmpMarchePrevu::class, 'source_financement_id');
    }

    public function appelsOffres(): HasMany
    {
        return $this->hasMany(GmpAppelOffre::class, 'source_financement_id');
    }

    public function marches(): HasMany
    {
        return $this->hasMany(GmpMarche::class, 'source_financement_id');
    }
}
