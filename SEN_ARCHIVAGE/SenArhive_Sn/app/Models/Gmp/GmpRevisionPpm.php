<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpRevisionPpm extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_revisions_ppm';

    const UPDATED_AT = null;

    protected $fillable = [
        'plan_id', 'organisation_id', 'numero_revision', 'motif',
        'donnees_avant', 'donnees_apres', 'valide_par',
    ];

    protected function casts(): array
    {
        return [
            'numero_revision' => 'integer',
            'donnees_avant' => 'array',
            'donnees_apres' => 'array',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(GmpPlanPassation::class, 'plan_id');
    }

    public function valideur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par');
    }
}
