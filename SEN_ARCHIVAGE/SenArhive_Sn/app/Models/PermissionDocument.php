<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermissionDocument extends Model
{
    use HasUuid;

    protected $table = 'permissions_documents';
    public $timestamps = false;

    protected $fillable = [
        'document_id', 'dossier_id', 'espace_id',
        'utilisateur_id', 'groupe_id',
        'peut_lire', 'peut_ecrire', 'peut_supprimer',
        'peut_partager', 'peut_telecharger', 'peut_commenter',
        'expire_le', 'accorde_par',
    ];

    protected function casts(): array
    {
        return [
            'peut_lire' => 'boolean',
            'peut_ecrire' => 'boolean',
            'peut_supprimer' => 'boolean',
            'peut_partager' => 'boolean',
            'peut_telecharger' => 'boolean',
            'peut_commenter' => 'boolean',
            'expire_le' => 'datetime',
        ];
    }

    public function document(): BelongsTo { return $this->belongsTo(Document::class); }
    public function dossier(): BelongsTo { return $this->belongsTo(Dossier::class); }
    public function espace(): BelongsTo { return $this->belongsTo(Espace::class); }
    public function utilisateur(): BelongsTo { return $this->belongsTo(Utilisateur::class); }
    public function groupe(): BelongsTo { return $this->belongsTo(Groupe::class); }
    public function accordePar(): BelongsTo { return $this->belongsTo(Utilisateur::class, 'accorde_par'); }
}
