<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpPvOuverturePli extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_pv_ouverture_plis';

    const UPDATED_AT = null;

    protected $fillable = [
        'appel_offre_id', 'organisation_id', 'date_seance', 'lieu',
        'membres_json', 'soumissions_json', 'observations', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'membres_json' => 'array',
            'soumissions_json' => 'array',
            'date_seance' => 'datetime',
        ];
    }

    public function appelOffre(): BelongsTo
    {
        return $this->belongsTo(GmpAppelOffre::class, 'appel_offre_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
