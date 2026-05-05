<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuid;

    protected $table = 'plans';

    protected $fillable = [
        'nom', 'description', 'prix_mensuel', 'prix_annuel',
        'stockage_max_go', 'users_max', 'documents_max',
        'avantages', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'prix_mensuel' => 'decimal:2',
            'prix_annuel'  => 'decimal:2',
            'avantages'    => 'array',
            'actif'        => 'boolean',
        ];
    }

    public function fonctionnalites(): BelongsToMany
    {
        return $this->belongsToMany(Fonctionnalite::class, 'plan_fonctionnalite')
                    ->orderBy('categorie')
                    ->orderBy('ordre');
    }

    public function organisations(): HasMany
    {
        return $this->hasMany(Organisation::class);
    }

    public function abonnements(): HasMany
    {
        return $this->hasMany(Abonnement::class);
    }
}
