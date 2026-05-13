<?php

namespace App\Services;

use App\Models\Courrier;
use App\Models\CourrierDocument;
use App\Models\CourrierHistorique;
use App\Models\CourrierStatut;
use App\Models\Utilisateur;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourrierService
{
    /**
     * Enregistrer un courrier entrant
     */
    public function creerCourrierEntrant(array $data, ?UploadedFile $fichier = null): Courrier
    {
        return DB::transaction(function () use ($data, $fichier) {
            $courrier = Courrier::create([
                'organisation_id' => auth()->user()->organisation_id,
                'type' => Courrier::TYPE_ENT,
                'numero' => Courrier::genererNumero(Courrier::TYPE_ENT),
                'objet' => $data['objet'],
                'reference' => $data['reference'] ?? null,
                'expediteur_nom' => $data['expediteur_nom'],
                'expediteur_organisation' => $data['expediteur_organisation'] ?? null,
                'expediteur_adresse' => $data['expediteur_adresse'] ?? null,
                'expediteur_email' => $data['expediteur_email'] ?? null,
                'expediteur_telephone' => $data['expediteur_telephone'] ?? null,
                'service_id' => $data['service_id'] ?? null,
                'courrier_type_id' => $data['courrier_type_id'] ?? null,
                'categorie' => $data['categorie'] ?? Courrier::CATEGORIE_ORDINAIRE,
                'urgence' => $data['urgence'] ?? Courrier::URGENCE_NORMAL,
                'moyen_envoi' => $data['moyen_envoi'] ?? null,
                'statut' => Courrier::STATUT_RECU,
                'date_reception' => $data['date_reception'] ?? now(),
                'date_echeance' => $data['date_echeance'] ?? null,
                'observations' => $data['observations'] ?? null,
                'contenu_texte' => $data['contenu_texte'] ?? null,
                'created_by' => auth()->id(),
            ]);

            // Déterminer le statut initial
            $statutActif = CourrierStatut::where('code', 'RECU')->where('organisation_id', auth()->user()->organisation_id)->first();

            $this->ajouterHistorique($courrier->id, 'creation', null, $statutActif?->code ?? 'RECU', null, 'Création du courrier');
            $this->calculerEtAffecterStatut($courrier);

            // Upload pièce jointe
            if ($fichier) {
                $this->uploadDocument($courrier, $fichier);
            }

            // Générer accusé de réception si demandé
            if (!empty($data['generer_accuse_reception'])) {
                $this->genererAccuseReception($courrier);
            }

            // Détecter les doublons
            if (!empty($data['check_doublon'])) {
                $doublon =Courrier::detecterDoublon($data['expediteur_nom'], $data['objet'], $data['date_reception'] ?? now());
                if ($doublon && $doublon->id !== $courrier->id) {
                    // On peut loguer ou notifier mais ne pas bloquer
                }
            }

            return $courrier->load(['service', 'agent', 'documents', 'typeCourrier', 'statutCourrier']);
        });
    }

    /**
     * Enregistrer un courrier sortant
     */
    public function creerCourrierSortant(array $data, ?UploadedFile $fichier = null): Courrier
    {
        return DB::transaction(function () use ($data, $fichier) {
            $courrier = Courrier::create([
                'organisation_id' => auth()->user()->organisation_id,
                'type' => Courrier::TYPE_SOR,
                'numero' => Courrier::genererNumero(Courrier::TYPE_SOR),
                'objet' => $data['objet'],
                'reference' => $data['reference'] ?? null,
                'destinataire_nom' => $data['destinataire_nom'],
                'destinataire_organisation' => $data['destinataire_organisation'] ?? null,
                'destinataire_adresse' => $data['destinataire_adresse'] ?? null,
                'destinataire_email' => $data['destinataire_email'] ?? null,
                'service_id' => $data['service_id'] ?? null,
                'courrier_type_id' => $data['courrier_type_id'] ?? null,
                'categorie' => $data['categorie'] ?? Courrier::CATEGORIE_ORDINAIRE,
                'urgence' => $data['urgence'] ?? Courrier::URGENCE_NORMAL,
                'moyen_envoi' => $data['moyen_envoi'] ?? Courrier::TYPE_SOR,
                'statut' => Courrier::STATUT_TRAITE,
                'date_envoi' => $data['date_envoi'] ?? now(),
                'date_echeance' => $data['date_echeance'] ?? null,
                'observations' => $data['observations'] ?? null,
                'contenu_texte' => $data['contenu_texte'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $statutActif = CourrierStatut::where('code', 'ENVOYE')->where('organisation_id', auth()->user()->organisation_id)->first();
            $this->ajouterHistorique($courrier->id, 'creation', null, $statutActif?->code, null, 'Création courrier sortant');
            $this->calculerEtAffecterStatut($courrier);

            if ($fichier) {
                $this->uploadDocument($courrier, $fichier);
            }

            if (!empty($data['generer_accuse_reception'])) {
                $this->genererAccuseReception($courrier);
            }

            return $courrier->load(['service', 'agent', 'documents', 'typeCourrier', 'statutCourrier']);
        });
    }

    /**
     * Affecter un courrier à un agent
     */
    public function affecter(Courrier $courrier, int $agentId, string $motif = ''): void
    {
        $ancienAgent = $courrier->agent_affecte_id;

        DB::transaction(function () use ($courrier, $agentId, $motif) {
            $courrier->update(['agent_affecte_id' => $agentId, 'statut' => Courrier::STATUT_AFFECTE]);

            $this->ajouterHistorique(
                $courrier->id, 'affectation',
                $ancienAgent, $agentId, null,
                $motif
            );

            // Notification à l'agent
            $agent = Utilisateur::find($agentId);
            if ($agent) {
                CourrierNotification::create([
                    'user_id' => $agentId,
                    'courrier_id' => $courrier->id,
                    'type' => 'affectation',
                    'titre' => 'Nouveau courrier affecté',
                    'message' => "Le courrier {$courrier->numero} ({$courrier->objet}) vous a été affecté.",
                    'lien' => "/courriers/{$courrier->id}",
                ]);
            }
        });
    }

    /**
     * Transférer un courrier vers un autre service/agent
     */
    public function transferer(Courrier $courrier, int $destinataireId, string $motif): void
    {
        $ancienAgent = $courrier->agent_affecte_id;

        DB::transaction(function () use ($courrier, $destinataireId, $motif, $ancienAgent) {
            $courrier->update(['agent_affecte_id' => $destinataireId]);

            $agent = Utilisateur::find($destinataireId);
            $this->ajouterHistorique(
                $courrier->id, 'transfert',
                $ancienAgent, $destinataireId,
                $agent?->nom_complet,
                $motif
            );

            // Notification au nouvel agent
            if ($agent) {
                CourrierNotification::create([
                    'user_id' => $destinataireId,
                    'courrier_id' => $courrier->id,
                    'type' => 'transfert',
                    'titre' => 'Courrier transféré',
                    'message' => "Le courrier {$courrier->numero} ({$courrier->objet}) vous a été transféré.",
                    'lien' => "/courriers/{$courrier->id}",
                ]);
            }
        });
    }

    /**
     * Changer le statut d'un courrier
     */
    public function changerStatut(Courrier $courrier, string $nouveauStatut, string $motif = ''): void
    {
        DB::transaction(function () use ($courrier, $nouveauStatut, $motif) {
            $ancienStatut = $courrier->statut;
            $courrier->update(['statut' => $nouveauStatut]);

            if ($nouveauStatut === Courrier::STATUT_TRAITE) {
                $courrier->update(['date_traitement' => now()]);
            }

            $this->ajouterHistorique(
                $courrier->id, 'statut_change',
                null, null, null,
                $motif,
                $ancienStatut, $nouveauStatut
            );

            // Notification à l'agent affecté
            if ($courrier->agent_affecte_id) {
                CourrierNotification::create([
                    'user_id' => $courrier->agent_affecte_id,
                    'courrier_id' => $courrier->id,
                    'type' => 'statut_change',
                    'titre' => 'Changement de statut',
                    'message' => "Le statut du courrier {$courrier->numero} est passé de {$ancienStatut} à {$nouveauStatut}.",
                    'lien' => "/courriers/{$courrier->id}",
                ]);
            }
        });
    }

    /**
     * Ajouter un commentaire interne
     */
    public function ajouterCommentaire(int $courrierId, string $contenu, bool $interne = true): void
    {
        DB::transaction(function () use ($courrierId, $contenu, $interne) {
            $courrier =Courrier::findOrFail($courrierId);

            $courrier->commentaires()->create([
                'user_id' => auth()->id(),
                'contenu' => $contenu,
                'interne' => $interne,
            ]);

            $this->ajouterHistorique($courrier->id, 'commentaire', null, null, null, $contenu);
        });
    }

    /**
     * Upload d'un document lié à un courrier
     */
    public function uploadDocument(Courrier $courrier, UploadedFile $fichier): CourrierDocument
    {
        $org = auth()->user()->organisation;
        $chemin = "{$org->slug}/courriers/{$courrier->id}/" . Str::uuid() . '.' . $fichier->getClientOriginalExtension();

        Storage::disk('local')->putFileAs(dirname($chemin), $fichier, basename($chemin));

        return CourrierDocument::create([
            'courrier_id' => $courrier->id,
            'nom_fichier' => Str::uuid() . '.' . $fichier->getClientOriginalExtension(),
            'nom_fichier_original' => $fichier->getClientOriginalName(),
            'chemin' => $chemin,
            'mime_type' => $fichier->getMimeType(),
            'taille_octets' => $fichier->getSize(),
            'hash_sha256' => hash_file('sha256', $fichier->getRealPath()),
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Générer un accusé de réception
     */
    public function genererAccuseReception(Courrier $courrier): void
    {
        $courrier->update(['accuse_reception_genere' => true]);
        // Implémenter la génération PDF si nécessaire
    }

    /**
     * Ajouter une entrée dans l'historique
     */
    private function ajouterHistorique(
        string $courrierId,
        string $action,
        $ancienneValeur = null,
        $nouvelleValeur = null,
        $destinataireTransfert = null,
        string $motif = null,
        string $ancienStatut = null,
        string $nouveauStatut = null
    ): void {
        CourrierHistorique::create([
            'courrier_id' => $courrierId,
            'user_id' => auth()->id(),
            'action' => $action,
            'ancien_statut' => $ancienStatut ?? $ancienneValeur,
            'nouveau_statut' => $nouveauStatut ?? $nouvelleValeur,
            'destinataire_transfert' => $destinataireTransfert,
            'motif' => $motif,
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Calculer et assigner automatiquement le statut basé sur les transitions
     */
    private function calculerEtAffecterStatut(Courrier $courrier): void
    {
        $statutActif = CourrierStatut::where('organisation_id', $courrier->organisation_id)
            ->where('code', $courrier->statut)
            ->first();

        if (!$statutActif) {
            $statutDefaut = CourrierStatut::where('organisation_id', $courrier->organisation_id)
                ->where('code', 'RECU')
                ->first();
            if ($statutDefaut) {
                $courrier->update(['courrier_statut_id' => $statutDefaut->id]);
            }
        }
    }

/**
      * Supprimer un courrier (soft delete)
      */
    public function supprimer(Courrier $courrier): void
    {
        $courrier->delete();
    }

    /**
      * Restaurer un courrier supprimé
      */
    public function restaurer(Courrier $courrier): void
    {
        $courrier->restore();
    }

    /**
     * Archiver un courrier (changement statut vers CLOTURE)
     */
    public function archiver(Courrier $courrier, string $motif = ''): void
    {
        DB::transaction(function () use ($courrier, $motif) {
            $ancienStatut = $courrier->statut;
            $courrier->update([
                'statut' => Courrier::STATUT_CLOTURE,
                'date_traitement' => now(),
            ]);

            $this->ajouterHistorique(
                $courrier->id,
                'archivage',
                $ancienStatut,
                Courrier::STATUT_CLOTURE,
                null,
                $motif
            );
        });
    }

    /**
     * Signer électroniquement un courrier (signature parapheur)
     */
    public function signerElectroniquement(Courrier $courrier, string $signatureData): void
    {
        DB::transaction(function () use ($courrier, $signatureData) {
            $courrier->update([
                'statut' => Courrier::STATUT_TRAITE,
                'date_traitement' => now(),
            ]);

            $this->ajouterHistorique(
                $courrier->id,
                'signature',
                null,
                null,
                null,
                'Courrier signé électroniquement'
            );
        });
    }

    /**
     * Générer accusé de réception PDF (implémentation complète)
     */
    public function genererAccuseReceptionPDF(Courrier $courrier): string
    {
        $data = [
            'numero' => $courrier->numero,
            'date' => now()->format('d/m/Y H:i'),
            'objet' => $courrier->objet,
            'expediteur' => $courrier->expediteur_nom,
            'destinataire' => $courrier->destinataire_nom,
            'type' => $courrier->type === Courrier::TYPE_ENT ? 'Entrant' : 'Sortant',
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.accuse-reception', $data);
        $chemin = "{$courrier->id}/accuse-reception-{$courrier->numero}.pdf";
        
        \Storage::disk('local')->put($chemin, $pdf->output());
        $courrier->update(['accuse_reception_genere' => true]);

        return $chemin;
    }

    /**
     * Vérifier intégrité des documents (hash SHA-256)
     */
    public function verifierIntegrite(Courrier $courrier): array
    {
        $resultats = [];
        foreach ($courrier->documents as $doc) {
            $existe = \Storage::disk('local')->exists($doc->chemin);
            $integre = false;
            
            if ($existe) {
                $hash = hash_file('sha256', \Storage::disk('local')->path($doc->chemin));
                $integre = $hash === $doc->hash_sha256;
            }
            
            $resultats[] = [
                'document_id' => $doc->id,
                'nom' => $doc->nom_fichier_original,
                'existe' => $existe,
                'integre' => $integre,
            ];
        }
        return $resultats;
    }
}