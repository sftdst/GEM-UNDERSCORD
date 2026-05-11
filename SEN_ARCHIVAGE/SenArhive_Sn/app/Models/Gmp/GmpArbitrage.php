<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpArbitrage extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_arbitrages';

    protected $fillable = [
        'organisation_id', 'objet', 'description', 'organisations_concernees',
        'priorite', 'statut', 'decision', 'decide_par', 'date_decision', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'organisations_concernees' => 'array',
            'date_decision' => 'date',
        ];
    }

    public function decideur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'decide_par');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
