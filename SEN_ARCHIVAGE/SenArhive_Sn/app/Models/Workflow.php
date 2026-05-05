<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'workflows';

    protected $fillable = [
        'organisation_id', 'nom', 'description', 'etapes', 'actif', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'etapes' => 'array',
            'actif' => 'boolean',
        ];
    }

    public function createur(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'created_by'); }
    public function instances(): HasMany { return $this->hasMany(InstanceWorkflow::class); }
}
