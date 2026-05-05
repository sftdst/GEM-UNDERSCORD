<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LienPartage extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'liens_partage';
    public $timestamps = false;

    protected $fillable = [
        'organisation_id', 'document_id', 'dossier_id', 'token',
        'mot_de_passe', 'peut_telecharger', 'type_acces', 'expire_le',
        'max_telechargements', 'nb_telechargements', 'created_by',
    ];

    protected $hidden = ['mot_de_passe'];

    protected function casts(): array
    {
        return [
            'peut_telecharger' => 'boolean',
            'expire_le' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected $appends = ['est_protege'];

    public function getEstProtegeAttribute(): bool
    {
        return !is_null($this->mot_de_passe);
    }

    public function document(): BelongsTo { return $this->belongsTo(Document::class); }
    public function dossier(): BelongsTo { return $this->belongsTo(Dossier::class); }
    public function createur(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'created_by'); }

    public function utilisateursAutorises(): BelongsToMany
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'partage_acces_utilisateurs',
            'lien_partage_id',
            'utilisateur_id'
        );
    }
}
