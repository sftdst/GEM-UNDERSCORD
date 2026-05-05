<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PipelineEtape extends Model
{
    use HasUuid;

    protected $table = 'pipeline_etapes';

    protected $fillable = [
        'pipeline_id', 'ordre', 'nom', 'description',
        'type_acteur', 'acteur_id',
        'annotation_obligatoire', 'fichier_requis',
        'commentaire_requis', 'signature_requise',
        'rejet_etape_retour_id',
    ];

    protected $appends = ['acteur_nom'];

    protected function casts(): array
    {
        return [
            'annotation_obligatoire' => 'boolean',
            'fichier_requis' => 'boolean',
            'commentaire_requis' => 'boolean',
            'signature_requise' => 'boolean',
        ];
    }

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(Pipeline::class);
    }

    /** Étape vers laquelle revenir en cas de rejet (si configurée) */
    public function etapeRejet(): BelongsTo
    {
        return $this->belongsTo(PipelineEtape::class, 'rejet_etape_retour_id');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(PipelineEtapeInstance::class, 'etape_id');
    }

    /**
     * Résoudre dynamiquement l'acteur selon le type.
     * Retourne l'entité (Utilisateur, Service, Role) ou null.
     */
    public function getActeurAttribute(): ?Model
    {
        return match ($this->type_acteur) {
            'utilisateur' => Utilisateur::find($this->acteur_id),
            'service'     => Service::find($this->acteur_id),
            'role'        => Role::find($this->acteur_id),
            default       => null,
        };
    }

    /**
     * Nom lisible de l'acteur assigné à cette étape.
     */
    public function getActeurNomAttribute(): string
    {
        if (!$this->acteur_id) {
            return '—';
        }

        return match ($this->type_acteur) {
            'utilisateur' => ($u = Utilisateur::find($this->acteur_id))
                ? "{$u->prenom} {$u->nom}"
                : '—',
            'service' => ($s = Service::find($this->acteur_id))
                ? $s->nom
                : '—',
            'role' => ($r = Role::find($this->acteur_id))
                ? $r->nom
                : '—',
            default => '—',
        };
    }

    /**
     * Vérifier si l'utilisateur donné est autorisé à traiter cette étape.
     */
    public function peutEtreTraiteePar(Utilisateur $utilisateur): bool
    {
        return match ($this->type_acteur) {
            'utilisateur' => $utilisateur->id === $this->acteur_id,
            'service'     => $utilisateur->service_id === $this->acteur_id,
            'role'        => $utilisateur->role_id === $this->acteur_id,
            default       => false,
        };
    }
}
