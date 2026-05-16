<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpEvaluationOffre extends Model
{
    use HasUuid;

    protected $table = 'gmp_evaluations_offres';

    const UPDATED_AT = null;

    protected $fillable = [
        'soumission_id', 'evaluateur_id', 'critere',
        'ponderation', 'note', 'note_ponderee', 'commentaire',
    ];

    protected function casts(): array
    {
        return [
            'ponderation' => 'decimal:2',
            'note' => 'decimal:2',
            'note_ponderee' => 'decimal:2',
        ];
    }

    public function soumission(): BelongsTo
    {
        return $this->belongsTo(GmpSoumission::class, 'soumission_id');
    }

    public function evaluateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'evalue_par');
    }
}
