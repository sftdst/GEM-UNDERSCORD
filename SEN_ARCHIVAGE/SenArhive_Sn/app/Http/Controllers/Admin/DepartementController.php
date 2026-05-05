<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartementController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $departements = Departement::where('organisation_id', $orgId)
            ->withCount('services')
            ->with('responsable')
            ->orderBy('nom')
            ->get();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->select('id', 'nom', 'prenom')
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/departements/index', [
            'departements' => $departements,
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'nullable|string|max:20',
            'responsable_id' => 'nullable|exists:utilisateurs,id',
        ]);

        Departement::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
        ]);

        return redirect()->back()->with('success', 'Departement cree avec succes.');
    }

    public function update(Request $request, Departement $departement)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'nullable|string|max:20',
            'responsable_id' => 'nullable|exists:utilisateurs,id',
        ]);

        $departement->update($validated);

        return redirect()->back()->with('success', 'Departement mis a jour.');
    }

    public function destroy(Departement $departement)
    {
        $departement->delete();

        return redirect()->back()->with('success', 'Departement supprime.');
    }
}
