<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Groupe extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'groupes';
    const UPDATED_AT = null;

    protected $fillable = ['organisation_id', 'nom', 'description'];

    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(Utilisateur::class, 'groupes_utilisateurs')
            ->withPivot('ajoute_le');
    }
}
