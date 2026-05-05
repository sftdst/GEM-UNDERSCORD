<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DemandeEssai;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class DemandeAbonnementController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Liste toutes les demandes d'essai
     */
    public function index()
    {
        $demandes = DemandeEssai::with(['organisation', 'utilisateur'])
            ->latest()
            ->get()
            ->map(fn($d) => $this->formatDemande($d));

        return Inertia::render('superadmin/demandes_abonnement/index', [
            'demandes' => $demandes,
        ]);
    }

    /**
     * Affiche les détails d'une demande
     */
    public function show($id)
    {
        $demande = DemandeEssai::with(['organisation.plan', 'utilisateur'])->findOrFail($id);

        return Inertia::render('superadmin/demandes_abonnement/show', [
            'demande' => $this->formatDemande($demande, detailed: true),
        ]);
    }

    /**
     * Approuve une demande d'essai : active l'organisation et l'utilisateur
     */
    public function approuve(Request $request, $id)
    {
        $demande = DemandeEssai::with(['organisation', 'utilisateur'])->findOrFail($id);

        if ($demande->statut !== 'en_attente') {
            return redirect()->back()->with('error', 'Cette demande a déjà été traitée.');
        }

        try {
            // Activer l'organisation
            $demande->organisation->update([
                'statut'         => 'essai',
                'date_essai_fin' => now()->addDays(14),
            ]);

            // Activer l'utilisateur
            $demande->utilisateur->update([
                'statut' => 'actif',
            ]);

            // Mettre à jour la demande
            $demande->update([
                'statut'    => 'approuvee',
                'traite_par'=> auth('superadmin')->user()?->email ?? 'superadmin',
                'traite_le' => now(),
            ]);

            // Envoyer un email de confirmation à l'utilisateur
            try {
                Mail::to($demande->utilisateur->email)->send(
                    new \App\Mail\DemandeEssaiApprouvee($demande->utilisateur, $demande->organisation)
                );
            } catch (\Exception $mailException) {
                // Email non bloquant
            }

            $this->auditService->log('demande_essai_approuvee', $demande->organisation, null, [
                'utilisateur_email' => $demande->utilisateur->email,
            ]);

            return redirect()
                ->route('superadmin.demandes_abonnement.index')
                ->with('success', "Demande de \"{$demande->organisation->nom}\" approuvée. L'organisation est maintenant en période d'essai.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Erreur lors de l'approbation : {$e->getMessage()}");
        }
    }

    /**
     * Rejette une demande d'essai
     */
    public function rejette(Request $request, $id)
    {
        $demande = DemandeEssai::with(['organisation', 'utilisateur'])->findOrFail($id);

        if ($demande->statut !== 'en_attente') {
            return redirect()->back()->with('error', 'Cette demande a déjà été traitée.');
        }

        $validated = $request->validate([
            'raison' => 'required|string|max:1000',
        ]);

        try {
            // Suspendre l'organisation
            $demande->organisation->update(['statut' => 'suspendu']);

            // Désactiver l'utilisateur
            $demande->utilisateur->update(['statut' => 'inactif']);

            // Mettre à jour la demande
            $demande->update([
                'statut'      => 'rejetee',
                'raison_rejet'=> $validated['raison'],
                'traite_par'  => auth('superadmin')->user()?->email ?? 'superadmin',
                'traite_le'   => now(),
            ]);

            // Envoyer un email de rejet à l'utilisateur
            try {
                Mail::to($demande->utilisateur->email)->send(
                    new \App\Mail\DemandeEssaiRejetee($demande->utilisateur, $demande->organisation, $validated['raison'])
                );
            } catch (\Exception $mailException) {
                // Email non bloquant
            }

            $this->auditService->log('demande_essai_rejetee', $demande->organisation, null, [
                'raison' => $validated['raison'],
            ]);

            return redirect()
                ->route('superadmin.demandes_abonnement.index')
                ->with('success', "Demande de \"{$demande->organisation->nom}\" rejetée.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Erreur lors du rejet : {$e->getMessage()}");
        }
    }

    /**
     * Formate un DemandeEssai pour le frontend
     */
    private function formatDemande(DemandeEssai $d, bool $detailed = false): array
    {
        $base = [
            'id'               => $d->id,
            'statut'           => $d->statut,
            'secteur_activite' => $d->secteur_activite,
            'nb_utilisateurs_prevu' => $d->nb_utilisateurs_prevu,
            'message'          => $d->message,
            'raison_rejet'     => $d->raison_rejet,
            'traite_par'       => $d->traite_par,
            'traite_le'        => $d->traite_le?->toISOString(),
            'created_at'       => $d->created_at?->toISOString(),
            'organisation'     => $d->organisation ? [
                'id'   => $d->organisation->id,
                'nom'  => $d->organisation->nom,
                'pays' => $d->organisation->pays,
            ] : null,
            'utilisateur' => $d->utilisateur ? [
                'id'     => $d->utilisateur->id,
                'nom'    => $d->utilisateur->nom,
                'prenom' => $d->utilisateur->prenom,
                'email'  => $d->utilisateur->email,
                'telephone' => $d->utilisateur->telephone,
            ] : null,
        ];

        if ($detailed && $d->organisation?->plan) {
            $base['plan'] = [
                'nom'         => $d->organisation->plan->nom,
                'prix_mensuel'=> $d->organisation->plan->prix_mensuel,
            ];
        }

        return $base;
    }
}
