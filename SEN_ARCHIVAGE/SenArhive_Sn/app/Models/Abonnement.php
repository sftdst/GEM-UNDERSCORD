<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Abonnement extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'abonnements';

    protected $fillable = [
        'organisation_id', 'plan_id', 'statut', 'periodicite',
        'date_debut', 'date_fin', 'date_renouvellement',
        'prix_applique', 'devise',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
            'date_renouvellement' => 'date',
            'prix_applique' => 'decimal:2',
        ];
    }

    public function plan(): BelongsTo { return $this->belongsTo(Plan::class); }
    public function factures(): HasMany { return $this->hasMany(Facture::class); }
}
