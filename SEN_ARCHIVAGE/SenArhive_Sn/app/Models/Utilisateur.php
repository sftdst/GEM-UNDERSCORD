<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class Utilisateur extends Authenticatable
{
    use HasFactory, HasUuid, Notifiable, TwoFactorAuthenticatable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'organisation_id', 'role_id', 'service_id', 'email', 'nom', 'prenom',
        'telephone', 'avatar_url', 'langue', 'timezone',
        'mot_de_passe_hash', 'statut', 'email_verifie', 'mfa_active',
        'mfa_secret', 'derniere_connexion',
    ];

    protected $hidden = [
        'mot_de_passe_hash', 'mfa_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verifie' => 'boolean',
            'mfa_active' => 'boolean',
            'derniere_connexion' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->mot_de_passe_hash;
    }

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe_hash';
    }

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function getNameAttribute(): string
    {
        return $this->nom_complet;
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function departement(): ?Departement
    {
        return $this->service?->departement;
    }

    public function groupes(): BelongsToMany
    {
        return $this->belongsToMany(Groupe::class, 'groupes_utilisateurs')
            ->withPivot('ajoute_le');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'created_by');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class);
    }

    public function notifications_custom(): HasMany
    {
        return $this->hasMany(NotificationCustom::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(TicketSupport::class);
    }
}
