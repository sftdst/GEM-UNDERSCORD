<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organisation extends Model
{
    use HasUuid;

    protected $table = 'organisations';

    protected $fillable = [
        'plan_id', 'nom', 'slug', 'logo_url', 'domaine',
        'pays', 'langue_defaut', 'timezone', 'stockage_utilise_mo',
        'statut', 'date_essai_fin', 'parametres',
    ];

    protected function casts(): array
    {
        return [
            'parametres' => 'array',
            'date_essai_fin' => 'date',
            'stockage_utilise_mo' => 'integer',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function utilisateurs(): HasMany
    {
        return $this->hasMany(Utilisateur::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    public function espaces(): HasMany
    {
        return $this->hasMany(Espace::class);
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class);
    }

    public function abonnements(): HasMany
    {
        return $this->hasMany(Abonnement::class);
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(TicketSupport::class);
    }

    /** Limite de stockage du plan en Mo (défaut 5 Go si plan absent). */
    public function getStorageLimitMo(): int
    {
        return ($this->plan->stockage_max_go ?? 5) * 1024;
    }

    /** Vérifie qu'il reste de la place pour un fichier de $fileSizeBytes octets. */
    public function hasStorageCapacity(int $fileSizeBytes): bool
    {
        $additionalMo = (int) ceil($fileSizeBytes / 1048576);

        return ($this->stockage_utilise_mo + $additionalMo) <= $this->getStorageLimitMo();
    }

    /** Vérifie que la limite de documents du plan n'est pas atteinte. */
    public function hasDocumentCapacity(): bool
    {
        $max = $this->plan->documents_max ?? null;

        if ($max === null) {
            return true; // illimité
        }

        return $this->documents()->count() < $max;
    }

    /**
     * Vérifie si l'abonnement actuel inclut une fonctionnalité donnée.
     * Retourne true si le plan contient la fonctionnalité active avec ce code.
     */
    public function hasFonctionnalite(string $code): bool
    {
        if (! $this->plan_id) {
            return false;
        }

        return \App\Models\Fonctionnalite::whereHas(
            'plans',
            fn ($q) => $q->where('plans.id', $this->plan_id)
        )
            ->where('code', $code)
            ->where('actif', true)
            ->exists();
    }
}
