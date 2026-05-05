<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PipelineAnnotation extends Model
{
    use HasUuid;

    protected $table = 'pipeline_annotations';
    public $timestamps = false;

    protected $fillable = [
        'etape_instance_id', 'utilisateur_id',
        'texte', 'fichier_joint', 'nom_fichier_original',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
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
