<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fonctionnalite;
use App\Models\Plan;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    public function index(Request $request)
    {
        $query = Plan::withCount('organisations', 'abonnements');

        if ($request->filled('q')) {
            $query->where('nom', 'like', '%' . $request->input('q') . '%');
        }

        $plans = $query->orderBy('prix_mensuel')->get();

        return Inertia::render('superadmin/plans/index', [
            'plans'   => $plans,
            'filters' => $request->only('q'),
        ]);
    }

    public function create()
    {
        return Inertia::render('superadmin/plans/create', [
            'fonctionnalites' => Fonctionnalite::where('actif', true)
                ->orderBy('categorie')
                ->orderBy('ordre')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'                  => 'required|string|max:50|unique:plans,nom',
            'description'          => 'nullable|string',
            'prix_mensuel'         => 'required|numeric|min:0',
            'prix_annuel'          => 'required|numeric|min:0',
            'stockage_max_go'      => 'required|integer|min:1',
            'users_max'            => 'nullable|integer|min:1',
            'documents_max'        => 'nullable|integer|min:1',
            'actif'                => 'boolean',
            'fonctionnalite_ids'   => 'nullable|array',
            'fonctionnalite_ids.*' => 'exists:fonctionnalites,id',
        ]);

        $plan = Plan::create(Arr::except($validated, ['fonctionnalite_ids']));
        $plan->fonctionnalites()->sync($validated['fonctionnalite_ids'] ?? []);

        $this->auditService->log('plan_create', $plan);

        return redirect()->route('superadmin.plans.index')
                         ->with('success', "Plan \"{$plan->nom}\" créé avec succès");
    }

    public function show(Plan $plan)
    {
        $plan->loadCount('organisations', 'abonnements')
             ->load('fonctionnalites');

        $organisations = $plan->organisations()
            ->select('id', 'nom', 'statut', 'created_at')
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('superadmin/plans/show', [
            'plan'          => $plan,
            'organisations' => $organisations,
        ]);
    }

    public function edit(Plan $plan)
    {
        $plan->load('fonctionnalites');

        return Inertia::render('superadmin/plans/edit', [
            'plan'            => $plan,
            'fonctionnalites' => Fonctionnalite::where('actif', true)
                ->orderBy('categorie')
                ->orderBy('ordre')
                ->get(),
        ]);
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'nom'                  => ['required', 'string', 'max:50', Rule::unique('plans', 'nom')->ignore($plan->id)],
            'description'          => 'nullable|string',
            'prix_mensuel'         => 'required|numeric|min:0',
            'prix_annuel'          => 'required|numeric|min:0',
            'stockage_max_go'      => 'required|integer|min:1',
            'users_max'            => 'nullable|integer|min:1',
            'documents_max'        => 'nullable|integer|min:1',
            'actif'                => 'boolean',
            'fonctionnalite_ids'   => 'nullable|array',
            'fonctionnalite_ids.*' => 'exists:fonctionnalites,id',
        ]);

        $plan->update(Arr::except($validated, ['fonctionnalite_ids']));
        $plan->fonctionnalites()->sync($validated['fonctionnalite_ids'] ?? []);

        $this->auditService->log('plan_update', $plan);

        return redirect()->route('superadmin.plans.index')
                         ->with('success', "Plan \"{$plan->nom}\" mis à jour avec succès");
    }

    public function destroy(Plan $plan)
    {
        if ($plan->organisations()->count() > 0) {
            return redirect()->back()
                             ->with('error', "Impossible de supprimer le plan \"{$plan->nom}\" : il est utilisé par des organisations");
        }

        $nomPlan = $plan->nom;
        $plan->delete();

        $this->auditService->log('plan_delete', null, null, ['plan_nom' => $nomPlan]);

        return redirect()->route('superadmin.plans.index')
                         ->with('success', "Plan \"{$nomPlan}\" supprimé");
    }

    public function activate(Plan $plan)
    {
        $plan->update(['actif' => true]);
        $this->auditService->log('plan_activate', $plan);

        return redirect()->back()->with('success', "Plan \"{$plan->nom}\" activé");
    }

    public function deactivate(Plan $plan)
    {
        $plan->update(['actif' => false]);
        $this->auditService->log('plan_deactivate', $plan);

        return redirect()->back()->with('success', "Plan \"{$plan->nom}\" désactivé");
    }
}
