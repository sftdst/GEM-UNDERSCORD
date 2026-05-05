<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fonctionnalite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FonctionnaliteController extends Controller
{
    public function index()
    {
        $fonctionnalites = Fonctionnalite::orderBy('categorie')->orderBy('ordre')->orderBy('nom')->get();

        return Inertia::render('superadmin/fonctionnalites/index', [
            'fonctionnalites' => $fonctionnalites,
        ]);
    }

    public function create()
    {
        return Inertia::render('superadmin/fonctionnalites/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'        => 'required|string|max:50|unique:fonctionnalites,code|regex:/^[a-z0-9_]+$/',
            'nom'         => 'required|string|max:100',
            'description' => 'nullable|string',
            'categorie'   => 'nullable|string|max:50',
            'ordre'       => 'integer|min:0',
            'actif'       => 'boolean',
        ]);

        Fonctionnalite::create($validated);

        return redirect()->route('superadmin.fonctionnalites.index')
                         ->with('success', "Fonctionnalité \"{$validated['nom']}\" créée avec succès");
    }

    public function edit(Fonctionnalite $fonctionnalite)
    {
        return Inertia::render('superadmin/fonctionnalites/edit', [
            'fonctionnalite' => $fonctionnalite,
        ]);
    }

    public function update(Request $request, Fonctionnalite $fonctionnalite)
    {
        $validated = $request->validate([
            'code'        => ['required', 'string', 'max:50', 'regex:/^[a-z0-9_]+$/',
                              \Illuminate\Validation\Rule::unique('fonctionnalites', 'code')->ignore($fonctionnalite->id)],
            'nom'         => 'required|string|max:100',
            'description' => 'nullable|string',
            'categorie'   => 'nullable|string|max:50',
            'ordre'       => 'integer|min:0',
            'actif'       => 'boolean',
        ]);

        $fonctionnalite->update($validated);

        return redirect()->route('superadmin.fonctionnalites.index')
                         ->with('success', "Fonctionnalité \"{$fonctionnalite->nom}\" mise à jour");
    }

    public function destroy(Fonctionnalite $fonctionnalite)
    {
        if ($fonctionnalite->plans()->count() > 0) {
            return redirect()->back()
                             ->with('error', "Impossible de supprimer : cette fonctionnalité est utilisée par {$fonctionnalite->plans()->count()} plan(s)");
        }

        $nom = $fonctionnalite->nom;
        $fonctionnalite->delete();

        return redirect()->route('superadmin.fonctionnalites.index')
                         ->with('success', "Fonctionnalité \"{$nom}\" supprimée");
    }

    public function toggle(Fonctionnalite $fonctionnalite)
    {
        $fonctionnalite->update(['actif' => !$fonctionnalite->actif]);

        $etat = $fonctionnalite->actif ? 'activée' : 'désactivée';
        return redirect()->back()->with('success', "Fonctionnalité \"{$fonctionnalite->nom}\" {$etat}");
    }
}
