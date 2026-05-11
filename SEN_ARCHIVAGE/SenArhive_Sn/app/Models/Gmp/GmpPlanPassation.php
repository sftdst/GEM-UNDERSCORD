<?php

namespace App\Models\Gmp;

use App\Models\PipelineInstance;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpPlanPassation extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_plans_passation';

    protected $fillable = [
        'organisation_id', 'exercice_id', 'reference', 'intitule',
        'version', 'statut', 'date_soumission', 'date_approbation',
        'approuve_par', 'pipeline_instance_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'date_soumission' => 'date',
            'date_approbation' => 'date',
        ];
    }

    public function exercice(): BelongsTo
    {
        return $this->belongsTo(GmpExerciceBudgetaire::class, 'exercice_id');
    }

    public function approbateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'approuve_par');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function pipelineInstance(): BelongsTo
    {
        return $this->belongsTo(PipelineInstance::class, 'pipeline_instance_id');
    }

    public function marchesPrevus(): HasMany
    {
        return $this->hasMany(GmpMarchePrevu::class, 'plan_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(GmpRevisionPpm::class, 'plan_id');
    }
}
