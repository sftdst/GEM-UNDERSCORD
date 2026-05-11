<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GmpEvaluationFournisseur extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_evaluations_fournisseurs';

    const UPDATED_AT = null;

    protected $fillable = [
        'marche_id', 'organisation_id', 'fournisseur_id',
        'note_delais', 'note_qualite', 'note_financier', 'note_conformite', 'note_globale',
        'commentaire', 'evalue_par',
    ];

    protected function casts(): array
    {
        return [
            'note_delais' => 'decimal:1',
            'note_qualite' => 'decimal:1',
            'note_financier' => 'decimal:1',
            'note_conformite' => 'decimal:1',
            'note_globale' => 'decimal:2',
        ];
    }

    public function marche(): BelongsTo
    {
        return $this->belongsTo(GmpMarche::class, 'marche_id');
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(GmpFournisseur::class, 'fournisseur_id');
    }

    public function evaluateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'evalue_par');
    }
}
