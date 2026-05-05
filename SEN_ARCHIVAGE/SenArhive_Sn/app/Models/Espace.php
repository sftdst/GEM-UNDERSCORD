<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Espace extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'espaces';

    protected $fillable = [
        'organisation_id', 'nom', 'description', 'couleur', 'icone', 'created_by',
    ];

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }

    public function documents(): HasManyThrough
    {
        return $this->hasManyThrough(Document::class, Dossier::class);
    }
}
