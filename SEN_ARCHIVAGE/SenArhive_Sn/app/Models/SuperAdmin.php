<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Organisation;
use App\Models\Role;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class SuperAdmin extends Authenticatable
{
    use HasFactory, HasUuid, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    protected $table = 'super_admins';

    protected $fillable = [
        'email', 'nom', 'prenom', 'telephone', 'avatar_url',
        'mot_de_passe_hash', 'statut', 'mfa_active', 'mfa_secret',
        'email_verifie', 'derniere_connexion',
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
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
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

    /**
     * Relations
     */
    public function journalActivites(): HasMany
    {
        return $this->hasMany(JournalActivite::class, 'super_admin_id');
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class, 'organisation_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
