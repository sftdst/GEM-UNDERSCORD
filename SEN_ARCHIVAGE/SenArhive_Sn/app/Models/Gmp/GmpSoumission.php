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
        'appel_offre_id', 'organisation_id', 'fournisseur_id', 'date_soumission',
        'montant_offre_ht', 'montant_offre_ttc', 'note_technique', 'note_financiere',
        'note_globale', 'statut', 'alerte_offre_anormale', 'motif_rejet', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_offre_ht' => 'decimal:2',
            'montant_offre_ttc' => 'decimal:2',
            'note_technique' => 'decimal:2',
            'note_financiere' => 'decimal:2',
            'note_globale' => 'decimal:2',
            'alerte_offre_anormale' => 'boolean',
            'date_soumission' => 'datetime',
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

    public function evaluations(): HasMany
    {
        return $this->hasMany(GmpEvaluationOffre::class, 'soumission_id');
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(GmpAttribution::class, 'soumission_id');
    }
}
