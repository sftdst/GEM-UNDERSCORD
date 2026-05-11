<?php

namespace App\Models\Gmp;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpDependanceMarche extends Model
{
    use HasUuid;

    protected $table = 'gmp_dependances_marches';

    const UPDATED_AT = null;

    protected $fillable = [
        'marche_id', 'marche_prerequis_id', 'type_dependance',
        'decalage_jours', 'observations',
    ];

    protected function casts(): array
    {
        return ['decalage_jours' => 'integer'];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function marchePrerequisModel(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_prerequis_id');
    }
}
