<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use App\Models\Document;
use App\Models\Dossier;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DossierController extends Controller
{
    public function show(Dossier $dossier)
    {
        $user = auth()->user();
        $dossier->load('espace');

        $sousDossiers = Dossier::where('parent_id', $dossier->id)
            ->withCount('documents')
            ->orderBy('nom')
            ->get();

        $documentsQuery = Document::where('dossier_id', $dossier->id)
            ->with(['categorie', 'tags', 'createur'])
            ->latest();

        // Un utilisateur rattaché à un service ne voit que les documents de son service
        if ($user->service_id) {
            $documentsQuery->where('service_id', $user->service_id);
        }

        $documents = $documentsQuery->get()->map(function ($doc) {
            $doc->taille_formatee = $doc->taille_formatee;
            return $doc;
        });

        // Build ancestors (parents only, not current dossier)
        $ancestors = [];
        $current = $dossier->parent;
        while ($current) {
            array_unshift($ancestors, [
                'id' => $current->id,
                'nom' => $current->nom,
            ]);
            $current = $current->parent;
        }

        $orgId = auth()->user()->organisation_id;

        $categories = Categorie::where('organisation_id', $orgId)
            ->select('id', 'nom', 'parent_id')
            ->orderBy('nom')
            ->get();

        return Inertia::render('dossiers/show', [
            'dossier' => $dossier,
            'sousDossiers' => $sousDossiers,
            'documents' => $documents,
            'ancestors' => $ancestors,
            'categories' => $categories,
        ]);
    }

    public function qrCode(Dossier $dossier)
    {
        if (empty($dossier->qr_token)) {
            $dossier->update(['qr_token' => Str::random(32)]);
        }

        $url = url('/public/dossier/' . $dossier->qr_token);

        $renderer = new ImageRenderer(
            new RendererStyle(300),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($url);

        return response($svg, 200)->header('Content-Type', 'image/svg+xml');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'espace_id' => 'required|exists:espaces,id',
            'parent_id' => 'nullable|exists:dossiers,id',
            'couleur' => 'nullable|string|max:7',
        ]);

        $parent = $validated['parent_id']
            ? Dossier::find($validated['parent_id'])
            : null;

        $chemin = $parent
            ? $parent->chemin . '/' . $validated['nom']
            : '/' . $validated['nom'];

        $niveau = $parent
            ? $parent->niveau + 1
            : 0;

        Dossier::create([
            ...$validated,
            'chemin' => $chemin,
            'niveau' => $niveau,
            'organisation_id' => auth()->user()->organisation_id,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Dossier créé avec succès.');
    }

    public function update(Request $request, Dossier $dossier)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'couleur' => 'nullable|string|max:7',
        ]);

        $dossier->update($validated);

        return redirect()->back()->with('success', 'Dossier mis à jour.');
    }

    public function destroy(Dossier $dossier)
    {
        $dossier->delete();

        return redirect()->back()->with('success', 'Dossier supprimé.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:dossiers,id',
        ]);

        Dossier::whereIn('id', $validated['ids'])
            ->where('organisation_id', auth()->user()->organisation_id)
            ->delete();

        return redirect()->back()->with('success', count($validated['ids']) . ' dossier(s) supprimé(s).');
    }

    public function bulkExport(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:dossiers,id',
        ]);

        $dossiers = Dossier::whereIn('id', $validated['ids'])
            ->where('organisation_id', auth()->user()->organisation_id)
            ->get();

        if ($dossiers->isEmpty()) {
            return response()->json(['error' => 'Aucun dossier sélectionné.'], 422);
        }

        $zipFileName = 'dossiers_' . now()->format('Y-m-d_His') . '.zip';
        $zipPath = storage_path("app/private/temp/{$zipFileName}");

        if (!is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            return response()->json(['error' => 'Impossible de créer l\'archive ZIP.'], 500);
        }

        foreach ($dossiers as $dossier) {
            $this->addDossierToZip($zip, $dossier, '');
        }

        $zip->close();

        if (!file_exists($zipPath) || filesize($zipPath) === 0) {
            @unlink($zipPath);
            return response()->json(['error' => 'Les dossiers sélectionnés ne contiennent aucun document.'], 422);
        }

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    public function export(Dossier $dossier)
    {
        $zipFileName = Str::slug($dossier->nom) . '_' . now()->format('Y-m-d_His') . '.zip';
        $zipPath = storage_path("app/private/temp/{$zipFileName}");

        if (!is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            return redirect()->back()->with('error', 'Impossible de creer l\'archive ZIP.');
        }

        $this->addDossierToZip($zip, $dossier, '');

        $zip->close();

        // Check if zip has any content
        if (filesize($zipPath) === 0) {
            @unlink($zipPath);
            return redirect()->back()->with('error', 'Le dossier ne contient aucun document.');
        }

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    private function addDossierToZip(\ZipArchive $zip, Dossier $dossier, string $prefix): void
    {
        $folderPath = $prefix ? $prefix . '/' . $dossier->nom : $dossier->nom;
        $zip->addEmptyDir($folderPath);

        // Add documents in this dossier
        $documents = $dossier->documents()->with('derniereVersion')->get();
        foreach ($documents as $doc) {
            $version = $doc->derniereVersion;
            if (!$version) continue;

            $filePath = storage_path("app/private/{$version->chemin_stockage}");
            if (file_exists($filePath)) {
                $zip->addFile($filePath, $folderPath . '/' . $doc->nom_fichier_original);
            }
        }

        // Recursively add sub-dossiers
        $enfants = $dossier->enfants()->get();
        foreach ($enfants as $enfant) {
            $this->addDossierToZip($zip, $enfant, $folderPath);
        }
    }
}
