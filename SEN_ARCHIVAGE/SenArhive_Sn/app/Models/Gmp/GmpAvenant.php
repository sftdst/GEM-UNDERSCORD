<?php

namespace App\Models\Gmp;

use App\Models\Document;
use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpAvenant extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_avenants';

    protected $fillable = [
        'marche_id', 'organisation_id', 'numero_avenant', 'objet',
        'montant_avenant', 'delai_avenant_jours', 'date_signature',
        'motif_justification', 'analyse_ia', 'approuve_par', 'document_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'montant_avenant' => 'decimal:2',
            'numero_avenant' => 'integer',
            'delai_avenant_jours' => 'integer',
            'date_signature' => 'date',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function approbateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'approuve_par');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }
}
