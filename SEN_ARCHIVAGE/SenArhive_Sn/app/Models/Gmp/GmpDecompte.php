<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpDecompte extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_decomptes';

    protected $fillable = [
        'situation_id', 'organisation_id', 'montant_brut', 'retenue_garantie',
        'avance_sur_marche', 'montant_net', 'statut',
        'verifie_par', 'certifie_par', 'motif_rejet', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_brut' => 'decimal:2',
            'retenue_garantie' => 'decimal:2',
            'avance_sur_marche' => 'decimal:2',
            'montant_net' => 'decimal:2',
        ];
    }

    public function situation(): BelongsTo
    {
        return $this->belongsTo(GmpSituationTravaux::class, 'situation_id');
    }

    public function verificateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'verifie_par');
    }

    public function certificateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'certifie_par');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function bonAPayer(): HasOne
    {
        return $this->hasOne(GmpBonAPayer::class, 'decompte_id');
    }
}
