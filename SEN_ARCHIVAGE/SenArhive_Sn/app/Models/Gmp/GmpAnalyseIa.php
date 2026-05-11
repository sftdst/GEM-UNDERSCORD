<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpAnalyseIa extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_analyses_ia';

    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'type_analyse', 'entite_type', 'entite_id',
        'prompt_envoye', 'resultat_json', 'explication',
        'tokens_utilises', 'duree_ms', 'utilisateur_id',
    ];

    protected function casts(): array
    {
        return [
            'resultat_json' => 'array',
            'tokens_utilises' => 'integer',
            'duree_ms' => 'integer',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
