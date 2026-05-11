<?php

namespace App\Http\Controllers\Gmp;

use App\Http\Controllers\Controller;
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
    private function orgId(): string
    {
        return auth()->user()->organisation_id;
    }

    // ── Exercices budgétaires ─────────────────────────────────────────────────

    public function exercices()
    {
        $exercices = GmpExerciceBudgetaire::where('organisation_id', $this->orgId())
            ->with('createur')
            ->orderByDesc('annee')
            ->get();

        return Inertia::render('gmp/admin/exercices/index', [
            'exercices' => $exercices,
        ]);
    }

    public function storeExercice(Request $request)
    {
        $data = $request->validate([
            'annee'         => 'required|integer|min:2000|max:2100',
            'budget_global' => 'nullable|numeric|min:0',
            'statut'        => 'required|in:preparation,ouvert,cloture',
            'date_ouverture'=> 'nullable|date',
            'date_cloture'  => 'nullable|date|after:date_ouverture',
        ]);

        GmpExerciceBudgetaire::create(array_merge($data, [
            'id'             => (string) Str::uuid(),
            'organisation_id'=> $this->orgId(),
            'created_by'     => auth()->id(),
        ]));

        return back()->with('success', "Exercice {$data['annee']} créé.");
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
