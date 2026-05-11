<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpAttribution extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_attributions';

    protected $fillable = [
        'appel_offre_id', 'organisation_id', 'soumission_id', 'type_attribution',
        'date_attribution', 'montant_attribue', 'motif',
        'alerte_ia', 'alerte_motif', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_attribue' => 'decimal:2',
            'alerte_ia' => 'boolean',
            'date_attribution' => 'date',
        ];
    }

    public function appelOffre(): BelongsTo
    {
        return $this->belongsTo(GmpAppelOffre::class, 'appel_offre_id');
    }

    public function soumission(): BelongsTo
    {
        return $this->belongsTo(GmpSoumission::class, 'soumission_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function marche(): HasOne
    {
        return $this->hasOne(GmpMarche::class, 'attribution_id');
    }
}
