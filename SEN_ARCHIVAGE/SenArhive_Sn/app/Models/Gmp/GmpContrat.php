<?php

namespace App\Models\Gmp;

use App\Models\Dossier;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpContrat extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_contrats';

    protected $fillable = [
        'marche_id', 'organisation_id', 'dossier_id', 'numero_contrat',
        'date_debut', 'date_fin', 'montant_ht', 'montant_ttc',
        'cautionnement_pct', 'garantie_bonne_execution_pct',
        'rubrique_budgetaire', 'conditions_json', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
            'cautionnement_pct' => 'decimal:2',
            'garantie_bonne_execution_pct' => 'decimal:2',
            'conditions_json' => 'array',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'dossier_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
