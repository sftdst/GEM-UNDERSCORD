<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpAnomalie extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_anomalies';

    protected $fillable = [
        'organisation_id', 'entite_type', 'entite_id', 'type_anomalie',
        'description', 'score_confiance', 'statut',
        'resolu_par', 'resolu_le', 'resolution_note',
    ];

    protected function casts(): array
    {
        return [
            'score_confiance' => 'decimal:2',
            'resolu_le' => 'datetime',
        ];
    }

    public function resolveur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'resolu_par');
    }

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
