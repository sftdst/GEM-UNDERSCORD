<?php

namespace App\Http\Controllers\Gmp;

use App\Http\Controllers\Controller;
use App\Models\Gmp\GmpAlerteIa;
use App\Models\Gmp\GmpAppelOffre;
use App\Models\Gmp\GmpExerciceBudgetaire;
use App\Models\Gmp\GmpFournisseur;
use App\Models\Gmp\GmpMarche;
use App\Models\Gmp\GmpMarchePrevu;
use App\Models\Gmp\GmpModePassation;
use App\Models\Gmp\GmpPieceRequise;
use App\Models\Gmp\GmpPlanPassation;
use App\Models\Gmp\GmpSecteurIntervention;
use App\Models\Gmp\GmpSoumission;
use App\Models\Gmp\GmpSourceFinancement;
use App\Models\Gmp\GmpTypeMarche;
use App\Services\GmpArchivageService;
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

        if ($s = $request->input('search')) {
            $query->whereHas('exercice', fn($q) => $q->where('annee', 'like', "%{$s}%"));
        }
        if ($statut = $request->input('statut')) {
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

        $orgId = $this->orgId();

        $exercice = GmpExerciceBudgetaire::where('organisation_id', $orgId)
            ->where('id', $data['exercice_id'])
            ->firstOrFail();

        $version = GmpPlanPassation::where('organisation_id', $orgId)
            ->where('exercice_id', $data['exercice_id'])->count() + 1;

        GmpPlanPassation::create([
            'id'              => (string) Str::uuid(),
            'organisation_id' => $orgId,
            'exercice_id'     => $data['exercice_id'],
            'reference'       => "PPM-{$exercice->annee}-V{$version}",
            'intitule'        => "Plan de Passation des Marchés {$exercice->annee} - Version {$version}",
            'version'         => $version,
            'statut'          => 'brouillon',
            'created_by'      => $this->currentUser()->id,
        ]);

        return back()->with('success', "PPM v{$version} créé.");
    }

    public function updatePpm(Request $request, string $id)
    {
        $plan = GmpPlanPassation::where('organisation_id', $this->orgId())->findOrFail($id);
        $data = $request->validate([
            'statut' => 'required|in:brouillon,soumis,en_validation,valide_sectoriel,soumis_approbation,approuve,publie,revise',
        ]);
        $plan->update($data);
        return back()->with('success', 'PPM mis à jour.');
    }

    // ── Marchés prévus ────────────────────────────────────────────────────────

    public function marchesPrevus(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpMarchePrevu::where('organisation_id', $orgId)
            ->with(['plan.exercice', 'typeMarche', 'modePassation', 'secteur', 'sourceFinancement']);

        if ($s = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('numero', 'ilike', "%{$s}%")
                  ->orWhere('objet', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->input('statut')) {
            $query->where('statut', $statut);
        }
        if ($planId = $request->input('plan_id')) {
            $query->where('plan_id', $planId);
        }
        if ($secteurId = $request->input('secteur_id')) {
            $query->where('secteur_id', $secteurId);
        }

        $marchesPrevus  = $query->orderBy('date_lancement_prevue')->paginate(20)->withQueryString();
        $plans          = GmpPlanPassation::where('organisation_id', $orgId)->with('exercice')->latest()->get(['id', 'reference', 'version', 'statut', 'exercice_id']);
        $typesMarche    = GmpTypeMarche::where('organisation_id', $orgId)->where('actif', true)->orderBy('libelle')->get(['id', 'libelle']);
        $modesPassation = GmpModePassation::where('organisation_id', $orgId)->where('actif', true)->orderBy('libelle')->get(['id', 'libelle']);
        $secteurs       = GmpSecteurIntervention::where('organisation_id', $orgId)->where('actif', true)->orderBy('libelle')->get(['id', 'libelle', 'couleur']);
        $sources        = GmpSourceFinancement::where('organisation_id', $orgId)->where('actif', true)->orderBy('libelle')->get(['id', 'libelle']);

        return Inertia::render('gmp/marches-prevus/index', [
            'marches_prevus'  => $marchesPrevus,
            'plans'           => $plans,
            'types_marche'    => $typesMarche,
            'modes_passation' => $modesPassation,
            'secteurs'        => $secteurs,
            'sources'         => $sources,
            'filters'         => $request->only(['search', 'statut', 'plan_id', 'secteur_id']),
        ]);
    }

    public function storeMarchePrevu(Request $request)
    {
        $orgId = $this->orgId();

        $data = $request->validate([
            'plan_id'                 => 'required|uuid',
            'numero'                  => 'required|string|max:50',
            'objet'                   => 'required|string|max:500',
            'description'             => 'nullable|string',
            'type_marche_id'          => 'required|uuid',
            'mode_passation_id'       => 'required|uuid',
            'source_financement_id'   => 'required|uuid',
            'secteur_id'              => 'required|uuid',
            'montant_previsionnel'    => 'required|numeric|min:0',
            'date_lancement_prevue'   => 'required|date',
            'date_attribution_prevue' => 'nullable|date',
            'date_debut_prevue'       => 'nullable|date',
            'date_fin_prevue'         => 'nullable|date',
            'duree_prevue_jours'      => 'nullable|integer|min:1',
            'observations'            => 'nullable|string',
        ]);

        GmpPlanPassation::where('organisation_id', $orgId)->findOrFail($data['plan_id']);

        GmpMarchePrevu::create(array_merge($data, [
            'id'              => (string) Str::uuid(),
            'organisation_id' => $orgId,
            'statut'          => 'planifie',
            'created_by'      => $this->currentUser()->id,
        ]));

        return back()->with('success', 'Marché prévu créé.');
    }

    public function updateMarchePrevu(Request $request, string $id)
    {
        $marche = GmpMarchePrevu::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'plan_id'                 => 'required|uuid',
            'numero'                  => 'required|string|max:50',
            'objet'                   => 'required|string|max:500',
            'description'             => 'nullable|string',
            'type_marche_id'          => 'required|uuid',
            'mode_passation_id'       => 'required|uuid',
            'source_financement_id'   => 'required|uuid',
            'secteur_id'              => 'required|uuid',
            'montant_previsionnel'    => 'required|numeric|min:0',
            'date_lancement_prevue'   => 'required|date',
            'date_attribution_prevue' => 'nullable|date',
            'date_debut_prevue'       => 'nullable|date',
            'date_fin_prevue'         => 'nullable|date',
            'duree_prevue_jours'      => 'nullable|integer|min:1',
            'statut'                  => 'required|in:planifie,lance,attribue,en_execution,solde,annule',
            'observations'            => 'nullable|string',
        ]);

        $marche->update($data);
        return back()->with('success', 'Marché prévu mis à jour.');
    }

    // ── Appels d'offres — show (gestion des pièces requises) ─────────────────

    public function showAppelOffre(string $id)
    {
        $orgId = $this->orgId();

        $ao = GmpAppelOffre::where('organisation_id', $orgId)
            ->with(['piecesRequises', 'soumissions.fournisseur'])
            ->findOrFail($id);

        return Inertia::render('gmp/appels-offres/show', [
            'ao' => $ao,
        ]);
    }

    public function storePieceRequise(Request $request, string $aoId)
    {
        $ao = GmpAppelOffre::where('organisation_id', $this->orgId())->findOrFail($aoId);

        $data = $request->validate([
            'libelle'          => 'required|string|max:255',
            'description'      => 'nullable|string',
            'formats_acceptes' => 'nullable|string|max:100',
            'taille_max_mo'    => 'required|integer|min:1|max:500',
            'obligatoire'      => 'boolean',
            'ordre'            => 'nullable|integer|min:0',
        ]);

        $maxOrdre = GmpPieceRequise::where('appel_offre_id', $ao->id)->max('ordre') ?? -1;

        GmpPieceRequise::create(array_merge($data, [
            'id'              => (string) Str::uuid(),
            'organisation_id' => $this->orgId(),
            'appel_offre_id'  => $ao->id,
            'ordre'           => $data['ordre'] ?? ($maxOrdre + 1),
        ]));

        return back()->with('success', 'Pièce requise ajoutée.');
    }

    public function updatePieceRequise(Request $request, string $aoId, string $pieceId)
    {
        $piece = GmpPieceRequise::where('organisation_id', $this->orgId())
            ->where('appel_offre_id', $aoId)
            ->findOrFail($pieceId);

        $data = $request->validate([
            'libelle'          => 'required|string|max:255',
            'description'      => 'nullable|string',
            'formats_acceptes' => 'nullable|string|max:100',
            'taille_max_mo'    => 'required|integer|min:1|max:500',
            'obligatoire'      => 'boolean',
            'ordre'            => 'nullable|integer|min:0',
        ]);

        $piece->update($data);

        return back()->with('success', 'Pièce requise mise à jour.');
    }

    public function destroyPieceRequise(string $aoId, string $pieceId)
    {
        $piece = GmpPieceRequise::where('organisation_id', $this->orgId())
            ->where('appel_offre_id', $aoId)
            ->findOrFail($pieceId);

        if ($piece->soumissionsPieces()->exists()) {
            return back()->withErrors(['piece' => 'Impossible de supprimer : des soumissions ont déjà déposé cette pièce.']);
        }

        $piece->delete();

        return back()->with('success', 'Pièce requise supprimée.');
    }

    // ── Soumissions ───────────────────────────────────────────────────────────

    public function soumissions(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpSoumission::where('organisation_id', $orgId)
            ->with(['appelOffre', 'fournisseur']);

        if ($s = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('reference_soumission', 'ilike', "%{$s}%")
                  ->orWhereHas('fournisseur', fn($fq) => $fq->where('raison_sociale', 'ilike', "%{$s}%"))
            );
        }
        if ($statut = $request->input('statut')) {
            $query->where('statut', $statut);
        }
        if ($aoId = $request->input('appel_offre_id')) {
            $query->where('appel_offre_id', $aoId);
        }

        $soumissions  = $query->orderByDesc('date_depot')->paginate(20)->withQueryString();

        $appelsOffres = GmpAppelOffre::where('organisation_id', $orgId)
            ->with('piecesRequises')
            ->orderByDesc('date_cloture')
            ->get(['id', 'numero_aao', 'objet', 'statut', 'date_cloture']);

        $fournisseurs = GmpFournisseur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->orderBy('raison_sociale')
            ->get(['id', 'raison_sociale']);

        return Inertia::render('gmp/soumissions/index', [
            'soumissions'   => $soumissions,
            'appels_offres' => $appelsOffres,
            'fournisseurs'  => $fournisseurs,
            'filters'       => $request->only(['search', 'statut', 'appel_offre_id']),
        ]);
    }

    public function storeSoumission(Request $request, GmpArchivageService $archivage)
    {
        $orgId = $this->orgId();
        $user  = $this->currentUser();

        // Validation des champs de base
        $data = $request->validate([
            'appel_offre_id'          => 'required|uuid',
            'fournisseur_id'          => 'required|uuid',
            'reference_soumission'    => 'required|string|max:100',
            'date_depot'              => 'required|date',
            'montant_offre_ht'        => 'required|numeric|min:0',
            'montant_offre_ttc'       => 'required|numeric|min:0',
            'delai_execution_propose' => 'nullable|integer|min:1',
            'alerte_offre_anormale'   => 'boolean',
        ]);

        $ao = GmpAppelOffre::where('organisation_id', $orgId)
            ->with('piecesRequises')
            ->findOrFail($data['appel_offre_id']);

        // Vérification de la date limite
        if ($ao->date_cloture && now()->startOfDay()->gt($ao->date_cloture)) {
            return back()->withErrors(['appel_offre_id' => "La date limite de dépôt de cet appel d'offres est dépassée ({$ao->date_cloture->format('d/m/Y')})."]);
        }

        // Double soumission : vérifier que ce fournisseur n'a pas déjà soumis
        if (GmpSoumission::where('organisation_id', $orgId)
            ->where('appel_offre_id', $ao->id)
            ->where('fournisseur_id', $data['fournisseur_id'])
            ->exists()
        ) {
            return back()->withErrors(['fournisseur_id' => "Ce fournisseur a déjà soumis une offre pour cet appel d'offres."]);
        }

        // Validation des fichiers pièce par pièce
        $piecesRequises = $ao->piecesRequises;
        $fileRules = [];

        foreach ($piecesRequises as $piece) {
            $key      = "pieces.{$piece->id}";
            $maxKo    = $piece->taille_max_mo * 1024;
            $formats  = $piece->formats_acceptes
                ? implode(',', $piece->formatsArray())
                : 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png';

            $fileRules[$key] = ($piece->obligatoire ? 'required' : 'nullable')
                . "|file|mimes:{$formats}|max:{$maxKo}";
        }

        if (!empty($fileRules)) {
            $request->validate($fileRules);
        }

        // Création de la soumission
        $soumission = GmpSoumission::create(array_merge($data, [
            'id'              => (string) Str::uuid(),
            'organisation_id' => $orgId,
            'statut'          => 'deposee',
        ]));

        // Archivage des fichiers liés aux pièces requises
        $uploadedFiles = [];
        foreach ($piecesRequises as $piece) {
            $file = $request->file("pieces.{$piece->id}");
            if ($file) {
                $uploadedFiles[$piece->id] = $file;
            }
        }

        // Archivage des documents libres (quand aucune pièce requise n'est définie)
        $freeFiles = $request->file('documents', []);

        if (!empty($uploadedFiles) || !empty($freeFiles)) {
            $soumission->load(['appelOffre', 'fournisseur']);
            if (!empty($uploadedFiles)) {
                $archivage->archiverSoumission($soumission, $uploadedFiles, $user);
            }
            if (!empty($freeFiles)) {
                $request->validate(['documents.*' => 'file|max:51200']);
                $archivage->archiverDocumentsLibres($soumission, $freeFiles, $user);
            }
        }

        return back()->with('success', 'Soumission enregistrée et documents archivés.');
    }

    public function updateSoumission(Request $request, string $id)
    {
        $soumission = GmpSoumission::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'appel_offre_id'          => 'required|uuid',
            'fournisseur_id'          => 'required|uuid',
            'reference_soumission'    => 'required|string|max:100',
            'date_depot'              => 'required|date',
            'montant_offre_ht'        => 'required|numeric|min:0',
            'montant_offre_ttc'       => 'required|numeric|min:0',
            'delai_execution_propose' => 'nullable|integer|min:1',
            'statut'                  => 'required|in:deposee,conforme,non_conforme,retenue,eliminee',
            'score_technique'         => 'nullable|numeric|min:0|max:100',
            'score_financier'         => 'nullable|numeric|min:0|max:100',
            'score_global'            => 'nullable|numeric|min:0|max:100',
            'motif_elimination'       => 'nullable|string',
            'alerte_offre_anormale'   => 'boolean',
        ]);

        $soumission->update($data);
        return back()->with('success', 'Soumission mise à jour.');
    }

    // ── Évaluation des offres ─────────────────────────────────────────────────

    public function evaluations(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpAppelOffre::where('organisation_id', $orgId)
            ->with([
                'soumissions' => function ($q) {
                    $q->with([
                        'fournisseur:id,raison_sociale',
                        'evaluations' => function ($eq) {
                            $eq->with('evaluateur:id,name')->orderBy('created_at');
                        },
                    ])->orderByDesc('date_depot');
                },
            ])
            ->whereHas('soumissions')
            ->orderByDesc('date_cloture');

        if ($aoId = $request->input('appel_offre_id')) {
            $query->where('id', $aoId);
        }

        $appelsOffres = $query->get(['id', 'numero_aao', 'objet', 'statut', 'date_cloture']);

        $allAos = GmpAppelOffre::where('organisation_id', $orgId)
            ->whereHas('soumissions')
            ->orderByDesc('date_cloture')
            ->get(['id', 'numero_aao', 'objet']);

        return Inertia::render('gmp/evaluations/index', [
            'appels_offres' => $appelsOffres,
            'all_aos'       => $allAos,
            'filters'       => $request->only(['appel_offre_id']),
        ]);
    }

    public function storeEvaluation(Request $request, string $soumissionId)
    {
        $soumission = GmpSoumission::where('organisation_id', $this->orgId())->findOrFail($soumissionId);

        $data = $request->validate([
            'critere'     => 'required|string|max:200',
            'ponderation' => 'required|numeric|min:0|max:100',
            'note'        => 'required|numeric|min:0|max:100',
            'commentaire' => 'nullable|string|max:1000',
        ]);

        $data['note_ponderee'] = round(($data['note'] * $data['ponderation']) / 100, 2);

        \App\Models\Gmp\GmpEvaluationOffre::create(array_merge($data, [
            'id'            => (string) Str::uuid(),
            'soumission_id' => $soumission->id,
            'evaluateur_id' => $this->currentUser()->id,
        ]));

        $this->recalculerScoreSoumission($soumission);

        return back()->with('success', 'Critère ajouté.');
    }

    public function updateEvaluation(Request $request, string $soumissionId, string $id)
    {
        $soumission = GmpSoumission::where('organisation_id', $this->orgId())->findOrFail($soumissionId);
        $evaluation = \App\Models\Gmp\GmpEvaluationOffre::where('soumission_id', $soumission->id)->findOrFail($id);

        $data = $request->validate([
            'critere'     => 'required|string|max:200',
            'ponderation' => 'required|numeric|min:0|max:100',
            'note'        => 'required|numeric|min:0|max:100',
            'commentaire' => 'nullable|string|max:1000',
        ]);

        $data['note_ponderee'] = round(($data['note'] * $data['ponderation']) / 100, 2);
        $evaluation->update($data);

        $this->recalculerScoreSoumission($soumission);

        return back()->with('success', 'Critère mis à jour.');
    }

    public function deleteEvaluation(string $soumissionId, string $id)
    {
        $soumission = GmpSoumission::where('organisation_id', $this->orgId())->findOrFail($soumissionId);
        \App\Models\Gmp\GmpEvaluationOffre::where('soumission_id', $soumission->id)->findOrFail($id)->delete();

        $this->recalculerScoreSoumission($soumission);

        return back()->with('success', 'Critère supprimé.');
    }

    public function updateStatutSoumission(Request $request, string $soumissionId)
    {
        $soumission = GmpSoumission::where('organisation_id', $this->orgId())->findOrFail($soumissionId);

        $data = $request->validate([
            'statut'            => 'required|in:deposee,conforme,non_conforme,retenue,eliminee',
            'score_technique'   => 'nullable|numeric|min:0|max:100',
            'score_financier'   => 'nullable|numeric|min:0|max:100',
            'motif_elimination' => 'nullable|string|max:1000',
        ]);

        $soumission->update($data);

        return back()->with('success', 'Statut mis à jour.');
    }

    private function recalculerScoreSoumission(GmpSoumission $soumission): void
    {
        $evaluations = \App\Models\Gmp\GmpEvaluationOffre::where('soumission_id', $soumission->id)->get();

        if ($evaluations->isEmpty()) {
            $soumission->update(['score_global' => null]);
            return;
        }

        $scoreGlobal = $evaluations->sum('note_ponderee');
        $soumission->update(['score_global' => min(100, round($scoreGlobal, 2))]);
    }

    // ── Appels d'offres ───────────────────────────────────────────────────────

    public function appelsOffres(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpAppelOffre::where('organisation_id', $orgId)
            ->with(['typeMarche', 'modePassation']);

        if ($s = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('numero_aao', 'ilike', "%{$s}%")
                  ->orWhere('intitule', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->input('statut')) {
            $query->where('statut', $statut);
        }
        if ($type = $request->input('type_marche_id')) {
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

        if ($s = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('numero_marche', 'ilike', "%{$s}%")
                  ->orWhere('intitule', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->input('statut')) {
            $query->where('statut', $statut);
        }
        if ($risque = $request->input('risque')) {
            $query->where('statut_risque', $risque);
        }
        if ($type = $request->input('type_marche_id')) {
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

        if ($s = $request->input('search')) {
            $query->where(fn($q) =>
                $q->where('raison_sociale', 'ilike', "%{$s}%")
                  ->orWhere('ninea', 'ilike', "%{$s}%")
                  ->orWhere('pays', 'ilike', "%{$s}%")
            );
        }
        if ($statut = $request->input('statut')) {
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

    public function alertes(Request $request)
    {
        $orgId = $this->orgId();

        $query = GmpAlerteIa::where('organisation_id', $orgId)
            ->orderByRaw("CASE niveau WHEN 'critique' THEN 1 WHEN 'urgent' THEN 2 WHEN 'attention' THEN 3 ELSE 4 END")
            ->latest();

        if ($niveau = $request->input('niveau')) {
            $query->where('niveau', $niveau);
        }
        if ($request->has('traite') && $request->input('traite') !== '') {
            $query->where('traite', $request->input('traite') === '1');
        }

        $alertes = $query->paginate(20)->withQueryString();

        return Inertia::render('gmp/alertes/index', [
            'alertes' => $alertes,
            'filters' => $request->only(['niveau', 'traite']),
        ]);
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
