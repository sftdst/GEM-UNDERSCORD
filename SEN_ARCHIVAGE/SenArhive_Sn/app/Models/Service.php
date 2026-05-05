<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'services';

    protected $fillable = [
        'organisation_id', 'departement_id', 'nom', 'description',
        'code', 'responsable_id', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'responsable_id');
    }

    public function utilisateurs(): HasMany
    {
        return $this->hasMany(Utilisateur::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }
}
