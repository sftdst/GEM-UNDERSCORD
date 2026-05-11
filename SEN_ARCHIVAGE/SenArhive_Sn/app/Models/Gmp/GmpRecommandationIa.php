<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpRecommandationIa extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_recommendations_ia';

    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'entite_type', 'entite_id',
        'recommandation', 'explication', 'priorite',
        'impact_estime', 'statut', 'vue_par',
    ];

    public function vueParUser(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'vue_par');
    }

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
