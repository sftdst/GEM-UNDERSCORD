<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PipelineInstance extends Model
{
    use HasUuid;

    protected $table = 'pipeline_instances';

    protected $fillable = [
        'pipeline_id', 'document_id', 'statut',
        'etape_courante_id', 'initie_par', 'commentaire_init',
    ];

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(Pipeline::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function initiateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'initie_par');
    }

    public function etapeCourante(): BelongsTo
    {
        return $this->belongsTo(PipelineEtapeInstance::class, 'etape_courante_id');
    }

    public function etapeInstances(): HasMany
    {
        return $this->hasMany(PipelineEtapeInstance::class, 'instance_id')->orderBy('ordre');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(PipelineHistorique::class, 'instance_id')->orderBy('created_at');
    }

    public function isTermine(): bool
    {
        return in_array($this->statut, ['complete', 'rejete']);
    }
}
