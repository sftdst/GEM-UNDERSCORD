<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class GmpRapportAnomalie extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_rapports_anomalies';

    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'periode_debut', 'periode_fin',
        'nombre_anomalies', 'par_type_json', 'anomalies_critiques',
        'contenu_rapport', 'envoye', 'envoye_le', 'destinataires_json',
    ];

    protected function casts(): array
    {
        return [
            'par_type_json' => 'array',
            'destinataires_json' => 'array',
            'envoye' => 'boolean',
            'nombre_anomalies' => 'integer',
            'anomalies_critiques' => 'integer',
            'periode_debut' => 'date',
            'periode_fin' => 'date',
            'envoye_le' => 'datetime',
        ];
    }
}
