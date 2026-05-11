<?php

namespace App\Models\Gmp;

use App\Models\Utilisateur;
use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GmpFournisseur extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'gmp_fournisseurs';

    protected $fillable = [
        'organisation_id', 'raison_sociale', 'ninea', 'rc', 'adresse',
        'telephone', 'email', 'site_web', 'pays', 'specialites_json',
        'capacite_financiere', 'score_global', 'statut', 'blacklist_motif', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'specialites_json' => 'array',
            'capacite_financiere' => 'decimal:2',
            'score_global' => 'decimal:2',
        ];
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function soumissions(): HasMany
    {
        return $this->hasMany(GmpSoumission::class, 'fournisseur_id');
    }

    public function marches(): HasMany
    {
        return $this->hasMany(GmpMarche::class, 'fournisseur_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(GmpEvaluationFournisseur::class, 'fournisseur_id');
    }
}
