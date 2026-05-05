<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Dossier;
use App\Models\Espace;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EspaceController extends Controller
{
    public function index()
    {
        $espaces = Espace::withCount('dossiers')
            ->withCount('documents')
            ->get();

        return Inertia::render('espaces/index', [
            'espaces' => $espaces,
        ]);
    }

    public function show(Espace $espace)
    {
        $dossiers = Dossier::where('espace_id', $espace->id)
            ->whereNull('parent_id')
            ->withCount('documents')
            ->orderBy('nom')
            ->get();

        $documents = Document::where('organisation_id', auth()->user()->organisation_id)
            ->whereNull('dossier_id')
            ->with(['categorie', 'tags'])
            ->latest()
            ->get()
            ->map(function ($doc) {
                $doc->taille_formatee = $doc->taille_formatee;
                return $doc;
            });

        return Inertia::render('espaces/show', [
            'espace' => $espace,
            'dossiers' => $dossiers,
            'documents' => $documents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'couleur' => 'nullable|string|max:7',
            'icone' => 'nullable|string|max:50',
        ]);

        Espace::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Espace créé avec succès.');
    }

    public function update(Request $request, Espace $espace)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'couleur' => 'nullable|string|max:7',
            'icone' => 'nullable|string|max:50',
        ]);

        $espace->update($validated);

        return redirect()->back()->with('success', 'Espace mis à jour.');
    }

    public function destroy(Espace $espace)
    {
        $espace->delete();

        return redirect()->back()->with('success', 'Espace supprimé.');
    }
}
