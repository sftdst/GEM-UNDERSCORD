<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpMarche extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_marches';

    protected $fillable = [
        'organisation_id', 'attribution_id', 'numero_marche', 'intitule',
        'fournisseur_id', 'type_marche_id', 'source_financement_id',
        'montant_initial_ht', 'montant_initial_ttc', 'montant_actuel_ht', 'montant_actuel_ttc',
        'date_signature', 'date_debut', 'date_fin_prevue', 'date_fin_projetee_ia',
        'duree_jours', 'statut', 'taux_avancement_physique', 'taux_avancement_financier',
        'statut_risque', 'montant_paye', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_initial_ht' => 'decimal:2',
            'montant_initial_ttc' => 'decimal:2',
            'montant_actuel_ht' => 'decimal:2',
            'montant_actuel_ttc' => 'decimal:2',
            'montant_paye' => 'decimal:2',
            'taux_avancement_physique' => 'decimal:2',
            'taux_avancement_financier' => 'decimal:2',
            'duree_jours' => 'integer',
            'date_signature' => 'date',
            'date_debut' => 'date',
            'date_fin_prevue' => 'date',
            'date_fin_projetee_ia' => 'date',
        ];
    }

    public function attribution(): BelongsTo
    {
        return $this->belongsTo(GmpAttribution::class, 'attribution_id');
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(GmpFournisseur::class, 'fournisseur_id');
    }

    public function typeMarche(): BelongsTo
    {
        return $this->belongsTo(GmpTypeMarche::class, 'type_marche_id');
    }

    public function sourceFinancement(): BelongsTo
    {
        return $this->belongsTo(GmpSourceFinancement::class, 'source_financement_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function contrat(): HasOne
    {
        return $this->hasOne(GmpContrat::class, 'marche_id');
    }

    public function ordresService(): HasMany
    {
        return $this->hasMany(GmpOrdreService::class, 'marche_id');
    }

    public function avenants(): HasMany
    {
        return $this->hasMany(GmpAvenant::class, 'marche_id');
    }

    public function situationsTravaux(): HasMany
    {
        return $this->hasMany(GmpSituationTravaux::class, 'marche_id');
    }

    public function jalons(): HasMany
    {
        return $this->hasMany(GmpJalon::class, 'marche_id');
    }

    public function affectationsEquipe(): HasMany
    {
        return $this->hasMany(GmpAffectationEquipe::class, 'marche_id');
    }

    public function evaluationsFournisseur(): HasMany
    {
        return $this->hasMany(GmpEvaluationFournisseur::class, 'marche_id');
    }
}
