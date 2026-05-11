<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpSeuilReglementaire extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_seuils_reglementaires';

    protected $fillable = [
        'organisation_id', 'type_marche_id', 'mode_passation_id',
        'pays', 'annee', 'montant_min', 'montant_max', 'description', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'annee' => 'integer',
            'montant_min' => 'decimal:2',
            'montant_max' => 'decimal:2',
        ];
    }

    public function typeMarche(): BelongsTo
    {
        return $this->belongsTo(GmpTypeMarche::class, 'type_marche_id');
    }

    public function modePassation(): BelongsTo
    {
        return $this->belongsTo(GmpModePassation::class, 'mode_passation_id');
    }
}
