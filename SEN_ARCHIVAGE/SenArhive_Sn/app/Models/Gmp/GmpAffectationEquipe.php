<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpAffectationEquipe extends Model
{
    use HasUuid;

    protected $table = 'gmp_affectations_equipe';

    protected $fillable = [
        'marche_id', 'utilisateur_id', 'role_dans_marche',
        'date_debut', 'date_fin', 'actif', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
