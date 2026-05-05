<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categorie;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategorieController extends Controller
{
    public function index()
    {
        $categories = Categorie::with('enfants')
            ->whereNull('parent_id')
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        Categorie::create($validated);

        return redirect()->back()->with('success', 'Catégorie créée avec succès.');
    }

    public function update(Request $request, Categorie $categorie)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        // Prevent setting parent to self
        if (isset($validated['parent_id']) && $validated['parent_id'] === $categorie->id) {
            return redirect()->back()->withErrors(['parent_id' => 'Une catégorie ne peut pas être son propre parent.']);
        }

        $categorie->update($validated);

        return redirect()->back()->with('success', 'Catégorie mise à jour.');
    }

    public function destroy(Categorie $categorie)
    {
        // Re-parent children to null before deleting
        Categorie::where('parent_id', $categorie->id)->update(['parent_id' => null]);

        $categorie->delete();

        return redirect()->back()->with('success', 'Catégorie supprimée.');
    }
}
