<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Fonctionnalite extends Model
{
    use HasUuid;

    protected $table = 'fonctionnalites';

    protected $fillable = [
        'code', 'nom', 'description', 'categorie', 'ordre', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'ordre' => 'integer',
        ];
    }

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'plan_fonctionnalite');
    }
}
