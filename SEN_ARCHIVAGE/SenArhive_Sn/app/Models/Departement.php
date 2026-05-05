<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Departement extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'departements';

    protected $fillable = [
        'organisation_id', 'nom', 'description', 'code',
        'responsable_id', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'responsable_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function utilisateurs(): HasManyThrough
    {
        return $this->hasManyThrough(Utilisateur::class, Service::class, 'departement_id', 'service_id');
    }
}
