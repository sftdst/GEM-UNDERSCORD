<?php

namespace App\Http\Controllers;

use App\Exceptions\PlanLimitException;
use App\Mail\DocumentMail;
use App\Models\Categorie;
use App\Models\ConfigurationMail;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\DocumentSignature;
use App\Models\Pipeline;
use App\Models\PipelineInstance;
use App\Models\Tag;
use App\Models\Utilisateur;
use App\Services\AuditService;
use App\Services\DocumentFusionService;
use App\Services\DocumentSearchService;
use App\Services\DocumentStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentStorageService $storageService,
        protected AuditService $auditService,
    ) {}

    public function index(Request $request)
    {
        $user = auth()->user();

        $searchService = app(DocumentSearchService::class);
        $documents = $searchService->search($request->input('q', ''), [
            'service_id' => $user->service_id,
            'dossier_id' => $request->input('dossier_id'),
            'categorie_id' => $request->input('categorie_id'),
            'tag_ids' => $request->input('tag_ids'),
            'extension' => $request->input('extension'),
            'statut' => $request->input('statut'),
            'numero_document' => $request->input('numero_document'),
            'date_document' => $request->input('date_document'),
        ]);

        $orgId = auth()->user()->organisation_id;

        return Inertia::render('documents/index', [
            'documents' => $documents,
            'filters' => $request->only('q', 'dossier_id', 'categorie_id', 'tag_ids', 'extension', 'statut', 'numero_document', 'date_document'),
            'dossiers' => Dossier::where('organisation_id', $orgId)->select('id', 'nom', 'parent_id', 'espace_id')->get(),
            'categories' => Categorie::where('organisation_id', $orgId)->select('id', 'nom', 'parent_id')->get(),
            'tags' => Tag::where('organisation_id', $orgId)->select('id', 'nom', 'couleur')->get(),
            'utilisateurs' => Utilisateur::where('organisation_id', $orgId)
                ->where('statut', 'actif')
                ->where('id', '!=', auth()->id())
                ->select('id', 'nom', 'prenom', 'email')
                ->orderBy('nom')
                ->get(),
        ]);
    }

    /**
     * Vérifie que l'utilisateur a le droit d'accéder à ce document.
     * Un utilisateur rattaché à un service ne peut voir que les documents de son service.
     */
    private function autoriserAccesDocument(Document $document): void
    {
        $user = auth()->user();
        if ($user->service_id && $document->service_id !== $user->service_id) {
            abort(403, 'Vous n\'avez pas accès à ce document.');
        }
    }

    public function show(Document $document)
    {
        $this->autoriserAccesDocument($document);

        $document->load([
            'dossier',
            'categorie',
            'tags',
            'versions',
            'commentaires.utilisateur',
            'commentaires.reponses.utilisateur',
            'createur',
            'signatures.utilisateur',
        ]);

        $orgId = auth()->user()->organisation_id;

        $pipelineInstances = PipelineInstance::where('document_id', $document->id)
            ->with(['pipeline:id,nom', 'etapeCourante.etape:id,nom,ordre'])
            ->orderByDesc('created_at')
            ->get(['id', 'pipeline_id', 'statut', 'etape_courante_id', 'created_at']);

        return Inertia::render('documents/show', [
            'document' => $document,
            'categories' => Categorie::where('organisation_id', $orgId)->select('id', 'nom')->get(),
            'tags' => Tag::where('organisation_id', $orgId)->select('id', 'nom', 'couleur')->get(),
            'dossiers' => Dossier::where('organisation_id', $orgId)->select('id', 'nom', 'parent_id', 'espace_id')->get(),
            'pipelines' => Pipeline::where('organisation_id', $orgId)
                ->where('statut', 'actif')
                ->select('id', 'nom', 'description', 'type_document')
                ->orderBy('nom')
                ->get(),
            'pipeline_instances' => $pipelineInstances,
        ]);
    }

    public function sign(Request $request, Document $document)
    {
        $this->autoriserAccesDocument($document);

        $user = auth()->user();

        if (!app()->isLocal() && !$user->organisation->hasFonctionnalite('signature_electronique')) {
            return redirect()->back()->with('error', 'Votre abonnement ne permet pas la signature électronique.');
        }

        $validated = $request->validate([
            'signature_data' => 'nullable|string',
            'reference_externe' => 'nullable|string|max:255',
            'metadonnees' => 'nullable|array',
        ]);

        if ($document->signatures()->where('utilisateur_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'Vous avez déjà signé ce document.');
        }

        $signature = DocumentSignature::create([
            'document_id' => $document->id,
            'utilisateur_id' => $user->id,
            'signature_data' => $validated['signature_data'] ?? null,
            'signature_algo' => 'sha256',
            'reference_externe' => $validated['reference_externe'] ?? null,
            'metadonnees' => $validated['metadonnees'] ?? null,
            'signed_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $this->auditService->log('doc_signature', $document, null, ['signature_id' => $signature->id]);

        return redirect()->back()->with('success', 'Document signé électroniquement.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fichier' => 'required|file|max:102400',
            'titre' => 'required|string|max:255',
            'numero_document' => 'nullable|string|max:100',
            'date_document' => 'nullable|date',
            'dossier_id' => 'nullable|exists:dossiers,id',
            'categorie_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'date_archivage' => 'nullable|date|after:today',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        try {
            $document = $this->storageService->upload(
                $request->file('fichier'),
                auth()->user(),
                $validated['dossier_id'] ?? null,
                $validated,
            );
        } catch (PlanLimitException $e) {
            return redirect()->back()->withErrors(['fichier' => $e->getMessage()]);
        }

        if (!empty($validated['tags'])) {
            $document->tags()->sync($validated['tags']);
        }

        $this->auditService->log('doc_upload', $document);

        return redirect()->back()->with('success', 'Document uploadé avec succès.');
    }

    public function update(Request $request, Document $document)
    {
        $this->autoriserAccesDocument($document);

        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:255',
            'numero_document' => 'nullable|string|max:100',
            'date_document' => 'nullable|date',
            'description' => 'nullable|string',
            'categorie_id' => 'nullable|exists:categories,id',
            'date_archivage' => 'nullable|date|after:today',
            'dossier_id' => 'nullable|exists:dossiers,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        $document->update(collect($validated)->except('tags')->toArray());

        if ($request->has('tags')) {
            $document->tags()->sync($validated['tags'] ?? []);
        }

        $this->auditService->log('doc_update', $document);

        return redirect()->back()->with('success', 'Document mis à jour.');
    }

    public function destroy(Document $document)
    {
        $this->autoriserAccesDocument($document);
        $this->storageService->delete($document);
        $this->auditService->log('doc_delete', $document);

        return redirect()->back()->with('success', 'Document supprimé.');
    }

    public function download(Document $document)
    {
        $this->autoriserAccesDocument($document);
        $this->auditService->log('doc_download', $document);

        return $this->storageService->download($document);
    }

    public function preview(Document $document)
    {
        $this->autoriserAccesDocument($document);
        $version = $document->derniereVersion;
        if (!$version) {
            abort(404, 'Aucune version disponible');
        }

        $path = $version->chemin_stockage;
        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'Fichier introuvable');
        }

        return response()->file(
            Storage::disk('local')->path($path),
            ['Content-Type' => $document->type_mime]
        );
    }

    public function ocr(Document $document)
    {
        $this->autoriserAccesDocument($document);

        $ocrService = app(\App\Services\OcrService::class);
        $text = $ocrService->extractText($document);

        if ($text && !empty(trim($text))) {
            $wordCount = str_word_count($text);
            return redirect()->back()->with('success', "Texte extrait avec succès par OCR ({$wordCount} mots).");
        }

        $ext = strtolower($document->extension);
        $imageExts = ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'gif'];
        $tesseractAvailable = $ocrService->isTesseractAvailable();

        if (in_array($ext, $imageExts)) {
            $msg = $tesseractAvailable
                ? 'OCR exécuté, mais aucun texte n\'a été détecté sur cette image.'
                : 'Aucun texte extrait. Tesseract OCR n\'est pas installé sur le serveur (requis pour les images). Installez-le avec : sudo apt-get install tesseract-ocr tesseract-ocr-fra';
        } elseif ($ext === 'pdf') {
            $msg = $tesseractAvailable
                ? 'OCR exécuté, mais aucun texte n\'a été détecté. Ce PDF est peut-être un scan de mauvaise qualité.'
                : 'Aucun texte extrait. Ce PDF est un scan (image uniquement). Installez Tesseract OCR pour l\'analyser : sudo apt-get install tesseract-ocr tesseract-ocr-fra';
        } elseif (in_array($ext, ['docx', 'doc', 'odt'])) {
            $msg = 'Aucun texte trouvé dans ce document Word. Le fichier est peut-être vide ou protégé par mot de passe.';
        } elseif (in_array($ext, ['xlsx', 'ods'])) {
            $msg = 'Aucun texte trouvé dans ce fichier Excel. Le fichier est peut-être vide.';
        } else {
            $msg = 'Aucun texte trouvé dans ce document (fichier vide ou format non supporté).';
        }

        return redirect()->back()->with('error', $msg);
    }

    public function bulkDownload(Request $request)
    {
        $validated = $request->validate([
            'document_ids' => 'required|array|min:1',
            'document_ids.*' => 'exists:documents,id',
        ]);

        $documents = Document::whereIn('id', $validated['document_ids'])
            ->where('organisation_id', auth()->user()->organisation_id)
            ->with('derniereVersion')
            ->get();

        if ($documents->isEmpty()) {
            return redirect()->back()->with('error', 'Aucun document selectionne.');
        }

        $zipFileName = 'documents_' . now()->format('Y-m-d_His') . '.zip';
        $zipPath = storage_path("app/private/temp/{$zipFileName}");

        // Ensure temp directory exists
        if (!is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
            return redirect()->back()->with('error', 'Impossible de creer l\'archive ZIP.');
        }

        foreach ($documents as $doc) {
            $version = $doc->derniereVersion;
            if (!$version) continue;

            $filePath = storage_path("app/private/{$version->chemin_stockage}");
            if (file_exists($filePath)) {
                $zip->addFile($filePath, $doc->nom_fichier_original);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    public function sendByEmail(Request $request, Document $document)
    {
        $validated = $request->validate([
            'destinataire' => 'required|email|max:255',
            'message' => 'nullable|string|max:2000',
        ]);

        $user = auth()->user();

        // Utiliser la configuration mail de l'organisation si elle est active
        $mailConfig = ConfigurationMail::where('organisation_id', $user->organisation_id)
            ->where('actif', true)
            ->first();

        if ($mailConfig) {
            config($mailConfig->toMailConfig());
            config(['mail.default' => 'org_smtp']);
            $mailer = Mail::mailer('org_smtp');
        } else {
            $mailer = Mail::mailer();
        }

        $mailer->to($validated['destinataire'])->send(new DocumentMail(
            document: $document,
            destinataire: $validated['destinataire'],
            messagePersonnalise: $validated['message'] ?? '',
            expediteurNom: $user->nom_complet,
        ));

        $this->auditService->log('doc_email', $document);

        return redirect()->back()->with('success', "Document envoyé à {$validated['destinataire']}.");
    }

    public function uploadVersion(Request $request, Document $document)
    {
        $this->autoriserAccesDocument($document);

        $validated = $request->validate([
            'fichier' => 'required|file|max:102400',
            'commentaire' => 'nullable|string',
        ]);

        try {
            $this->storageService->newVersion(
                $document,
                $request->file('fichier'),
                auth()->user(),
                $validated['commentaire'] ?? null,
            );
        } catch (PlanLimitException $e) {
            return redirect()->back()->withErrors(['fichier' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Nouvelle version uploadée.');
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'fichiers' => 'required|array|min:1|max:20',
            'fichiers.*' => 'file|max:102400',
            'dossier_id' => 'nullable|exists:dossiers,id',
            'categorie_id' => 'nullable|exists:categories,id',
        ]);

        $count = 0;
        foreach ($request->file('fichiers') as $file) {
            $titre = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            try {
                $document = $this->storageService->upload(
                    $file,
                    auth()->user(),
                    $validated['dossier_id'] ?? null,
                    ['titre' => $titre, 'categorie_id' => $validated['categorie_id'] ?? null],
                );
            } catch (PlanLimitException $e) {
                $imported = $count > 0 ? " ({$count} importé(s) avant la limite)" : '';
                return redirect()->back()->withErrors(['fichiers' => $e->getMessage() . $imported]);
            }
            $this->auditService->log('doc_upload', $document);
            $count++;
        }

        return redirect()->back()->with('success', "{$count} document(s) importe(s) avec succes.");
    }

    public function storeScan(Request $request)
    {
        $validated = $request->validate([
            'fichier' => 'required|file|max:102400|mimes:jpg,jpeg,png,tiff,bmp,gif,pdf',
            'titre' => 'required|string|max:255',
            'dossier_id' => 'nullable|exists:dossiers,id',
            'categorie_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        try {
            $document = $this->storageService->upload(
                $request->file('fichier'),
                auth()->user(),
                $validated['dossier_id'] ?? null,
                $validated,
            );
        } catch (PlanLimitException $e) {
            return redirect()->back()->withErrors(['fichier' => $e->getMessage()]);
        }

        if (!empty($validated['tags'])) {
            $document->tags()->sync($validated['tags']);
        }

        $this->auditService->log('doc_upload', $document);

        // Auto-OCR
        $ocrService = app(\App\Services\OcrService::class);
        $text = $ocrService->extractText($document);

        if ($text && !empty(trim($text))) {
            return redirect()->back()->with('success', 'Scan uploadé et texte extrait par OCR avec succès.');
        }

        $tesseractAvailable = $ocrService->isTesseractAvailable();
        $msg = $tesseractAvailable
            ? 'Scan uploadé. OCR exécuté, mais aucun texte n\'a été détecté.'
            : 'Scan uploadé. Aucun texte détecté (Tesseract OCR requis pour les images).';

        return redirect()->back()->with('success', $msg);
    }

    public function suggestNumero(Request $request): \Illuminate\Http\JsonResponse
    {
        $dossierId = $request->query('dossier_id');

        if (!$dossierId) {
            return response()->json(['numero' => '']);
        }

        $dossier = Dossier::find($dossierId);
        if (!$dossier) {
            return response()->json(['numero' => '']);
        }

        // Remonter toute la hiérarchie (du plus haut au plus bas)
        $hierarchy = [];
        $current = $dossier;
        while ($current) {
            array_unshift($hierarchy, $current->nom);
            $current = $current->parent_id ? Dossier::find($current->parent_id) : null;
        }

        // Générer les initiales de chaque niveau
        $initiales = array_map(function (string $nom): string {
            $mots = preg_split('/[\s\-_]+/', trim($nom), -1, PREG_SPLIT_NO_EMPTY);
            if (count($mots) >= 2) {
                return strtoupper(implode('', array_map(fn($m) => mb_substr($m, 0, 1), $mots)));
            }
            return strtoupper(mb_substr($mots[0] ?? 'X', 0, 2));
        }, $hierarchy);

        $prefixe = implode('-', $initiales);
        $annee   = now()->year;

        // Séquence : nombre de docs dans ce dossier + 1
        $count = \App\Models\Document::where('dossier_id', $dossierId)->count();
        $seq   = str_pad($count + 1, 3, '0', STR_PAD_LEFT);

        return response()->json(['numero' => "{$prefixe}-{$annee}-{$seq}"]);
    }

    public function fusion(Request $request)
    {
        $validated = $request->validate([
            'document_ids'   => 'required|array|min:2|max:10',
            'document_ids.*' => 'exists:documents,id',
            'titre'          => 'required|string|max:500',
            'description'    => 'nullable|string',
            'dossier_id'     => 'nullable|exists:dossiers,id',
        ]);

        $orgId = auth()->user()->organisation_id;

        $documents = Document::whereIn('id', $validated['document_ids'])
            ->where('organisation_id', $orgId)
            ->with('derniereVersion')
            ->get();

        if ($documents->count() < 2) {
            return redirect()->back()->with('error', 'Sélectionnez au moins 2 documents appartenant à votre organisation.');
        }

        // Vérification : même extension
        $extensions = $documents->pluck('extension')->map(fn ($e) => strtolower($e))->unique();
        if ($extensions->count() > 1) {
            return redirect()->back()->with('error', 'Les documents sélectionnés doivent tous avoir la même extension.');
        }

        $fusionService = app(DocumentFusionService::class);
        $extension     = $extensions->first();

        if (!$fusionService->peutFusionner($extension)) {
            return redirect()->back()->with('error',
                "La fusion de fichiers .{$extension} n'est pas supportée. " .
                'Seuls les PDF et les fichiers texte (.txt, .csv) sont pris en charge.'
            );
        }

        try {
            $dossierId = $validated['dossier_id'] ?? $documents->first()->dossier_id;

            $document = $fusionService->fusionner(
                $documents->all(),
                $validated['titre'],
                auth()->user(),
                $dossierId,
                $validated['description'] ?? null,
            );

            $this->auditService->log('doc_fusion', $document);

            return redirect()->route('documents.show', $document)
                ->with('success', count($documents->all()) . ' documents fusionnés avec succès.');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur lors de la fusion : ' . $e->getMessage());
        }
    }
}