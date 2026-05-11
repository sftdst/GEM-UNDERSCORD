<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpPaiementMarche extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_paiements_marche';

    const UPDATED_AT = null;

    protected $fillable = [
        'bon_a_payer_id', 'organisation_id', 'montant_paye', 'date_paiement',
        'reference_virement', 'cumul_paye', 'enregistre_par',
    ];

    protected function casts(): array
    {
        return [
            'montant_paye' => 'decimal:2',
            'cumul_paye' => 'decimal:2',
            'date_paiement' => 'date',
        ];
    }

    public function bonAPayer(): BelongsTo
    {
        return $this->belongsTo(GmpBonAPayer::class, 'bon_a_payer_id');
    }

    public function enregistreur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'enregistre_par');
    }
}
