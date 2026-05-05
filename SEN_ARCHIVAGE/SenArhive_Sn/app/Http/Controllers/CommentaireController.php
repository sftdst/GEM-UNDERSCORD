<?php

namespace App\Http\Controllers;

use App\Models\Commentaire;
use Illuminate\Http\Request;

class CommentaireController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'contenu' => 'required|string',
            'parent_id' => 'nullable|exists:commentaires,id',
        ]);

        Commentaire::create([
            ...$validated,
            'utilisateur_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Commentaire ajouté.');
    }

    public function update(Request $request, Commentaire $commentaire)
    {
        $validated = $request->validate([
            'contenu' => 'required|string',
        ]);

        $commentaire->update($validated);

        return redirect()->back()->with('success', 'Commentaire mis à jour.');
    }

    public function destroy(Commentaire $commentaire)
    {
        $commentaire->delete();

        return redirect()->back()->with('success', 'Commentaire supprimé.');
    }

    public function resolve(Commentaire $commentaire)
    {
        $commentaire->update([
            'est_resolu' => !$commentaire->est_resolu,
        ]);

        return redirect()->back()->with('success', 'Statut du commentaire mis à jour.');
    }
}
