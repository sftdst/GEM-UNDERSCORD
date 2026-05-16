<?php

namespace App\Services;

use App\Models\Dossier;
use App\Models\Espace;
use App\Models\Utilisateur;
use App\Models\Gmp\GmpPieceRequise;
use App\Models\Gmp\GmpSoumission;
use App\Models\Gmp\GmpSoumissionPiece;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class GmpArchivageService
{
    public function __construct(
        private readonly DocumentStorageService $storage
    ) {}

    /**
     * Archive tous les fichiers d'une soumission et crée la structure de dossiers.
     *
     * Structure :
     *   Espace "Marchés Publics (GMP)"
     *     └── Offres GMP/
     *           └── {AO.numero_aao}/
     *                 └── {Fournisseur_slug}/
     *                       ├── piece1.pdf
     *                       └── piece2.docx
     *
     * @param GmpSoumission          $soumission     Soumission déjà persistée avec appelOffre + fournisseur chargés
     * @param array<string, UploadedFile> $uploadedFiles  [piece_requise_id => UploadedFile]
     * @param Utilisateur            $user
     */
    public function archiverSoumission(
        GmpSoumission $soumission,
        array $uploadedFiles,
        Utilisateur $user
    ): void {
        if (empty($uploadedFiles)) {
            return;
        }

        $orgId      = $soumission->organisation_id;
        $ao         = $soumission->appelOffre;
        $fournisseur = $soumission->fournisseur;

        // 1. Espace GMP (find or create)
        $espace = $this->findOrCreateEspace($orgId, $user);

        // 2. Dossier racine "Offres GMP"
        $dossierOffres = $this->findOrCreateDossier(
            espace: $espace,
            orgId: $orgId,
            parentId: null,
            nom: 'Offres GMP',
            niveau: 1,
            user: $user
        );

        // 3. Sous-dossier par référence d'AO
        $dossierAo = $this->findOrCreateDossier(
            espace: $espace,
            orgId: $orgId,
            parentId: $dossierOffres->id,
            nom: $ao->numero_aao,
            niveau: 2,
            user: $user
        );

        // 4. Sous-dossier par fournisseur (slug pour éviter les caractères spéciaux)
        $nomFournisseur = Str::slug($fournisseur->raison_sociale, '_');
        $dossierFournisseur = $this->findOrCreateDossier(
            espace: $espace,
            orgId: $orgId,
            parentId: $dossierAo->id,
            nom: $nomFournisseur,
            niveau: 3,
            user: $user
        );

        // 5. Upload chaque fichier lié à une pièce requise
        foreach ($uploadedFiles as $pieceId => $file) {
            /** @var GmpPieceRequise|null $piece */
            $piece = GmpPieceRequise::find($pieceId);
            if (!$piece || !$file instanceof UploadedFile) {
                continue;
            }

            $document = $this->storage->upload($file, $user, $dossierFournisseur->id, [
                'titre'       => "{$piece->libelle} — {$fournisseur->raison_sociale}",
                'description' => "Soumission {$soumission->reference_soumission} / AO {$ao->numero_aao}",
                'metadonnees' => [
                    'gmp_soumission_id'  => $soumission->id,
                    'gmp_ao_id'          => $ao->id,
                    'gmp_fournisseur_id'  => $fournisseur->id,
                    'gmp_piece_id'        => $piece->id,
                    'type'               => 'gmp_soumission_piece',
                ],
            ]);

            GmpSoumissionPiece::create([
                'id'                   => (string) Str::uuid(),
                'organisation_id'      => $orgId,
                'soumission_id'        => $soumission->id,
                'piece_requise_id'     => $piece->id,
                'document_id'          => $document->id,
                'nom_fichier_original' => $file->getClientOriginalName(),
                'taille_octets'        => $file->getSize(),
                'statut'               => 'uploade',
            ]);
        }
    }

    /**
     * Archive des fichiers libres (sans pièce requise définie) pour une soumission.
     *
     * @param GmpSoumission        $soumission    Soumission avec appelOffre + fournisseur chargés
     * @param UploadedFile[]       $freeFiles     Fichiers libres à archiver
     * @param Utilisateur          $user
     */
    public function archiverDocumentsLibres(
        GmpSoumission $soumission,
        array $freeFiles,
        Utilisateur $user
    ): void {
        if (empty($freeFiles)) {
            return;
        }

        $orgId       = $soumission->organisation_id;
        $ao          = $soumission->appelOffre;
        $fournisseur = $soumission->fournisseur;

        $espace             = $this->findOrCreateEspace($orgId, $user);
        $dossierOffres      = $this->findOrCreateDossier($espace, $orgId, null, 'Offres GMP', 1, $user);
        $dossierAo          = $this->findOrCreateDossier($espace, $orgId, $dossierOffres->id, $ao->numero_aao, 2, $user);
        $nomFournisseur     = Str::slug($fournisseur->raison_sociale, '_');
        $dossierFournisseur = $this->findOrCreateDossier($espace, $orgId, $dossierAo->id, $nomFournisseur, 3, $user);

        foreach ($freeFiles as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $libelle  = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $document = $this->storage->upload($file, $user, $dossierFournisseur->id, [
                'titre'       => "{$libelle} — {$fournisseur->raison_sociale}",
                'description' => "Soumission {$soumission->reference_soumission} / AO {$ao->numero_aao}",
                'metadonnees' => [
                    'gmp_soumission_id'  => $soumission->id,
                    'gmp_ao_id'          => $ao->id,
                    'gmp_fournisseur_id'  => $fournisseur->id,
                    'type'               => 'gmp_soumission_document_libre',
                ],
            ]);

            GmpSoumissionPiece::create([
                'id'                   => (string) Str::uuid(),
                'organisation_id'      => $orgId,
                'soumission_id'        => $soumission->id,
                'piece_requise_id'     => null,
                'libelle_libre'        => $libelle,
                'document_id'          => $document->id,
                'nom_fichier_original' => $file->getClientOriginalName(),
                'taille_octets'        => $file->getSize(),
                'statut'               => 'uploade',
            ]);
        }
    }

    private function findOrCreateEspace(string $orgId, Utilisateur $user): Espace
    {
        return Espace::firstOrCreate(
            ['organisation_id' => $orgId, 'nom' => 'Marchés Publics (GMP)'],
            [
                'id'         => (string) Str::uuid(),
                'couleur'    => '#6366f1',
                'icone'      => 'scale',
                'created_by' => $user->id,
            ]
        );
    }

    private function findOrCreateDossier(
        Espace $espace,
        string $orgId,
        ?string $parentId,
        string $nom,
        int $niveau,
        Utilisateur $user
    ): Dossier {
        $query = Dossier::where('organisation_id', $orgId)
            ->where('espace_id', $espace->id)
            ->where('nom', $nom);

        if ($parentId !== null) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        $existing = $query->first();
        if ($existing) {
            return $existing;
        }

        return Dossier::create([
            'id'              => (string) Str::uuid(),
            'organisation_id' => $orgId,
            'espace_id'       => $espace->id,
            'parent_id'       => $parentId,
            'nom'             => $nom,
            'niveau'          => $niveau,
            'created_by'      => $user->id,
        ]);
    }
}
