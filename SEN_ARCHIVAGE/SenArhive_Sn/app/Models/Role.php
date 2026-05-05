<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'roles';
    const UPDATED_AT = null;

    protected $fillable = [
        'organisation_id', 'nom', 'description', 'permissions', 'est_systeme',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'est_systeme' => 'boolean',
        ];
    }

    public function utilisateurs(): HasMany
    {
        return $this->hasMany(Utilisateur::class);
    }
}
