<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpSoumission extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_soumissions';

    protected $fillable = [
        'organisation_id', 'appel_offre_id', 'fournisseur_id',
        'reference_soumission', 'date_depot',
        'montant_offre_ht', 'montant_offre_ttc',
        'delai_execution_propose',
        'statut', 'score_technique', 'score_financier', 'score_global',
        'motif_elimination', 'alerte_offre_anormale', 'dossier_id',
    ];

    protected function casts(): array
    {
        return [
            'montant_offre_ht'        => 'decimal:2',
            'montant_offre_ttc'       => 'decimal:2',
            'score_technique'         => 'decimal:2',
            'score_financier'         => 'decimal:2',
            'score_global'            => 'decimal:2',
            'delai_execution_propose' => 'integer',
            'alerte_offre_anormale'   => 'boolean',
            'date_depot'              => 'datetime',
        ];
    }

    public function appelOffre(): BelongsTo
    {
        return $this->belongsTo(GmpAppelOffre::class, 'appel_offre_id');
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(GmpFournisseur::class, 'fournisseur_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function pieces(): HasMany
    {
        return $this->hasMany(GmpSoumissionPiece::class, 'soumission_id')->with('pieceRequise');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(GmpEvaluationOffre::class, 'soumission_id');
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(GmpAttribution::class, 'soumission_id');
    }
}
