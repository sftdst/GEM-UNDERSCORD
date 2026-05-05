<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Pipeline;
use App\Models\PipelineAnnotation;
use App\Models\PipelineEtape;
use App\Models\PipelineEtapeInstance;
use App\Models\PipelineHistorique;
use App\Models\PipelineInstance;
use App\Models\Utilisateur;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PipelineService
{
    /**
     * Initier un pipeline pour un document.
     */
    public function initier(Pipeline $pipeline, Document $document, Utilisateur $user, ?string $commentaire = null): PipelineInstance
    {
        if (!$pipeline->isActif()) {
            throw ValidationException::withMessages(['pipeline' => 'Ce pipeline est inactif.']);
        }

        $etapes = $pipeline->etapes()->orderBy('ordre')->get();

        if ($etapes->isEmpty()) {
            throw ValidationException::withMessages(['pipeline' => 'Ce pipeline ne contient aucune étape.']);
        }

        return DB::transaction(function () use ($pipeline, $document, $user, $commentaire, $etapes) {
            $instance = PipelineInstance::create([
                'pipeline_id'      => $pipeline->id,
                'document_id'      => $document->id,
                'statut'           => 'en_cours',
                'etape_courante_id' => null,
                'initie_par'       => $user->id,
                'commentaire_init' => $commentaire,
            ]);

            // Créer toutes les étapes instances
            $etapeInstances = [];
            foreach ($etapes as $etape) {
                $etapeInstances[] = PipelineEtapeInstance::create([
                    'instance_id' => $instance->id,
                    'etape_id'    => $etape->id,
                    'ordre'       => $etape->ordre,
                    'statut'      => 'en_attente',
                ]);
            }

            // Activer la première étape
            $premiereEtape = $etapeInstances[0];
            $premiereEtape->update(['statut' => 'en_cours']);
            $instance->update(['etape_courante_id' => $premiereEtape->id]);

            $this->enregistrerHistorique(
                instance: $instance,
                etapeInstance: $premiereEtape,
                user: $user,
                action: 'initiation',
                ancienStatut: null,
                nouveauStatut: 'en_cours',
                commentaire: $commentaire,
            );

            return $instance->fresh(['pipeline', 'document', 'initiateur', 'etapeCourante', 'etapeInstances.etape']);
        });
    }

    /**
     * Valider l'étape courante et passer à la suivante.
     */
    public function valider(PipelineInstance $instance, Utilisateur $user, ?string $commentaire = null, ?UploadedFile $fichier = null): PipelineInstance
    {
        $etapeInstance = $instance->etapeCourante;

        if (!$etapeInstance || !$etapeInstance->isTraitable()) {
            throw ValidationException::withMessages(['statut' => 'Cette étape ne peut pas être validée.']);
        }

        $etapeTemplate = $etapeInstance->etape;

        $this->verifierAutorisation($etapeInstance, $user);

        // Créer l'annotation avec fichier avant la vérification des obligations
        if ($fichier) {
            $this->annoter($etapeInstance, $user, $commentaire ?? 'Fichier joint à la validation', $fichier);
            $commentaire = null; // évite le doublon dans le commentaire de validation
        }

        $this->verifierObligations($etapeTemplate, $etapeInstance, $commentaire);

        return DB::transaction(function () use ($instance, $etapeInstance, $etapeTemplate, $user, $commentaire) {
            $ancienStatut = $etapeInstance->statut;

            $etapeInstance->update([
                'statut'      => 'valide',
                'traite_par'  => $user->id,
                'commentaire' => $commentaire,
                'traite_le'   => now(),
            ]);

            $this->enregistrerHistorique(
                instance: $instance,
                etapeInstance: $etapeInstance,
                user: $user,
                action: 'validation',
                ancienStatut: $ancienStatut,
                nouveauStatut: 'valide',
                commentaire: $commentaire,
            );

            // Chercher l'étape suivante
            $prochaineEtapeInstance = $instance->etapeInstances()
                ->where('ordre', '>', $etapeTemplate->ordre)
                ->orderBy('ordre')
                ->first();

            if ($prochaineEtapeInstance) {
                $prochaineEtapeInstance->update(['statut' => 'en_cours']);
                $instance->update(['etape_courante_id' => $prochaineEtapeInstance->id]);

                $this->enregistrerHistorique(
                    instance: $instance,
                    etapeInstance: $prochaineEtapeInstance,
                    user: $user,
                    action: 'transition',
                    ancienStatut: 'en_attente',
                    nouveauStatut: 'en_cours',
                    commentaire: 'Passage automatique à l\'étape suivante',
                );
            } else {
                // Toutes les étapes sont validées
                $instance->update([
                    'statut'           => 'complete',
                    'etape_courante_id' => null,
                ]);

                $this->enregistrerHistorique(
                    instance: $instance,
                    etapeInstance: null,
                    user: $user,
                    action: 'completion',
                    ancienStatut: 'en_cours',
                    nouveauStatut: 'complete',
                    commentaire: 'Pipeline terminé avec succès',
                );
            }

            return $instance->fresh(['pipeline', 'document', 'initiateur', 'etapeCourante.etape', 'etapeInstances.etape', 'historique.utilisateur']);
        });
    }

    /**
     * Rejeter l'étape courante avec motif obligatoire.
     */
    public function rejeter(PipelineInstance $instance, Utilisateur $user, string $motif, ?string $etapeRetourId = null): PipelineInstance
    {
        $etapeInstance = $instance->etapeCourante;

        if (!$etapeInstance || !$etapeInstance->isTraitable()) {
            throw ValidationException::withMessages(['statut' => 'Cette étape ne peut pas être rejetée.']);
        }

        $etapeTemplate = $etapeInstance->etape;
        $this->verifierAutorisation($etapeInstance, $user);

        return DB::transaction(function () use ($instance, $etapeInstance, $etapeTemplate, $user, $motif, $etapeRetourId) {
            $ancienStatut = $etapeInstance->statut;

            $etapeInstance->update([
                'statut'      => 'rejete',
                'traite_par'  => $user->id,
                'motif_rejet' => $motif,
                'traite_le'   => now(),
            ]);

            $this->enregistrerHistorique(
                instance: $instance,
                etapeInstance: $etapeInstance,
                user: $user,
                action: 'rejet',
                ancienStatut: $ancienStatut,
                nouveauStatut: 'rejete',
                commentaire: $motif,
                donnees: ['motif_rejet' => $motif],
            );

            // Déterminer l'étape de retour
            $etapeRetour = $this->determinerEtapeRetour($instance, $etapeTemplate, $etapeRetourId);

            if ($etapeRetour) {
                // Remettre l'étape de retour en retour_modification
                $etapeRetour->update([
                    'statut'      => 'retour_modification',
                    'traite_par'  => null,
                    'traite_le'   => null,
                    'commentaire' => null,
                    'motif_rejet' => null,
                ]);
                $instance->update(['etape_courante_id' => $etapeRetour->id]);

                $this->enregistrerHistorique(
                    instance: $instance,
                    etapeInstance: $etapeRetour,
                    user: $user,
                    action: 'transition',
                    ancienStatut: 'valide',
                    nouveauStatut: 'retour_modification',
                    commentaire: 'Retour suite au rejet : ' . $motif,
                );
            } else {
                // Pas d'étape de retour = pipeline rejeté définitivement
                $instance->update([
                    'statut'           => 'rejete',
                    'etape_courante_id' => null,
                ]);

                $this->enregistrerHistorique(
                    instance: $instance,
                    etapeInstance: null,
                    user: $user,
                    action: 'rejet_final',
                    ancienStatut: 'en_cours',
                    nouveauStatut: 'rejete',
                    commentaire: $motif,
                );
            }

            return $instance->fresh(['pipeline', 'document', 'initiateur', 'etapeCourante.etape', 'etapeInstances.etape', 'historique.utilisateur']);
        });
    }

    /**
     * Demander une correction à l'étape précédente.
     */
    public function demanderCorrection(PipelineInstance $instance, Utilisateur $user, string $commentaire): PipelineInstance
    {
        $etapeInstance = $instance->etapeCourante;

        if (!$etapeInstance || !$etapeInstance->isTraitable()) {
            throw ValidationException::withMessages(['statut' => 'Action non disponible pour cette étape.']);
        }

        $etapeTemplate = $etapeInstance->etape;
        $this->verifierAutorisation($etapeInstance, $user);

        return DB::transaction(function () use ($instance, $etapeInstance, $user, $commentaire) {
            $ancienStatut = $etapeInstance->statut;

            $etapeInstance->update([
                'statut'      => 'retour_modification',
                'traite_par'  => $user->id,
                'commentaire' => $commentaire,
                'traite_le'   => now(),
            ]);

            $this->enregistrerHistorique(
                instance: $instance,
                etapeInstance: $etapeInstance,
                user: $user,
                action: 'demande_correction',
                ancienStatut: $ancienStatut,
                nouveauStatut: 'retour_modification',
                commentaire: $commentaire,
            );

            return $instance->fresh(['pipeline', 'document', 'initiateur', 'etapeCourante.etape', 'etapeInstances.etape', 'historique.utilisateur']);
        });
    }

    /**
     * Ajouter une annotation à l'étape courante.
     */
    public function annoter(PipelineEtapeInstance $etapeInstance, Utilisateur $user, string $texte, ?UploadedFile $fichier = null): PipelineAnnotation
    {
        $cheminFichier = null;
        $nomFichierOriginal = null;

        if ($fichier) {
            $cheminFichier = $fichier->store('pipeline/annotations', 'private');
            $nomFichierOriginal = $fichier->getClientOriginalName();
        }

        $annotation = PipelineAnnotation::create([
            'etape_instance_id'    => $etapeInstance->id,
            'utilisateur_id'       => $user->id,
            'texte'                => $texte,
            'fichier_joint'        => $cheminFichier,
            'nom_fichier_original' => $nomFichierOriginal,
        ]);

        $this->enregistrerHistorique(
            instance: $etapeInstance->instance,
            etapeInstance: $etapeInstance,
            user: $user,
            action: 'annotation',
            ancienStatut: $etapeInstance->statut,
            nouveauStatut: $etapeInstance->statut,
            commentaire: $texte,
            donnees: ['fichier' => $nomFichierOriginal],
        );

        return $annotation->load('utilisateur');
    }

    /**
     * Vérifier que l'utilisateur est autorisé à traiter l'étape.
     * Respecte les overrides de réassignation (acteur_type_override / acteur_id_override).
     */
    private function verifierAutorisation(PipelineEtapeInstance $etapeInstance, Utilisateur $user): void
    {
        if (!$etapeInstance->peutEtreTraiteePar($user)) {
            throw ValidationException::withMessages([
                'autorisation' => 'Vous n\'êtes pas autorisé à traiter cette étape.',
            ]);
        }
    }

    /**
     * Vérifier les obligations de l'étape avant validation.
     */
    private function verifierObligations(PipelineEtape $etape, PipelineEtapeInstance $etapeInstance, ?string $commentaire): void
    {
        if ($etape->commentaire_requis && empty($commentaire)) {
            throw ValidationException::withMessages([
                'commentaire' => 'Un commentaire est obligatoire pour cette étape.',
            ]);
        }

        if ($etape->annotation_obligatoire && $etapeInstance->annotations()->count() === 0) {
            throw ValidationException::withMessages([
                'annotation' => 'Une annotation est requise avant de valider cette étape.',
            ]);
        }

        if ($etape->fichier_requis) {
            $aFichier = $etapeInstance->annotations()->whereNotNull('fichier_joint')->exists();
            if (!$aFichier) {
                throw ValidationException::withMessages([
                    'fichier' => 'Un fichier joint est requis avant de valider cette étape.',
                ]);
            }
        }

        if ($etape->signature_requise) {
            $document = $etapeInstance->instance->document;
            $hasMySignature = $document->signatures()->where('utilisateur_id', $user->id)->exists();
            if (!$hasMySignature) {
                throw ValidationException::withMessages([
                    'signature' => 'La signature électronique est requise pour valider cette étape.',
                ]);
            }
        }
    }

    /**
     * Déterminer l'étape de retour en cas de rejet.
     */
    private function determinerEtapeRetour(PipelineInstance $instance, PipelineEtape $etapeTemplate, ?string $etapeRetourId): ?PipelineEtapeInstance
    {
        // 1. Si une étape spécifique est demandée (override manuel)
        if ($etapeRetourId) {
            return PipelineEtapeInstance::where('instance_id', $instance->id)
                ->where('etape_id', $etapeRetourId)
                ->first();
        }

        // 2. Si l'étape template configure une étape de retour
        if ($etapeTemplate->rejet_etape_retour_id) {
            return PipelineEtapeInstance::where('instance_id', $instance->id)
                ->where('etape_id', $etapeTemplate->rejet_etape_retour_id)
                ->first();
        }

        // 3. Par défaut : étape précédente
        return $instance->etapeInstances()
            ->where('ordre', '<', $etapeTemplate->ordre)
            ->orderBy('ordre', 'desc')
            ->first();
    }

    /**
     * Enregistrer une entrée immuable dans l'historique.
     */
    public function enregistrerHistorique(
        PipelineInstance $instance,
        ?PipelineEtapeInstance $etapeInstance,
        ?Utilisateur $user,
        string $action,
        ?string $ancienStatut,
        string $nouveauStatut,
        ?string $commentaire = null,
        array $donnees = [],
    ): PipelineHistorique {
        return PipelineHistorique::create([
            'instance_id'             => $instance->id,
            'etape_instance_id'       => $etapeInstance?->id,
            'utilisateur_id'          => $user?->id,
            'action'                  => $action,
            'ancien_statut'           => $ancienStatut,
            'nouveau_statut'          => $nouveauStatut,
            'commentaire'             => $commentaire,
            'donnees_supplementaires' => empty($donnees) ? null : $donnees,
            'ip_address'              => request()->ip(),
            'user_agent'              => request()->userAgent(),
        ]);
    }
}
