<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Utilisateur;
use App\Models\VersionDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;

class DocumentFusionService
{
    private const TYPES_PDF   = ['pdf'];
    private const TYPES_TEXTE = ['txt', 'csv', 'log', 'md'];

    /** Extensions supportées pour la fusion */
    public function peutFusionner(string $extension): bool
    {
        $ext = strtolower($extension);
        return in_array($ext, array_merge(self::TYPES_PDF, self::TYPES_TEXTE));
    }

    /**
     * Fusionne plusieurs documents de même extension en un nouveau document.
     *
     * @param Document[] $documents
     */
    public function fusionner(
        array      $documents,
        string     $titre,
        Utilisateur $user,
        ?string    $dossierId   = null,
        ?string    $description = null
    ): Document {
        $extension = strtolower($documents[0]->extension);

        // Vérification homogénéité des extensions
        foreach ($documents as $doc) {
            if (strtolower($doc->extension) !== $extension) {
                throw new \InvalidArgumentException(
                    'Tous les documents sélectionnés doivent avoir la même extension.'
                );
            }
        }

        if (!$this->peutFusionner($extension)) {
            throw new \InvalidArgumentException(
                "La fusion de fichiers .{$extension} n'est pas supportée. " .
                'Seuls les PDF et les fichiers texte (.txt, .csv, .log, .md) sont pris en charge.'
            );
        }

        // Collecter les chemins physiques
        $paths = [];
        foreach ($documents as $doc) {
            $version = $doc->derniereVersion;
            if (!$version) {
                throw new \RuntimeException("Le document « {$doc->titre} » n'a pas de version disponible.");
            }
            $paths[] = Storage::disk('local')->path($version->chemin_stockage);
        }

        // Produire le fichier fusionné dans un fichier temporaire
        $tempPath = sys_get_temp_dir() . '/' . Str::uuid() . '.' . $extension;

        if (in_array($extension, self::TYPES_PDF)) {
            $this->fusionnerPdf($paths, $tempPath);
        } else {
            $this->fusionnerTexte($paths, $tempPath);
        }

        // Stocker et créer le Document + VersionDocument
        $organisation   = $user->organisation;
        $docId          = (string) Str::uuid();
        $taille         = filesize($tempPath);
        $hash           = hash_file('sha256', $tempPath);
        $cheminStockage = "{$organisation->slug}/{$docId}/1.{$extension}";

        Storage::disk('local')->put($cheminStockage, file_get_contents($tempPath));
        @unlink($tempPath);

        $document = Document::create([
            'id'                   => $docId,
            'organisation_id'      => $organisation->id,
            'service_id'           => $user->service_id,
            'dossier_id'           => $dossierId,
            'titre'                => $titre,
            'description'          => $description,
            'nom_fichier_original' => Str::slug($titre) . '.' . $extension,
            'extension'            => $extension,
            'type_mime'            => $this->getMimeType($extension),
            'taille_octets'        => $taille,
            'statut'               => 'actif',
            'version_courante'     => 1,
            'hash_sha256'          => $hash,
            'metadonnees'          => [
                'fusion'  => true,
                'sources' => collect($documents)->pluck('id')->toArray(),
            ],
            'created_by'           => $user->id,
        ]);

        VersionDocument::create([
            'document_id'     => $document->id,
            'numero_version'  => 1,
            'nom_fichier'     => $document->nom_fichier_original,
            'taille_octets'   => $taille,
            'hash_sha256'     => $hash,
            'chemin_stockage' => $cheminStockage,
            'commentaire'     => 'Fusion de ' . count($documents) . ' document(s)',
            'created_by'      => $user->id,
        ]);

        $organisation->increment('stockage_utilise_mo', (int) ceil($taille / 1048576));

        return $document;
    }

    // ── Fusion PDF ────────────────────────────────────────────────────────────────

    private function fusionnerPdf(array $paths, string $outputPath): void
    {
        $fpdi = new Fpdi();

        foreach ($paths as $path) {
            try {
                $pageCount = $fpdi->setSourceFile($path);
                for ($i = 1; $i <= $pageCount; $i++) {
                    $tpl  = $fpdi->importPage($i);
                    $size = $fpdi->getTemplateSize($tpl);
                    $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                    $fpdi->AddPage($orientation, [$size['width'], $size['height']]);
                    $fpdi->useTemplate($tpl);
                }
            } catch (\Exception $e) {
                throw new \RuntimeException(
                    "Impossible de lire le fichier PDF « " . basename($path) . " » : " . $e->getMessage()
                );
            }
        }

        $fpdi->Output('F', $outputPath);
    }

    // ── Fusion texte ──────────────────────────────────────────────────────────────

    private function fusionnerTexte(array $paths, string $outputPath): void
    {
        $parts = [];
        foreach ($paths as $path) {
            $parts[] = file_get_contents($path);
        }
        file_put_contents($outputPath, implode("\n\n" . str_repeat('-', 60) . "\n\n", $parts));
    }

    // ── Helper MIME type ──────────────────────────────────────────────────────────

    private function getMimeType(string $extension): string
    {
        return match ($extension) {
            'pdf'  => 'application/pdf',
            'txt'  => 'text/plain',
            'csv'  => 'text/csv',
            'md'   => 'text/markdown',
            'log'  => 'text/plain',
            default => 'application/octet-stream',
        };
    }
}
