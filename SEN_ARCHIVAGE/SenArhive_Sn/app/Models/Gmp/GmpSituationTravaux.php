<?php

namespace App\Models\Gmp;

use App\Models\Document;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GmpSituationTravaux extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_situations_travaux';

    const UPDATED_AT = null;

    protected $fillable = [
        'marche_id', 'organisation_id', 'numero_situation', 'date_situation',
        'taux_avancement_physique', 'montant_situation', 'cumul_total',
        'document_id', 'soumis_par',
    ];

    protected function casts(): array
    {
        return [
            'numero_situation' => 'integer',
            'taux_avancement_physique' => 'decimal:2',
            'montant_situation' => 'decimal:2',
            'cumul_total' => 'decimal:2',
            'date_situation' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function soumetteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'soumis_par');
    }

    public function decompte(): HasOne
    {
        return $this->hasOne(GmpDecompte::class, 'situation_id');
    }
}
