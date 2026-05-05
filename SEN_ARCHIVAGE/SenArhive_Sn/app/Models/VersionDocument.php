<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VersionDocument extends Model
{
    use HasUuid;

    protected $table = 'versions_documents';
    public $timestamps = false;

    protected $fillable = [
        'document_id', 'numero_version', 'nom_fichier', 'taille_octets',
        'hash_sha256', 'chemin_stockage', 'url_stockage', 'commentaire', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'taille_octets' => 'integer',
            'numero_version' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}
