<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class GmpParametreIa extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_parametres_ia';

    protected $fillable = [
        'organisation_id',
        'seuil_alerte_budget',
        'seuil_alerte_delai',
        'sensibilite_anomalie',
        'score_risque_actif',
        'assistant_ia_actif',
        'generation_docs_active',
        'rapport_anomalies_frequence',
        'rapport_anomalies_destinataires',
        'modele_ia',
    ];

    protected function casts(): array
    {
        return [
            'seuil_alerte_budget'             => 'decimal:2',
            'seuil_alerte_delai'              => 'integer',
            'score_risque_actif'              => 'boolean',
            'assistant_ia_actif'              => 'boolean',
            'generation_docs_active'          => 'boolean',
            'rapport_anomalies_destinataires' => 'array',
        ];
    }
}
