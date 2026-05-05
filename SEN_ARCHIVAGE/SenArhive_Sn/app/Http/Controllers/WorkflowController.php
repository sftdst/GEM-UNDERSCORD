<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkflowController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $workflows = Workflow::with('createur')
            ->withCount('instances')
            ->latest()
            ->get();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->select('id', 'nom', 'prenom', 'email')
            ->where('statut', 'actif')
            ->get();

        return Inertia::render('workflows/index', [
            'workflows' => $workflows,
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'etapes' => 'required|array|min:1',
            'etapes.*.nom' => 'required|string',
            'etapes.*.approbateur_id' => 'required|exists:utilisateurs,id',
        ]);

        Workflow::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
            'created_by' => auth()->id(),
            'actif' => true,
        ]);

        return redirect()->back()->with('success', 'Workflow cree avec succes.');
    }

    public function update(Request $request, Workflow $workflow)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'etapes' => 'sometimes|required|array|min:1',
            'actif' => 'sometimes|boolean',
        ]);

        $workflow->update($validated);

        return redirect()->back()->with('success', 'Workflow mis a jour.');
    }

    public function destroy(Workflow $workflow)
    {
        $workflow->delete();

        return redirect()->back()->with('success', 'Workflow supprime.');
    }
}
