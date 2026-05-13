<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourrierDocument extends Model
{
    use HasUuid;
    protected $table = 'courrier_documents';
    public $timestamps = true;

    protected $fillable = [
        'courrier_id','nom_fichier','nom_fichier_original',
        'chemin','mime_type','taille_octets','hash_sha256','created_by',
    ];

    public function courrier(): BelongsTo
    {
        return $this->belongsTo(Courrier::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }
}