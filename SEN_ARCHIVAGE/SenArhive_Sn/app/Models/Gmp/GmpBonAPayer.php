<?php

namespace App\Models\Gmp;

use App\Models\Document;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpBonAPayer extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_bons_a_payer';

    protected $fillable = [
        'decompte_id', 'organisation_id', 'numero_bap', 'montant', 'date_emission',
        'valide_par_1', 'date_validation_1', 'valide_par_2', 'date_validation_2',
        'document_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_emission' => 'date',
            'date_validation_1' => 'datetime',
            'date_validation_2' => 'datetime',
        ];
    }

    public function decompte(): BelongsTo
    {
        return $this->belongsTo(GmpDecompte::class, 'decompte_id');
    }

    public function valideur1(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par_1');
    }

    public function valideur2(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par_2');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(GmpPaiementMarche::class, 'bon_a_payer_id');
    }
}
