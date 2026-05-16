<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpMarchePrevu extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_marches_prevus';

    protected $fillable = [
        'plan_id', 'organisation_id', 'numero', 'objet', 'description',
        'type_marche_id', 'mode_passation_id', 'source_financement_id', 'secteur_id',
        'montant_previsionnel',
        'date_lancement_prevue', 'date_attribution_prevue', 'date_debut_prevue', 'date_fin_prevue',
        'duree_prevue_jours', 'statut', 'observations',
        'score_risque_ia', 'dossier_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_previsionnel'    => 'decimal:2',
            'score_risque_ia'         => 'decimal:2',
            'duree_prevue_jours'      => 'integer',
            'date_lancement_prevue'   => 'date',
            'date_attribution_prevue' => 'date',
            'date_debut_prevue'       => 'date',
            'date_fin_prevue'         => 'date',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(GmpPlanPassation::class, 'plan_id');
    }

    public function secteur(): BelongsTo
    {
        return $this->belongsTo(GmpSecteurIntervention::class, 'secteur_id');
    }

    public function typeMarche(): BelongsTo
    {
        return $this->belongsTo(GmpTypeMarche::class, 'type_marche_id');
    }

    public function modePassation(): BelongsTo
    {
        return $this->belongsTo(GmpModePassation::class, 'mode_passation_id');
    }

    public function sourceFinancement(): BelongsTo
    {
        return $this->belongsTo(GmpSourceFinancement::class, 'source_financement_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function appelsOffres(): HasMany
    {
        return $this->hasMany(GmpAppelOffre::class, 'marche_prevu_id');
    }
}
