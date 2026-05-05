<?php

namespace App\Models;

use App\Traits\BelongsToOrganisation;
use App\Traits\HasUuid;
use App\Models\DocumentSignature;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasUuid, BelongsToOrganisation, SoftDeletes;

    protected $table = 'documents';
    const DELETED_AT = 'deleted_at';

    protected $fillable = [
        'organisation_id', 'service_id', 'dossier_id', 'categorie_id', 'titre',
        'numero_document', 'date_document',
        'description', 'nom_fichier_original', 'extension', 'type_mime',
        'taille_octets', 'statut', 'version_courante', 'est_chiffre',
        'hash_sha256', 'date_expiration', 'date_archivage', 'metadonnees', 'texte_extrait',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'metadonnees' => 'array',
            'est_chiffre' => 'boolean',
            'taille_octets' => 'integer',
            'version_courante' => 'integer',
            'date_expiration' => 'date',
            'date_archivage' => 'date',
            'date_document' => 'date',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Categorie::class);
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'created_by');
    }

    public function modificateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'updated_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(VersionDocument::class)->orderBy('numero_version', 'desc');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'documents_tags');
    }

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class);
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(PermissionDocument::class);
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(DocumentSignature::class);
    }

    public function derniereVersion()
    {
        return $this->hasOne(VersionDocument::class)
            ->whereRaw('"versions_documents"."numero_version" = (SELECT MAX("numero_version") FROM "versions_documents" AS "vd_latest" WHERE "vd_latest"."document_id" = "versions_documents"."document_id")');
    }

    public function getTailleFormateeAttribute(): string
    {
        $bytes = $this->taille_octets;
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' Go';
        if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' Mo';
        if ($bytes >= 1024) return round($bytes / 1024, 2) . ' Ko';
        return $bytes . ' octets';
    }
}
