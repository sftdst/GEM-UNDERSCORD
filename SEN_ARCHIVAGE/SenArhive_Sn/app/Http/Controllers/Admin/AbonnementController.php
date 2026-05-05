<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\DemandeChangementPlan;
use App\Models\Organisation;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbonnementController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $orgId = $user->organisation_id;

        $organisation = Organisation::find($orgId);

        $abonnement = Abonnement::where('organisation_id', $orgId)
            ->with(['plan.fonctionnalites' => fn ($q) => $q->where('actif', true)])
            ->latest()
            ->first();

        $plans = Plan::where('actif', true)
            ->with(['fonctionnalites' => fn ($q) => $q->where('actif', true)])
            ->orderBy('prix_mensuel')
            ->get();

        $demandeEnAttente = DemandeChangementPlan::where('organisation_id', $orgId)
            ->where('statut', 'en_attente')
            ->with('planDemande')
            ->latest()
            ->first();

        return Inertia::render('admin/billing/subscription', [
            'abonnement'       => $abonnement,
            'plans'            => $plans,
            'organisation'     => $organisation,
            'demandeEnAttente' => $demandeEnAttente,
        ]);
    }

    /**
     * Soumettre une demande de changement de plan
     */
    public function demanderChangement(Request $request)
    {
        $orgId = auth()->user()->organisation_id;

        $validated = $request->validate([
            'plan_demande_id'      => 'required|exists:plans,id',
            'periodicite_demandee' => 'required|in:mensuel,annuel',
            'message'              => 'nullable|string|max:500',
        ]);

        $existante = DemandeChangementPlan::where('organisation_id', $orgId)
            ->where('statut', 'en_attente')
            ->first();

        if ($existante) {
            return redirect()->back()->with('error', 'Vous avez déjà une demande de changement de plan en attente.');
        }

        $abonnement = Abonnement::where('organisation_id', $orgId)->latest()->first();

        DemandeChangementPlan::create([
            'organisation_id'      => $orgId,
            'plan_actuel_id'       => $abonnement?->plan_id,
            'plan_demande_id'      => $validated['plan_demande_id'],
            'periodicite_demandee' => $validated['periodicite_demandee'],
            'message'              => $validated['message'],
            'statut'               => 'en_attente',
        ]);

        return redirect()->back()->with('success', 'Votre demande a été soumise. Le SuperAdmin la traitera prochainement.');
    }

    /**
     * Annuler une demande en attente
     */
    public function annulerDemande()
    {
        $orgId = auth()->user()->organisation_id;

        DemandeChangementPlan::where('organisation_id', $orgId)
            ->where('statut', 'en_attente')
            ->update(['statut' => 'annulee', 'traite_le' => now()]);

        return redirect()->back()->with('success', 'Demande annulée.');
    }
}
