<?php

namespace App\Models\Gmp;

use App\Models\Document;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpOrdreService extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_ordres_service';

    const UPDATED_AT = null;

    protected $fillable = [
        'marche_id', 'organisation_id', 'numero_os', 'type',
        'date_emission', 'date_effet', 'duree_prolongation_jours',
        'motif', 'document_id', 'emis_par',
    ];

    protected function casts(): array
    {
        return [
            'duree_prolongation_jours' => 'integer',
            'date_emission' => 'date',
            'date_effet' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function emetteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'emis_par');
    }
}
