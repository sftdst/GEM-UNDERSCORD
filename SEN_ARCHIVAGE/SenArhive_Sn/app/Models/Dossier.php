<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Dossier extends Model
{
    use HasUuid, BelongsToOrganisation;

    protected $table = 'dossiers';

    protected $fillable = [
        'organisation_id', 'espace_id', 'parent_id', 'nom',
        'description', 'chemin', 'niveau', 'couleur', 'icone', 'created_by', 'qr_token',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Dossier $dossier) {
            if (empty($dossier->qr_token)) {
                $dossier->qr_token = Str::random(32);
            }
        });
    }

    public function espace(): BelongsTo
    {
        return $this->belongsTo(Espace::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'parent_id');
    }

    public function enfants(): HasMany
    {
        return $this->hasMany(Dossier::class, 'parent_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
