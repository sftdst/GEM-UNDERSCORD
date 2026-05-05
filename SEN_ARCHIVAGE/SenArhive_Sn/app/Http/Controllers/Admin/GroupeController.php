<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GroupeController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $groupes = Groupe::with('utilisateurs')->get();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->get();

        return Inertia::render('admin/groupes/index', [
            'groupes' => $groupes,
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Groupe::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
        ]);

        return redirect()->back()->with('success', 'Groupe créé avec succès.');
    }

    public function update(Request $request, Groupe $groupe)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $groupe->update($validated);

        return redirect()->back()->with('success', 'Groupe mis à jour.');
    }

    public function destroy(Groupe $groupe)
    {
        $groupe->delete();

        return redirect()->back()->with('success', 'Groupe supprimé.');
    }

    public function addUtilisateur(Request $request, Groupe $groupe)
    {
        $validated = $request->validate([
            'utilisateur_id' => 'required|exists:utilisateurs,id',
        ]);

        $groupe->utilisateurs()->syncWithoutDetaching([
            $validated['utilisateur_id'] => ['ajoute_le' => now()],
        ]);

        return redirect()->back()->with('success', 'Utilisateur ajouté au groupe.');
    }

    public function removeUtilisateur(Groupe $groupe, Utilisateur $utilisateur)
    {
        $groupe->utilisateurs()->detach($utilisateur->id);

        return redirect()->back()->with('success', 'Utilisateur retiré du groupe.');
    }
}
