<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Utilisateur;
use App\Models\Service;
use App\Models\Role;

class PipelineEtapeInstance extends Model
{
    use HasUuid;

    protected $table = 'pipeline_etape_instances';
    public $timestamps = false;

    protected $fillable = [
        'instance_id', 'etape_id', 'ordre', 'statut',
        'traite_par', 'commentaire', 'motif_rejet', 'traite_le',
        'acteur_type_override', 'acteur_id_override',
    ];

    protected $appends = ['acteur_effectif_type', 'acteur_effectif_id', 'acteur_effectif_nom'];

    protected function casts(): array
    {
        return [
            'traite_le'  => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(PipelineInstance::class, 'instance_id');
    }

    public function etape(): BelongsTo
    {
        return $this->belongsTo(PipelineEtape::class, 'etape_id');
    }

    public function traitePar(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'traite_par');
    }

    public function annotations(): HasMany
    {
        return $this->hasMany(PipelineAnnotation::class, 'etape_instance_id')->orderBy('created_at');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(PipelineHistorique::class, 'etape_instance_id')->orderBy('created_at');
    }

    public function isTraitable(): bool
    {
        return in_array($this->statut, ['en_attente', 'en_cours', 'retour_modification']);
    }

    /** Type acteur effectif : override en priorité, sinon le template */
    public function getActeurEffectifTypeAttribute(): string
    {
        return $this->acteur_type_override ?? $this->etape?->type_acteur ?? 'utilisateur';
    }

    /** ID acteur effectif : override en priorité, sinon le template */
    public function getActeurEffectifIdAttribute(): ?string
    {
        return $this->acteur_id_override ?? $this->etape?->acteur_id;
    }

    /** Nom lisible de l'acteur effectif */
    public function getActeurEffectifNomAttribute(): string
    {
        $type = $this->acteur_effectif_type;
        $id   = $this->acteur_effectif_id;

        if (!$id) return '—';

        return match ($type) {
            'utilisateur' => ($u = Utilisateur::find($id)) ? "{$u->prenom} {$u->nom}" : '—',
            'service'     => ($s = Service::find($id)) ? $s->nom : '—',
            'role'        => ($r = Role::find($id)) ? $r->nom : '—',
            default       => '—',
        };
    }

    /** Vérifie si l'utilisateur peut traiter cette étape (respecte les overrides) */
    public function peutEtreTraiteePar(Utilisateur $utilisateur): bool
    {
        $type = $this->acteur_effectif_type;
        $id   = $this->acteur_effectif_id;

        if (!$id) return false;

        return match ($type) {
            'utilisateur' => $utilisateur->id === $id,
            'service'     => $utilisateur->service_id === $id,
            'role'        => $utilisateur->role_id === $id,
            default       => false,
        };
    }
}
