<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpJalon extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_jalons';

    protected $fillable = [
        'marche_id', 'organisation_id', 'type_jalon', 'libelle',
        'date_prevue', 'date_reelle', 'statut', 'observations',
    ];

    protected function casts(): array
    {
        return [
            'date_prevue' => 'date',
            'date_reelle' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }
}
