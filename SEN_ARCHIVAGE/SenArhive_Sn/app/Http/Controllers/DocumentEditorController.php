<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentEditorService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentEditorController extends Controller
{
    public function __construct(
        protected DocumentEditorService $editorService,
    ) {}

    private function autoriserAcces(Document $document): void
    {
        $user = auth()->user();
        if ($user->service_id && $document->service_id !== $user->service_id) {
            abort(403, 'Vous n\'avez pas accès à ce document.');
        }
    }

    /**
     * Affiche la page d'édition du document
     */
    public function edit(Document $document)
    {
        $this->autoriserAcces($document);
        $user = auth()->user();

        // Vérifier si le document peut être édité
        if (!$this->editorService->canBeEdited($document)) {
            return back()->with('error', 'Ce format de document ne peut pas être édité');
        }

        // Récupérer l'aperçu HTML du document
        $preview = $this->editorService->getDocumentPreview($document);

        return Inertia::render('documents/editor', [
            'document' => $document->load('derniereVersion', 'createur'),
            'preview' => $preview,
            'editableExtensions' => ['docx', 'xlsx', 'xls', 'doc', 'txt'],
        ]);
    }

    /**
     * Sauvegarde le document édité
     */
    public function save(Request $request, Document $document)
    {
        $this->autoriserAcces($document);
        $user = auth()->user();

        // Valider la requête
        $validated = $request->validate([
            'content' => 'required|string',
            'commentaire' => 'nullable|string|max:500',
        ]);

        try {
            // Sauvegarder le document édité
            $newVersion = $this->editorService->saveEditedDocument(
                $document,
                $validated['content'],
                $user,
                $validated['commentaire']
            );

            return back()->with('success', 'Document enregistré avec succès. Nouvelle version: ' . $newVersion->numero_version);
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de la sauvegarde: ' . $e->getMessage());
        }
    }

    /**
     * Récupère l'aperçu du document
     */
    public function preview(Document $document)
    {
        $this->autoriserAcces($document);
        // Vérifier si le document peut être édité
        if (!$this->editorService->canBeEdited($document)) {
            return response()->json(['error' => 'Ce format de document ne peut pas être édité'], 400);
        }

        // Récupérer l'aperçu HTML du document
        $preview = $this->editorService->getDocumentPreview($document);

        return response()->json([
            'preview' => $preview,
            'documentId' => $document->id,
            'extension' => $document->extension,
            'version' => $document->version_courante,
        ]);
    }
}
