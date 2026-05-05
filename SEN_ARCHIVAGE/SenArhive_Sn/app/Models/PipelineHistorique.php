<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Historique immuable — aucune modification après insertion.
 * Pas de updated_at, pas de soft delete.
 */
class PipelineHistorique extends Model
{
    use HasUuid;

    protected $table = 'pipeline_historique';
    public $timestamps = false;

    // Pas de update possible — guard complet sur fillable
    protected $fillable = [
        'instance_id', 'etape_instance_id', 'utilisateur_id',
        'action', 'ancien_statut', 'nouveau_statut',
        'commentaire', 'donnees_supplementaires',
        'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'donnees_supplementaires' => 'array',
            'created_at'              => 'datetime',
        ];
    }

    // Bloquer toute modification après création
    public function save(array $options = []): bool
    {
        if (!$this->exists) {
            return parent::save($options);
        }
        return false; // immuable
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(PipelineInstance::class, 'instance_id');
    }

    public function etapeInstance(): BelongsTo
    {
        return $this->belongsTo(PipelineEtapeInstance::class, 'etape_instance_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
