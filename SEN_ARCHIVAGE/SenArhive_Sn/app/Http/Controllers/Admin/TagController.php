<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::withCount('documents')
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/tags/index', [
            'tags' => $tags,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'nullable|string|max:7',
        ]);

        Tag::create($validated);

        return redirect()->back()->with('success', 'Tag créé avec succès.');
    }

    public function update(Request $request, Tag $tag)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'couleur' => 'nullable|string|max:7',
        ]);

        $tag->update($validated);

        return redirect()->back()->with('success', 'Tag mis à jour.');
    }

    public function destroy(Tag $tag)
    {
        $tag->documents()->detach();
        $tag->delete();

        return redirect()->back()->with('success', 'Tag supprimé.');
    }
}
