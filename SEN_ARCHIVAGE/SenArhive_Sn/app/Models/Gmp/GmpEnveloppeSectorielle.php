<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpEnveloppeSectorielle extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_enveloppes_sectorielles';

    protected $fillable = [
        'exercice_id', 'secteur_id', 'organisation_id',
        'montant_alloue', 'montant_engage',
    ];

    protected function casts(): array
    {
        return [
            'montant_alloue' => 'decimal:2',
            'montant_engage' => 'decimal:2',
        ];
    }

    public function exercice(): BelongsTo
    {
        return $this->belongsTo(GmpExerciceBudgetaire::class, 'exercice_id');
    }

    public function secteur(): BelongsTo
    {
        return $this->belongsTo(GmpSecteurIntervention::class, 'secteur_id');
    }
}
