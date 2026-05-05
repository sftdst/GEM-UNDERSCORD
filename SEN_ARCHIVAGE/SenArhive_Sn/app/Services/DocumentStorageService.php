<?php

namespace App\Services;

use App\Exceptions\PlanLimitException;
use App\Models\Document;
use App\Models\Organisation;
use App\Models\Utilisateur;
use App\Models\VersionDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentStorageService
{
    public function upload(UploadedFile $file, Utilisateur $user, ?string $dossierId = null, array $meta = []): Document
    {
        $organisation = $user->organisation;

        if (!$organisation->hasStorageCapacity($file->getSize())) {
            $limiteMo = $organisation->getStorageLimitMo();
            $limiteGo = round($limiteMo / 1024, 1);
            throw new PlanLimitException(
                "Limite de stockage atteinte ({$limiteGo} Go). Impossible d'uploader ce fichier."
            );
        }

        if (!$organisation->hasDocumentCapacity()) {
            $max = $organisation->plan->documents_max;
            throw new PlanLimitException(
                "Limite de documents atteinte. Votre plan est limité à {$max} documents."
            );
        }

        $docId = (string) Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension());
        $hash = hash_file('sha256', $file->getRealPath());
        $cheminStockage = "{$organisation->slug}/{$docId}/1.{$extension}";

        Storage::disk('local')->putFileAs(
            dirname($cheminStockage),
            $file,
            basename($cheminStockage)
        );

        $document = Document::create([
            'id' => $docId,
            'organisation_id' => $organisation->id,
            'service_id' => $user->service_id,
            'dossier_id' => $dossierId,
            'categorie_id' => $meta['categorie_id'] ?? null,
            'date_archivage' => $meta['date_archivage'] ?? null,
            'titre' => $meta['titre'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'description' => $meta['description'] ?? null,
            'nom_fichier_original' => $file->getClientOriginalName(),
            'extension' => $extension,
            'type_mime' => $file->getMimeType(),
            'taille_octets' => $file->getSize(),
            'statut' => 'actif',
            'version_courante' => 1,
            'hash_sha256' => $hash,
            'metadonnees' => $meta['metadonnees'] ?? [],
            'created_by' => $user->id,
        ]);

        VersionDocument::create([
            'document_id' => $document->id,
            'numero_version' => 1,
            'nom_fichier' => $file->getClientOriginalName(),
            'taille_octets' => $file->getSize(),
            'hash_sha256' => $hash,
            'chemin_stockage' => $cheminStockage,
            'commentaire' => 'Version initiale',
            'created_by' => $user->id,
        ]);

        $organisation->increment('stockage_utilise_mo', (int) ceil($file->getSize() / 1048576));

        return $document;
    }

    public function download(Document $document): StreamedResponse
    {
        $version = $document->derniereVersion;
        if (!$version) {
            abort(404, 'Aucune version disponible');
        }

        return Storage::disk('local')->download(
            $version->chemin_stockage,
            $document->nom_fichier_original
        );
    }

    public function newVersion(Document $document, UploadedFile $file, Utilisateur $user, ?string $commentaire = null): VersionDocument
    {
        $organisation = $user->organisation;

        if (!$organisation->hasStorageCapacity($file->getSize())) {
            $limiteMo = $organisation->getStorageLimitMo();
            $limiteGo = round($limiteMo / 1024, 1);
            throw new PlanLimitException(
                "Limite de stockage atteinte ({$limiteGo} Go). Impossible d'uploader cette nouvelle version."
            );
        }

        $newVersion = $document->version_courante + 1;
        $extension = strtolower($file->getClientOriginalExtension());
        $hash = hash_file('sha256', $file->getRealPath());
        $cheminStockage = "{$organisation->slug}/{$document->id}/{$newVersion}.{$extension}";

        Storage::disk('local')->putFileAs(
            dirname($cheminStockage),
            $file,
            basename($cheminStockage)
        );

        $version = VersionDocument::create([
            'document_id' => $document->id,
            'numero_version' => $newVersion,
            'nom_fichier' => $file->getClientOriginalName(),
            'taille_octets' => $file->getSize(),
            'hash_sha256' => $hash,
            'chemin_stockage' => $cheminStockage,
            'commentaire' => $commentaire,
            'created_by' => $user->id,
        ]);

        $document->update([
            'version_courante' => $newVersion,
            'taille_octets' => $file->getSize(),
            'hash_sha256' => $hash,
            'extension' => $extension,
            'type_mime' => $file->getMimeType(),
            'nom_fichier_original' => $file->getClientOriginalName(),
            'updated_by' => $user->id,
        ]);

        $organisation->increment('stockage_utilise_mo', (int) ceil($file->getSize() / 1048576));

        return $version;
    }

    public function delete(Document $document): void
    {
        $totalSize = $document->versions()->sum('taille_octets');
        $document->delete();
        $document->organisation->decrement('stockage_utilise_mo', (int) ceil($totalSize / 1048576));
    }
}
