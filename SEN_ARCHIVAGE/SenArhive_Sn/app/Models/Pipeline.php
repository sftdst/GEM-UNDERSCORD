<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pipeline extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'pipelines';

    protected $fillable = [
        'organisation_id', 'nom', 'description', 'type_document',
        'statut', 'created_by',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function etapes(): HasMany
    {
        return $this->hasMany(PipelineEtape::class)->orderBy('ordre');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(PipelineInstance::class);
    }

    public function isActif(): bool
    {
        return $this->statut === 'actif';
    }
}
