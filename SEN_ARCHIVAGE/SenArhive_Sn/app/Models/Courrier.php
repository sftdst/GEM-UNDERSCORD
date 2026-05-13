<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Courrier extends Model
{
    use HasUuid, BelongsToOrganisation, SoftDeletes;

    protected $table = 'courriers';
    const DELETED_AT = 'deleted_at';

    protected $fillable = [
        'organisation_id', 'service_id', 'agent_affecte_id',
        'courrier_type_id', 'courrier_statut_id',
        'numero', 'type', 'objet', 'reference',
        'expediteur_nom', 'expediteur_organisation', 'expediteur_adresse',
        'expediteur_email', 'expediteur_telephone',
        'destinataire_nom', 'destinataire_organisation', 'destinataire_adresse',
        'destinataire_email',
        'categorie', 'urgence', 'moyen_envoi', 'statut',
        'date_reception', 'date_envoi', 'date_echeance', 'date_traitement',
        'observations', 'contenu_texte',
        'created_by', 'parent_courrier_id',
        'hash_sha256', 'version_courante', 'accuse_reception_genere',
    ];

    protected $casts = [
        'date_reception' => 'datetime',
        'date_envoi' => 'datetime',
        'date_echeance' => 'date',
        'date_traitement' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Statuts possibles
    const STATUT_RECU = 'RECU';
    const STATUT_AFFECTE = 'AFFECTE';
    const STATUT_EN_COURS = 'EN_COURS';
    const STATUT_TRAITE = 'TRAITE';
    const STATUT_CLOTURE = 'CLOTURE';

    public static $statuts = [
        self::STATUT_RECU => 'Reçu',
        self::STATUT_AFFECTE => 'Affecté',
        self::STATUT_EN_COURS => 'En cours',
        self::STATUT_TRAITE => 'Traité',
        self::STATUT_CLOTURE => 'Clôturé',
    ];

    // Urgences
    const URGENCE_NORMAL = 'Normal';
    const URGENCE_URGENT = 'Urgent';
    const URGENCE_TRES_URGENT = 'TresUrgent';

    public static $urgences = [
        self::URGENCE_NORMAL => ['label' => 'Normal', 'couleur' => '#22c55e'],
        self::URGENCE_URGENT => ['label' => 'Urgent', 'couleur' => '#f59e0b'],
        self::URGENCE_TRES_URGENT => ['label' => 'Très urgent', 'couleur' => '#ef4444'],
    ];

    // Types
    const TYPE_ENT = 'ENT';
    const TYPE_SOR = 'SOR';

    // Catégories
    const CATEGORIE_ORDINAIRE = 'Ordinaire';
    const CATEGORIE_CONFIDENTIEL = 'Confidentiel';
    const CATEGORIE_FACTURE = 'Facture';
    const CATEGORIE_JURIDIQUE = 'Juridique';
    const CATEGORIE_RH = 'RH';
    const CATEGORIE_AUTRE = 'Autre';

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'agent_affecte_id');
    }

    public function typeCourrier(): BelongsTo
    {
        return $this->belongsTo(CourrierType::class, 'courrier_type_id');
    }

    public function statutCourrier(): BelongsTo
    {
        return $this->belongsTo(CourrierStatut::class, 'courrier_statut_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Courrier::class, 'parent_courrier_id');
    }

    public function historiques(): HasMany
    {
        return $this->hasMany(CourrierHistorique::class)->orderBy('created_at', 'asc');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(CourrierCommentaire::class)->orderBy('created_at', 'asc');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CourrierDocument::class)->orderBy('created_at', 'desc');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(CourrierNotification::class);
    }

    public function alertes(): HasMany
    {
        return $this->hasMany(CourrierAlerte::class);
    }

    public function dossiers()
    {
        return $this->belongsToMany(Dossier::class, 'courrier_dossier');
    }

    // Génère un numéro unique
    public static function genererNumero(string $type, int $annee = null): string
    {
        $annee = $annee ?? (int) date('Y');
        $compteur = self::where('type', $type)
            ->whereYear('created_at', $annee)
            ->count() + 1;
        $prefix = ($type === self::TYPE_ENT) ? 'ENT' : 'SOR';
        return sprintf('%s-%d-%04d', $prefix, $annee, $compteur);
    }

    // Vérifie les doublons
    public static function detecterDoublon(string $expediteur, string $objet, $dateReception): ?self
    {
        $dateDebut = is_string($dateReception) ? $dateReception : $dateReception->toDateString();
        $dateFin = date('Y-m-d H:i:s', strtotime($dateDebut . ' + 30 days'));

        return self::where('expediteur_nom', $expediteur)
            ->where('objet', $objet)
            ->whereBetween('date_reception', [$dateDebut, $dateFin])
            ->first();
    }

    public function getEstEnRetardAttribute(): bool
    {
        if ($this->statut === self::STATUT_CLOTURE) return false;
        return $this->date_echeance && $this->date_echeance->isPast();
    }

    public function getJoursRetardAttribute(): ?int
    {
        if (!$this->est_en_retard || !$this->date_echeance) return null;
        return max(0, (int) now()->diffInDays($this->date_echeance, false));
    }

    public function getEstUrgentAttribute(): bool
    {
        return in_array($this->urgence, [self::URGENCE_URGENT, self::URGENCE_TRES_URGENT]);
    }

    public function getCouleurUrgenceAttribute(): string
    {
        return self::$urgences[$this->urgence]['couleur'] ?? '#6b7280';
    }

    public function getStatutBadgeCouleurAttribute(): string
    {
        return match($this->statut) {
            self::STATUT_RECU => '#6366f1',
            self::STATUT_AFFECTE => '#f59e0b',
            self::STATUT_EN_COURS => '#3b82f6',
            self::STATUT_TRAITE => '#10b981',
            self::STATUT_CLOTURE => '#6b7280',
            default => '#6b7280',
        };
    }
}