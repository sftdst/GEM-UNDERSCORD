<?php

namespace App\Http\Controllers\Gmp;

use App\Http\Controllers\Controller;
use App\Models\Gmp\GmpAlerteIa;
use App\Models\Gmp\GmpAppelOffre;
use App\Models\Gmp\GmpExerciceBudgetaire;
use App\Models\Gmp\GmpFournisseur;
use App\Models\Gmp\GmpMarche;
use App\Models\Gmp\GmpModePassation;
use App\Models\Gmp\GmpPlanPassation;
use App\Models\Gmp\GmpTypeMarche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GmpDashboardController extends Controller
{
    /** @return \App\Models\Utilisateur */
    private function currentUser()
    {
        /** @var \App\Models\Utilisateur $user */
        $user = Auth::user();
        return $user;
    }

    private function orgId(): string
    {
        return $this->currentUser()->organisation_id;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function dashboard()
    {
        $orgId = $this->orgId();

        $stats = [
            'marches_actifs'       => GmpMarche::where('organisation_id', $orgId)->whereNotIn('statut', ['cloture', 'resilie'])->count(),
            'appels_offres_ouverts' => GmpAppelOffre::where('organisation_id', $orgId)->whereIn('statut', ['publie', 'en_cours_evaluation'])->count(),
            'fournisseurs_actifs'   => GmpFournisseur::where('organisation_id', $orgId)->where('statut', 'actif')->count(),
            'alertes_non_traitees'  => GmpAlerteIa::where('organisation_id', $orgId)->where('traite', false)->count(),
        ];

        $exerciceEnCours = GmpExerciceBudgetaire::where('organisation_id', $orgId)->where('statut', 'ouvert')->first();

        $marchesRecents = GmpMarche::where('organisation_id', $orgId)
            ->with(['fournisseur', 'typeMarche'])
            ->latest()->take(5)->get();

        $alertesRecentes = GmpAlerteIa::where('organisation_id', $orgId)
            ->where('traite', false)
            ->orderByRaw("CASE niveau WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'attention' THEN 3 ELSE 4 END")
            ->take(5)->get();

        return Inertia::render('gmp/dashboard', [
            'stats'           => $stats,
            'exercice'        => $exerciceEnCours,
            'marches_recents' => $marchesRecents,
            'alertes'         => $alertesRecentes,
        ]);
    }

    // ── PPM ───────────────────────────────────────────────────────────────────

    public function ppm(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpPlanPassation::where('organisation_id', $orgId)
            ->with(['exercice', 'createur']);

        if ($s = $request->get('search')) {
            $query->whereHas('exercice', fn($q) => $q->where('annee', 'like', "%{$s}%"));
        }
        if ($statut = $request->get('statut')) {
            $query->where('statut', $statut);
        }

        $plans = $query->latest()->paginate(15)->withQueryString();

        $exercices = GmpExerciceBudgetaire::where('organisation_id', $orgId)
            ->whereIn('statut', ['ouvert', 'preparation'])
            ->orderByDesc('annee')
            ->get(['id', 'annee', 'statut']);

        return Inertia::render('gmp/ppm/index', [
            'plans'     => $plans,
            'exercices' => $exercices,
            'filters'   => $request->only(['search', 'statut']),
        ]);
    }

    public function storePpm(Request $request)
    {
        $data = $request->validate(['exercice_id' => 'required|uuid']);

        $version = GmpPlanPassation::where('organisation_id', $this->orgId())
            ->where('exercice_id', $data['exercice_id'])->count() + 1;

        GmpPlanPassation::create([
            'id'              => (string) Str::uuid(),
            'organisation_id' => $this->orgId(),
            'exercice_id'     => $data['exercice_id'],
            'version'         => $version,
            'statut'          => 'preparation',
            'created_by'      => $this->currentUser()->id,
        ]);

        return back()->with('success', "PPM v{$version} créé.");
    }

    public function updatePpm(Request $request, string $id)
    {
        $plan = GmpPlanPassation::where('organisation_id', $this->orgId())->findOrFail($id);
        $data = $request->validate([
            'statut' => 'required|in:preparation,soumis,en_revision,approuve,publie,en_cours_execution,cloture,annule',
        ]);
        $plan->update($data);
        return back()->with('success', 'PPM mis à jour.');
    }

    // ── Appels d'offres ───────────────────────────────────────────────────────

    public function appelsOffres(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpAppelOffre::where('organisation_id', $orgId)
            ->with(['typeMarche', 'modePassation']);

        if ($s = $request->get('search')) {
            $query->where(fn($q) =>
                $q->where('numero_aao', 'ilike', "%{$s}%")
                  ->orWhere('intitule', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->get('statut')) {
            $query->where('statut', $statut);
        }
        if ($type = $request->get('type_marche_id')) {
            $query->where('type_marche_id', $type);
        }

        $appelsOffres   = $query->latest()->paginate(15)->withQueryString();
        $typesMarche    = GmpTypeMarche::where('organisation_id', $orgId)->where('actif', true)->get(['id', 'libelle']);
        $modesPassation = GmpModePassation::where('organisation_id', $orgId)->where('actif', true)->get(['id', 'libelle']);

        return Inertia::render('gmp/appels-offres/index', [
            'appels_offres'   => $appelsOffres,
            'types_marche'    => $typesMarche,
            'modes_passation' => $modesPassation,
            'filters'         => $request->only(['search', 'statut', 'type_marche_id']),
        ]);
    }

    public function storeAppelOffre(Request $request)
    {
        $data = $request->validate([
            'numero_aao'        => 'required|string|max:50',
            'intitule'          => 'required|string|max:255',
            'type_marche_id'    => 'nullable|uuid',
            'mode_passation_id' => 'nullable|uuid',
            'montant_estime'    => 'nullable|numeric|min:0',
            'date_cloture'      => 'nullable|date',
        ]);

        GmpAppelOffre::create(array_merge($data, [
            'id'              => (string) Str::uuid(),
            'organisation_id' => $this->orgId(),
            'statut'          => 'preparation',
            'created_by'      => $this->currentUser()->id,
        ]));

        return back()->with('success', "Appel d'offres créé.");
    }

    public function updateAppelOffre(Request $request, string $id)
    {
        $ao = GmpAppelOffre::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'numero_aao'        => 'required|string|max:50',
            'intitule'          => 'required|string|max:255',
            'type_marche_id'    => 'nullable|uuid',
            'mode_passation_id' => 'nullable|uuid',
            'montant_estime'    => 'nullable|numeric|min:0',
            'date_cloture'      => 'nullable|date',
            'statut'            => 'required|in:preparation,publie,en_cours_evaluation,cloture,annule',
        ]);

        $ao->update($data);
        return back()->with('success', "Appel d'offres mis à jour.");
    }

    // ── Marchés ───────────────────────────────────────────────────────────────

    public function marches(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpMarche::where('organisation_id', $orgId)
            ->with(['fournisseur', 'typeMarche']);

        if ($s = $request->get('search')) {
            $query->where(fn($q) =>
                $q->where('numero_marche', 'ilike', "%{$s}%")
                  ->orWhere('intitule', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->get('statut')) {
            $query->where('statut', $statut);
        }
        if ($risque = $request->get('risque')) {
            $query->where('statut_risque', $risque);
        }
        if ($type = $request->get('type_marche_id')) {
            $query->where('type_marche_id', $type);
        }

        $marches     = $query->latest()->paginate(15)->withQueryString();
        $typesMarche = GmpTypeMarche::where('organisation_id', $orgId)->where('actif', true)->get(['id', 'libelle']);
        $fournisseurs = GmpFournisseur::where('organisation_id', $orgId)->where('statut', 'actif')
            ->orderBy('raison_sociale')->get(['id', 'raison_sociale']);

        return Inertia::render('gmp/marches/index', [
            'marches'      => $marches,
            'types_marche' => $typesMarche,
            'fournisseurs' => $fournisseurs,
            'filters'      => $request->only(['search', 'statut', 'risque', 'type_marche_id']),
        ]);
    }

    public function storeMarche(Request $request)
    {
        $data = $request->validate([
            'numero_marche'     => 'required|string|max:50',
            'intitule'          => 'required|string|max:255',
            'type_marche_id'    => 'nullable|uuid',
            'fournisseur_id'    => 'nullable|uuid',
            'montant_initial_ht'=> 'required|numeric|min:0',
            'date_signature'    => 'nullable|date',
            'date_debut'        => 'nullable|date',
            'date_fin_prevue'   => 'nullable|date',
        ]);

        GmpMarche::create(array_merge($data, [
            'id'                        => (string) Str::uuid(),
            'organisation_id'           => $this->orgId(),
            'montant_actuel_ht'         => $data['montant_initial_ht'],
            'statut'                    => 'signe',
            'statut_risque'             => 'vert',
            'taux_avancement_physique'  => 0,
            'taux_avancement_financier' => 0,
            'created_by'                => $this->currentUser()->id,
        ]));

        return back()->with('success', 'Marché créé.');
    }

    public function updateMarche(Request $request, string $id)
    {
        $marche = GmpMarche::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'numero_marche'            => 'required|string|max:50',
            'intitule'                 => 'required|string|max:255',
            'type_marche_id'           => 'nullable|uuid',
            'fournisseur_id'           => 'nullable|uuid',
            'montant_actuel_ht'        => 'required|numeric|min:0',
            'date_signature'           => 'nullable|date',
            'date_debut'               => 'nullable|date',
            'date_fin_prevue'          => 'nullable|date',
            'statut'                   => 'required|in:en_preparation,signe,en_cours,suspendu,cloture,resilie',
            'statut_risque'            => 'required|in:vert,orange,rouge',
            'taux_avancement_physique' => 'nullable|numeric|min:0|max:100',
        ]);

        $marche->update($data);
        return back()->with('success', 'Marché mis à jour.');
    }

    // ── Fournisseurs ──────────────────────────────────────────────────────────

    public function fournisseurs(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpFournisseur::where('organisation_id', $orgId)->withCount('marches');

        if ($s = $request->get('search')) {
            $query->where(fn($q) =>
                $q->where('raison_sociale', 'ilike', "%{$s}%")
                  ->orWhere('ninea', 'ilike', "%{$s}%")
                  ->orWhere('pays', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->get('statut')) {
            $query->where('statut', $statut);
        }

        $fournisseurs = $query->orderBy('raison_sociale')->paginate(20)->withQueryString();

        return Inertia::render('gmp/fournisseurs/index', [
            'fournisseurs' => $fournisseurs,
            'filters'      => $request->only(['search', 'statut']),
        ]);
    }

    public function storeFournisseur(Request $request)
    {
        $data = $request->validate([
            'raison_sociale' => 'required|string|max:255',
            'ninea'          => 'nullable|string|max:30',
            'pays'           => 'nullable|string|max:100',
            'telephone'      => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:255',
            'adresse'        => 'nullable|string|max:255',
        ]);

        GmpFournisseur::create(array_merge($data, [
            'id'              => (string) Str::uuid(),
            'organisation_id' => $this->orgId(),
            'statut'          => 'actif',
            'created_by'      => $this->currentUser()->id,
        ]));

        return back()->with('success', 'Fournisseur créé.');
    }

    public function updateFournisseur(Request $request, string $id)
    {
        $fournisseur = GmpFournisseur::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'raison_sociale' => 'required|string|max:255',
            'ninea'          => 'nullable|string|max:30',
            'pays'           => 'nullable|string|max:100',
            'telephone'      => 'nullable|string|max:30',
            'email'          => 'nullable|email|max:255',
            'adresse'        => 'nullable|string|max:255',
            'statut'         => 'required|in:actif,suspendu,blackliste',
        ]);

        $fournisseur->update($data);
        return back()->with('success', 'Fournisseur mis à jour.');
    }

    // ── Alertes ───────────────────────────────────────────────────────────────

    public function alertes()
    {
        $orgId = $this->orgId();

        $alertes = GmpAlerteIa::where('organisation_id', $orgId)
            ->orderByRaw("CASE niveau WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'attention' THEN 3 ELSE 4 END")
            ->latest()
            ->paginate(20);

        return Inertia::render('gmp/alertes/index', ['alertes' => $alertes]);
    }

    public function traiterAlerte(string $id)
    {
        $alerte = GmpAlerteIa::where('organisation_id', $this->orgId())->findOrFail($id);
        $alerte->update(['traite' => true, 'traite_le' => now(), 'traite_par' => $this->currentUser()->id]);
        return back();
    }

    // ── Rapports ──────────────────────────────────────────────────────────────

    public function rapports()
    {
        return Inertia::render('gmp/rapports/index', ['organisation_id' => $this->orgId()]);
    }
}
