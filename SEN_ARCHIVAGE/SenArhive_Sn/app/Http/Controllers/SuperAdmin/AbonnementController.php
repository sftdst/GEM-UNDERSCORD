<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Facture;
use App\Models\Organisation;
use App\Models\Plan;
use App\Scopes\OrganisationScope;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbonnementController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Liste tous les abonnements
     */
    public function index(Request $request)
    {
        $query = Abonnement::withoutGlobalScope(OrganisationScope::class)->with('organisation', 'plan');

        // Filtrer par statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        // Filtrer par organisation
        if ($request->filled('organisation_id')) {
            $query->where('organisation_id', $request->input('organisation_id'));
        }

        // Recherche
        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->whereHas('organisation', fn ($q_builder) => 
                $q_builder->where('nom', 'like', "%{$q}%")
            );
        }

        $abonnements = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('superadmin/abonnements/index', [
            'abonnements' => $abonnements,
            'filters' => $request->only('q', 'statut', 'organisation_id'),
        ]);
    }

    /**
     * Crée un nouvel abonnement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'organisation_id' => 'required|exists:organisations,id',
            'plan_id' => 'required|exists:plans,id',
            'statut' => 'required|in:actif,suspendu,termine',
            'periodicite' => 'required|in:mensuel,annuel',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
        ]);

        $abonnement = Abonnement::create($validated);

        $this->auditService->log('sub_create', $abonnement);

        return redirect()->route('superadmin.abonnements.index')
                       ->with('success', 'Abonnement créé avec succès');
    }

    /**
     * Met à jour un abonnement
     */
    public function update(Request $request, Abonnement $abonnement)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'statut' => 'required|in:actif,suspendu,termine',
            'date_fin' => 'required|date|after:date_debut',
        ]);

        $abonnement->update($validated);

        $this->auditService->log('sub_update', $abonnement);

        return redirect()->back()->with('success', 'Abonnement mis à jour');
    }

    /**
     * Renouvelle un abonnement
     */
    public function renew(Abonnement $abonnement)
    {
        $plan = $abonnement->plan;
        $periodicite = $abonnement->periodicite;

        $nouvelleFinDate = match($periodicite) {
            'mensuel' => now()->addMonth(),
            'annuel' => now()->addYear(),
            default => now()->addMonth(),
        };

        $abonnement->update([
            'statut' => 'actif',
            'date_debut' => now(),
            'date_fin' => $nouvelleFinDate,
            'date_renouvellement' => $nouvelleFinDate,
        ]);

        // Créer une facture de renouvellement
        $montantHt = (float) $plan->{'prix_' . $periodicite};
        $tauxTva   = 18.00;
        $montantTva = round($montantHt * $tauxTva / 100, 2);
        $montantTtc = round($montantHt + $montantTva, 2);

        Facture::create([
            'organisation_id' => $abonnement->organisation_id,
            'abonnement_id'   => $abonnement->id,
            'numero'          => 'FAC-' . strtoupper(uniqid()),
            'montant_ht'      => $montantHt,
            'taux_tva'        => $tauxTva,
            'montant_tva'     => $montantTva,
            'montant_ttc'     => $montantTtc,
            'devise'          => 'XOF',
            'statut'          => 'payee',
            'periode_debut'   => now()->startOfMonth()->toDateString(),
            'periode_fin'     => $nouvelleFinDate->toDateString(),
            'paye_le'         => now(),
        ]);

        $this->auditService->log('sub_renew', $abonnement);

        return redirect()->back()->with('success', 'Abonnement renouvelé');
    }

    /**
     * Suspend un abonnement
     */
    public function suspend(Abonnement $abonnement)
    {
        $abonnement->update(['statut' => 'suspendu']);
        $this->auditService->log('sub_suspend', $abonnement);

        return redirect()->back()->with('success', 'Abonnement suspendu');
    }

    /**
     * Réactive un abonnement
     */
    public function activate(Abonnement $abonnement)
    {
        $abonnement->update(['statut' => 'actif']);
        $this->auditService->log('sub_activate', $abonnement);

        return redirect()->back()->with('success', 'Abonnement réactivé');
    }

    /**
     * Termine un abonnement
     */
    public function terminate(Abonnement $abonnement)
    {
        $abonnement->update([
            'statut' => 'termine',
            'date_fin' => now(),
        ]);
        $this->auditService->log('sub_terminate', $abonnement);

        return redirect()->back()->with('success', 'Abonnement terminé');
    }

    /**
     * Affiche les factures d'un abonnement
     */
    public function factures(Abonnement $abonnement)
    {
        $factures = $abonnement->factures()->withoutGlobalScope(OrganisationScope::class)->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('superadmin/abonnements/factures', [
            'abonnement' => $abonnement->load('organisation', 'plan'),
            'factures' => $factures,
        ]);
    }
}
