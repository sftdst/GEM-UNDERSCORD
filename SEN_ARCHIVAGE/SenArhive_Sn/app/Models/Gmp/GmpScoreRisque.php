<?php

namespace App\Models\Gmp;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class GmpScoreRisque extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_scores_risque';

    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'entite_type', 'entite_id',
        'score', 'variables_json', 'explication',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'variables_json' => 'array',
        ];
    }

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
