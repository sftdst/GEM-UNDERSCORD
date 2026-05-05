<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    use HasUuid;

    protected $table = 'paiements';
    public $timestamps = false;

    protected $fillable = [
        'facture_id', 'organisation_id', 'montant', 'devise',
        'methode', 'reference_externe', 'statut', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function facture(): BelongsTo { return $this->belongsTo(Facture::class); }
    public function organisation(): BelongsTo { return $this->belongsTo(Organisation::class); }
}
