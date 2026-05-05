<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\DemandeChangementPlan;
use App\Models\Facture;
use App\Models\Organisation;
use App\Scopes\OrganisationScope;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DemandeChangementPlanController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Liste toutes les demandes de changement de plan
     */
    public function index(Request $request)
    {
        $statut = $request->input('statut', 'en_attente');

        $query = DemandeChangementPlan::with('organisation', 'planActuel', 'planDemande')
            ->orderBy('created_at', 'desc');

        if ($statut !== 'all') {
            $query->where('statut', $statut);
        }

        $demandes = $query->paginate(20)->withQueryString();

        $counts = [
            'en_attente' => DemandeChangementPlan::where('statut', 'en_attente')->count(),
            'approuvee'  => DemandeChangementPlan::where('statut', 'approuvee')->count(),
            'rejetee'    => DemandeChangementPlan::where('statut', 'rejetee')->count(),
        ];

        return Inertia::render('superadmin/demandes_plan/index', [
            'demandes' => $demandes,
            'filters'  => ['statut' => $statut],
            'counts'   => $counts,
        ]);
    }

    /**
     * Approuver une demande — met à jour l'abonnement de l'organisation
     */
    public function approuver(Request $request, DemandeChangementPlan $demandeChangementPlan)
    {
        $demande = $demandeChangementPlan;

        if (! $demande->estEnAttente()) {
            return redirect()->back()->with('error', 'Cette demande a déjà été traitée.');
        }

        $plan       = $demande->planDemande;
        $periodicite = $demande->periodicite_demandee;
        $dateFin    = match ($periodicite) {
            'annuel' => now()->addYear(),
            default  => now()->addMonth(),
        };

        // Terminer l'abonnement actif existant
        Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('organisation_id', $demande->organisation_id)
            ->where('statut', 'actif')
            ->update(['statut' => 'termine', 'date_fin' => now()]);

        // Créer le nouvel abonnement
        $montantHt  = (float) $plan->{'prix_' . $periodicite};
        $tauxTva    = 18.00;
        $montantTva = round($montantHt * $tauxTva / 100, 2);
        $montantTtc = round($montantHt + $montantTva, 2);

        $abonnement = Abonnement::create([
            'organisation_id'    => $demande->organisation_id,
            'plan_id'            => $plan->id,
            'statut'             => 'actif',
            'periodicite'        => $periodicite,
            'date_debut'         => now(),
            'date_fin'           => $dateFin,
            'date_renouvellement' => $dateFin,
            'prix_applique'      => $montantHt,
            'devise'             => 'XOF',
        ]);

        // Générer une facture
        Facture::create([
            'organisation_id' => $demande->organisation_id,
            'abonnement_id'   => $abonnement->id,
            'numero'          => 'FAC-' . strtoupper(uniqid()),
            'montant_ht'      => $montantHt,
            'taux_tva'        => $tauxTva,
            'montant_tva'     => $montantTva,
            'montant_ttc'     => $montantTtc,
            'devise'          => 'XOF',
            'statut'          => 'payee',
            'periode_debut'   => now()->startOfMonth()->toDateString(),
            'periode_fin'     => $dateFin->toDateString(),
            'paye_le'         => now(),
        ]);

        // Mettre à jour le plan de l'organisation
        Organisation::where('id', $demande->organisation_id)
            ->update(['plan_id' => $plan->id]);

        // Marquer la demande comme approuvée
        $demande->update([
            'statut'    => 'approuvee',
            'traite_le' => now(),
        ]);

        $this->auditService->log('plan_change_approved', $demande->organisation, null, [
            'plan' => $plan->nom,
        ]);

        return redirect()->route('superadmin.demandes_plan.index')
            ->with('success', "Plan changé vers \"{$plan->nom}\" pour {$demande->organisation->nom}.");
    }

    /**
     * Rejeter une demande
     */
    public function rejeter(Request $request, DemandeChangementPlan $demandeChangementPlan)
    {
        $demande = $demandeChangementPlan;

        if (! $demande->estEnAttente()) {
            return redirect()->back()->with('error', 'Cette demande a déjà été traitée.');
        }

        $validated = $request->validate([
            'motif_rejet' => 'required|string|max:500',
        ]);

        $demande->update([
            'statut'      => 'rejetee',
            'motif_rejet' => $validated['motif_rejet'],
            'traite_le'   => now(),
        ]);

        $this->auditService->log('plan_change_rejected', $demande->organisation);

        return redirect()->route('superadmin.demandes_plan.index')
            ->with('success', 'Demande rejetée.');
    }
}
