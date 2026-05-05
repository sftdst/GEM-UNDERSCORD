<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'factures';
    public $timestamps = false;

    protected $fillable = [
        'organisation_id', 'abonnement_id', 'numero',
        'montant_ht', 'taux_tva', 'montant_tva', 'montant_ttc',
        'devise', 'statut', 'periode_debut', 'periode_fin',
        'url_pdf', 'paye_le',
    ];

    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'taux_tva' => 'decimal:2',
            'montant_tva' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
            'periode_debut' => 'date',
            'periode_fin' => 'date',
            'paye_le' => 'datetime',
        ];
    }

    public function abonnement(): BelongsTo { return $this->belongsTo(Abonnement::class); }
    public function paiements(): HasMany { return $this->hasMany(Paiement::class); }
}
