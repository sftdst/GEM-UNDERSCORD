<?php

namespace App\Http\Controllers\Gmp;

use App\Http\Controllers\Controller;
use App\Models\Gmp\GmpEnveloppeSectorielle;
use App\Models\Gmp\GmpExerciceBudgetaire;
use App\Models\Gmp\GmpModePassation;
use App\Models\Gmp\GmpSecteurIntervention;
use App\Models\Gmp\GmpSeuilReglementaire;
use App\Models\Gmp\GmpTypeMarche;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GmpAdminController extends Controller
{
    /** @return \App\Models\Utilisateur */
    private function currentUser()
    {
        /** @var \App\Models\Utilisateur $user */
        $user = \Illuminate\Support\Facades\Auth::user();
        return $user;
    }

    private function orgId(): string
    {
        return $this->currentUser()->organisation_id;
    }

    // ── Exercices budgétaires ─────────────────────────────────────────────────

    public function exercices(Request $request)
    {
        $query = GmpExerciceBudgetaire::where('organisation_id', $this->orgId())
            ->with('createur');

        if ($s = $request->input('search')) {
            $query->where('annee', 'like', "%{$s}%");
        }
        if ($statut = $request->input('statut')) {
            $query->where('statut', $statut);
        }

        $exercices = $query->orderByDesc('annee')->get();

        return Inertia::render('gmp/admin/exercices/index', [
            'exercices' => $exercices,
            'filters'   => $request->only(['search', 'statut']),
        ]);
    }

    public function storeExercice(Request $request)
    {
        $data = $request->validate([
            'annee'         => 'required|integer|min:2000|max:2100',
            'budget_global' => 'nullable|numeric|min:0',
            'statut'        => 'required|in:preparation,ouvert,cloture',
            'date_ouverture'=> 'nullable|date',
            'date_cloture'  => 'nullable|date|after_or_equal:date_ouverture',
        ]);

        GmpExerciceBudgetaire::create(array_merge($data, [
            'id'             => (string) Str::uuid(),
            'libelle'        => "Exercice {$data['annee']}",
            'organisation_id'=> $this->orgId(),
            'created_by'     => $this->currentUser()->id,
        ]));

        return back()->with('success', "Exercice {$data['annee']} créé.");
    }

    public function updateExercice(Request $request, string $id)
    {
        $exercice = GmpExerciceBudgetaire::where('organisation_id', $this->orgId())
            ->findOrFail($id);

        $data = $request->validate([
            'annee'         => 'required|integer|min:2000|max:2100',
            'budget_global' => 'nullable|numeric|min:0',
            'statut'        => 'required|in:preparation,ouvert,cloture',
            'date_ouverture'=> 'nullable|date',
            'date_cloture'  => 'nullable|date|after_or_equal:date_ouverture',
        ]);

        $data['libelle'] = "Exercice {$data['annee']}";

        $exercice->update($data);

        return back()->with('success', "Exercice {$data['annee']} mis à jour.");
    }

    public function showExercice(string $id)
    {
        $orgId    = $this->orgId();
        $exercice = GmpExerciceBudgetaire::where('organisation_id', $orgId)->findOrFail($id);

        $enveloppes = GmpEnveloppeSectorielle::where('organisation_id', $orgId)
            ->where('exercice_id', $id)
            ->with('secteur')
            ->orderByDesc('montant_alloue')
            ->get();

        $tousLesSecteurs = GmpSecteurIntervention::where('organisation_id', $orgId)
            ->where('actif', true)
            ->orderBy('libelle')
            ->get(['id', 'code', 'libelle', 'couleur']);

        $secteursDispo = $tousLesSecteurs->whereNotIn('id', $enveloppes->pluck('secteur_id'))->values();

        return Inertia::render('gmp/admin/exercices/show', [
            'exercice'       => $exercice,
            'enveloppes'     => $enveloppes,
            'secteurs_dispo' => $secteursDispo,
            'total_alloue'   => (float) $enveloppes->sum('montant_alloue'),
            'total_engage'   => (float) $enveloppes->sum('montant_engage'),
        ]);
    }

    public function storeEnveloppe(Request $request, string $id)
    {
        $exercice = GmpExerciceBudgetaire::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'secteur_id'     => 'required|uuid',
            'montant_alloue' => 'required|numeric|min:0',
        ]);

        GmpEnveloppeSectorielle::create([
            'id'              => (string) Str::uuid(),
            'organisation_id' => $this->orgId(),
            'exercice_id'     => $exercice->id,
            'secteur_id'      => $data['secteur_id'],
            'montant_alloue'  => $data['montant_alloue'],
            'montant_engage'  => 0,
        ]);

        return back()->with('success', 'Enveloppe créée.');
    }

    public function updateEnveloppe(Request $request, string $id, string $envId)
    {
        $enveloppe = GmpEnveloppeSectorielle::where('organisation_id', $this->orgId())
            ->where('exercice_id', $id)
            ->findOrFail($envId);

        $data = $request->validate([
            'montant_alloue' => 'required|numeric|min:0',
        ]);

        $enveloppe->update($data);

        return back()->with('success', 'Enveloppe mise à jour.');
    }

    public function destroyEnveloppe(string $id, string $envId)
    {
        $enveloppe = GmpEnveloppeSectorielle::where('organisation_id', $this->orgId())
            ->where('exercice_id', $id)
            ->findOrFail($envId);

        if ((float) $enveloppe->montant_engage > 0) {
            return back()->withErrors(['enveloppe' => 'Impossible de supprimer : des engagements existent sur ce secteur.']);
        }

        $enveloppe->delete();

        return back()->with('success', 'Enveloppe supprimée.');
    }

    // ── Types de marché ───────────────────────────────────────────────────────

    public function typesMarche()
    {
        $types = GmpTypeMarche::where('organisation_id', $this->orgId())
            ->withCount('marchesPrevus')
            ->orderBy('code')
            ->get();

        return Inertia::render('gmp/admin/types-marche/index', [
            'types' => $types,
        ]);
    }

    public function storeTypeMarche(Request $request)
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20',
            'libelle'     => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        GmpTypeMarche::create(array_merge($data, [
            'id'             => (string) Str::uuid(),
            'organisation_id'=> $this->orgId(),
            'actif'          => true,
        ]));

        return back()->with('success', 'Type de marché créé.');
    }

    public function updateTypeMarche(Request $request, string $id)
    {
        $type = GmpTypeMarche::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'code'        => 'required|string|max:20',
            'libelle'     => 'required|string|max:100',
            'description' => 'nullable|string',
            'actif'       => 'boolean',
        ]);

        $type->update($data);

        return back()->with('success', 'Type de marché mis à jour.');
    }

    public function destroyTypeMarche(string $id)
    {
        $type = GmpTypeMarche::where('organisation_id', $this->orgId())->findOrFail($id);
        $type->delete();

        return back()->with('success', 'Type de marché supprimé.');
    }

    // ── Modes de passation ────────────────────────────────────────────────────

    public function modesPassation()
    {
        $modes = GmpModePassation::where('organisation_id', $this->orgId())
            ->orderBy('code')
            ->get();

        return Inertia::render('gmp/admin/modes-passation/index', [
            'modes' => $modes,
        ]);
    }

    public function storeModePassation(Request $request)
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20',
            'libelle'     => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        GmpModePassation::create(array_merge($data, [
            'id'             => (string) Str::uuid(),
            'organisation_id'=> $this->orgId(),
            'actif'          => true,
        ]));

        return back()->with('success', 'Mode de passation créé.');
    }

    public function updateModePassation(Request $request, string $id)
    {
        $mode = GmpModePassation::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'code'        => 'required|string|max:20',
            'libelle'     => 'required|string|max:100',
            'description' => 'nullable|string',
            'actif'       => 'boolean',
        ]);

        $mode->update($data);

        return back()->with('success', 'Mode de passation mis à jour.');
    }

    public function destroyModePassation(string $id)
    {
        $mode = GmpModePassation::where('organisation_id', $this->orgId())->findOrFail($id);
        $mode->delete();

        return back()->with('success', 'Mode de passation supprimé.');
    }

    // ── Secteurs d'intervention ───────────────────────────────────────────────

    public function secteurs()
    {
        $secteurs = GmpSecteurIntervention::where('organisation_id', $this->orgId())
            ->withCount('marchesPrevus')
            ->orderBy('libelle')
            ->get();

        return Inertia::render('gmp/admin/secteurs/index', [
            'secteurs' => $secteurs,
        ]);
    }

    public function storeSecteur(Request $request)
    {
        $data = $request->validate([
            'code'    => 'required|string|max:30',
            'libelle' => 'required|string|max:100',
            'couleur' => 'nullable|string|max:7',
        ]);

        GmpSecteurIntervention::create(array_merge($data, [
            'id'             => (string) Str::uuid(),
            'organisation_id'=> $this->orgId(),
            'actif'          => true,
        ]));

        return back()->with('success', 'Secteur créé.');
    }

    public function updateSecteur(Request $request, string $id)
    {
        $secteur = GmpSecteurIntervention::where('organisation_id', $this->orgId())->findOrFail($id);

        $data = $request->validate([
            'code'    => 'required|string|max:30',
            'libelle' => 'required|string|max:100',
            'couleur' => 'nullable|string|max:7',
            'actif'   => 'boolean',
        ]);

        $secteur->update($data);

        return back()->with('success', 'Secteur mis à jour.');
    }

    public function destroySecteur(string $id)
    {
        $secteur = GmpSecteurIntervention::where('organisation_id', $this->orgId())->findOrFail($id);
        $secteur->delete();

        return back()->with('success', 'Secteur supprimé.');
    }

    // ── Seuils réglementaires ─────────────────────────────────────────────────

    public function seuils()
    {
        $seuils = GmpSeuilReglementaire::where('organisation_id', $this->orgId())
            ->with(['typeMarche', 'modePassation'])
            ->orderByDesc('annee_application')
            ->orderBy('montant_min')
            ->get();

        $typesMarche   = GmpTypeMarche::where('organisation_id', $this->orgId())->where('actif', true)->get();
        $modesPassation= GmpModePassation::where('organisation_id', $this->orgId())->where('actif', true)->get();

        return Inertia::render('gmp/admin/seuils/index', [
            'seuils'          => $seuils,
            'types_marche'    => $typesMarche,
            'modes_passation' => $modesPassation,
        ]);
    }
}
