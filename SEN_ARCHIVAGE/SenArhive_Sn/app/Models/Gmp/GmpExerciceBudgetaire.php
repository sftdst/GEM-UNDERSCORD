<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpExerciceBudgetaire extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_exercices_budgetaires';

    protected $fillable = [
        'organisation_id', 'annee', 'budget_global', 'statut',
        'date_ouverture', 'date_cloture', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'annee' => 'integer',
            'budget_global' => 'decimal:2',
            'date_ouverture' => 'date',
            'date_cloture' => 'date',
        ];
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function enveloppesSectorielles(): HasMany
    {
        return $this->hasMany(GmpEnveloppeSectorielle::class, 'exercice_id');
    }

    public function planPassation(): HasOne
    {
        return $this->hasOne(GmpPlanPassation::class, 'exercice_id');
    }
}
