<?php

namespace App\Models\Gmp;

use App\Models\Dossier;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpAppelOffre extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_appels_offres';

    protected $fillable = [
        'organisation_id', 'marche_prevu_id', 'dossier_id', 'numero_aao',
        'intitule', 'description', 'statut', 'date_publication', 'date_cloture',
        'montant_estime', 'type_marche_id', 'mode_passation_id',
        'source_financement_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_estime' => 'decimal:2',
            'date_publication' => 'date',
            'date_cloture' => 'date',
        ];
    }

    public function marchePrevu(): BelongsTo
    {
        return $this->belongsTo(GmpMarchePrevu::class, 'marche_prevu_id');
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'dossier_id');
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

    public function soumissions(): HasMany
    {
        return $this->hasMany(GmpSoumission::class, 'appel_offre_id');
    }

    public function piecesRequises(): HasMany
    {
        return $this->hasMany(GmpPieceRequise::class, 'appel_offre_id')->orderBy('ordre');
    }

    public function pvOuverture(): HasOne
    {
        return $this->hasOne(GmpPvOuverturePli::class, 'appel_offre_id');
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(GmpAttribution::class, 'appel_offre_id');
    }
}
