<?php

namespace App\Http\Controllers\Courrier;

use App\Http\Controllers\Controller;
use App\Models\Courrier;
use App\Models\CourrierDocument;
use App\Models\CourrierType;
use App\Models\CourrierStatut;
use App\Models\Dossier;
use App\Models\Utilisateur;
use App\Services\CourrierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;

class CourrierController extends Controller
{
    public function __construct(
        protected CourrierService $courrierService,
    ) {}

    /**
     * Tableau de bord des courriers
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $orgId = $user->organisation_id;

        // Statistiques
        $stats = [
            'total' => Courrier::where('organisation_id', $orgId)->count(),
            'recus' => Courrier::where('organisation_id', $orgId)->where('type', Courrier::TYPE_ENT)->where('statut', '!=', Courrier::STATUT_CLOTURE)->count(),
            'sortants' => Courrier::where('organisation_id', $orgId)->where('type', Courrier::TYPE_SOR)->where('statut', '!=', Courrier::STATUT_CLOTURE)->count(),
            'en_attente' => Courrier::where('organisation_id', $orgId)->where('statut', Courrier::STATUT_RECU)->count(),
            'en_cours' => Courrier::where('organisation_id', $orgId)->where('statut', Courrier::STATUT_EN_COURS)->count(),
            'en_retard' => Courrier::where('organisation_id', $orgId)
                ->where('statut', '!=', Courrier::STATUT_CLOTURE)
                ->where('date_echeance', '<', now())
                ->count(),
            'traites' => Courrier::where('organisation_id', $orgId)->where('statut', Courrier::STATUT_TRAITE)->count(),
            'clotures' => Courrier::where('organisation_id', $orgId)->where('statut', Courrier::STATUT_CLOTURE)->count(),
            'sans_reponse' => Courrier::where('organisation_id', $orgId)
                ->where('type', Courrier::TYPE_ENT)
                ->whereNotIn('statut', [Courrier::STATUT_CLOTURE])
                ->where(function ($q) {
                    $q->whereNull('agent_affecte_id')
                      ->orWhere('statut', Courrier::STATUT_RECU);
                })->count(),
        ];

        // Courriers récents
        $recents = Courrier::where('organisation_id', $orgId)
            ->with(['service', 'agent', 'typeCourrier', 'statutCourrier'])
            ->latest()
            ->take(10)
            ->get();

        // Alertes retard
        $alertes = Courrier::where('organisation_id', $orgId)
            ->where('statut', '!=', Courrier::STATUT_CLOTURE)
            ->where('date_echeance', '<', now())
            ->with(['service', 'agent'])
            ->orderBy('date_echeance')
            ->take(10)
            ->get();

        // Prochains délais (7 prochains jours)
        $prochains = Courrier::where('organisation_id', $orgId)
            ->where('statut', '!=', Courrier::STATUT_CLOTURE)
            ->whereBetween('date_echeance', [now(), now()->addDays(7)])
            ->with(['service', 'agent'])
            ->orderBy('date_echeance')
            ->get();

        $types = CourrierType::where('organisation_id', $orgId)->where('actif', true)->get();
        $statuts = CourrierStatut::where('organisation_id', $orgId)->where('actif', true)->orderBy('ordre')->get();

        return Inertia::render('courriers/index', [
            'stats' => $stats,
            'recents' => $recents,
            'alertes' => $alertes,
            'prochains' => $prochains,
            'types' => $types,
            'statuts' => $statuts,
        ]);
    }

    /**
     * Liste des courriers avec recherche et filtres
     */
    public function liste(Request $request)
    {
        $user = Auth::user();
        $orgId = $user->organisation_id;

        $query = Courrier::query()
            ->with(['service', 'agent', 'typeCourrier', 'statutCourrier', 'createur'])
            ->where('organisation_id', $orgId);

        // Recherche
        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'ilike', "%{$search}%")
                  ->orWhere('objet', 'ilike', "%{$search}%")
                  ->orWhere('expediteur_nom', 'ilike', "%{$search}%")
                  ->orWhere('destinataire_nom', 'ilike', "%{$search}%")
                  ->orWhere('contenu_texte', 'ilike', "%{$search}%");
            });
        }

        // Filtres
        if ($request->input('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->input('statut')) {
            $query->where('statut', $request->input('statut'));
        }
        if ($request->input('categorie')) {
            $query->where('categorie', $request->input('categorie'));
        }
        if ($request->input('urgence')) {
            $query->where('urgence', $request->input('urgence'));
        }
        if ($request->input('service_id')) {
            $query->where('service_id', $request->input('service_id'));
        }
        if ($request->input('agent_id')) {
            $query->where('agent_affecte_id', $request->input('agent_id'));
        }
        if ($request->input('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->input('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->input('en_retard')) {
            $query->where('date_echeance', '<', now())->where('statut', '!=', Courrier::STATUT_CLOTURE);
        }

        $courriers = $query->latest()->paginate(25)->withQueryString();

        $filters = [
            'types' => Courrier::where('organisation_id', $orgId)->selectRaw("DISTINCT type")->pluck('type'),
            'categories' => Courrier::where('organisation_id', $orgId)->whereNotNull('categorie')->selectRaw("DISTINCT categorie")->pluck('categorie'),
            'urgences' => [
                ['code' => 'Normal', 'label' => 'Normal'],
                ['code' => 'Urgent', 'label' => 'Urgent'],
                ['code' => 'TresUrgent', 'label' => 'Très urgent'],
            ],
            'services' => \App\Models\Service::where('organisation_id', $orgId)->where('actif', true)->get(['id','nom']),
            'agents' => Utilisateur::where('organisation_id', $orgId)->where('statut', 'actif')->get(['id','nom','prenom']),
        ];

        return Inertia::render('courriers/liste', [
            'courriers' => $courriers,
            'filters' => $filters,
            'filterValues' => $request->only(['q','type','statut','categorie','urgence','service_id','agent_id','date_from','date_to','en_retard']),
        ]);
    }

    /**
     * Formulaire de création — courrier entrant
     */
    public function createEntrant()
    {
        $user = Auth::user();
        $orgId = $user->organisation_id;

        $types = CourrierType::where('organisation_id', $orgId)->where('actif', true)->get();
        $services = \App\Models\Service::where('organisation_id', $orgId)->where('actif', true)->with('departement')->get();
        $agents = Utilisateur::where('organisation_id', $orgId)->where('statut', 'actif')->get();

        return Inertia::render('courriers/create-entrant', [
            'types' => $types,
            'services' => $services,
            'agents' => $agents,
            'numero' => Courrier::genererNumero(Courrier::TYPE_ENT),
        ]);
    }

    /**
     * Formulaire de création — courrier sortant
     */
    public function createSortant()
    {
        $user = Auth::user();
        $orgId = $user->organisation_id;

        $types = CourrierType::where('organisation_id', $orgId)->where('actif', true)->get();
        $services = \App\Models\Service::where('organisation_id', $orgId)->where('actif', true)->with('departement')->get();

        return Inertia::render('courriers/create-sortant', [
            'types' => $types,
            'services' => $services,
            'numero' => Courrier::genererNumero(Courrier::TYPE_SOR),
        ]);
    }

    /**
     * Stocker un courrier entrant
     */
    public function storeEntrant(Request $request)
    {
        $validated = $request->validate([
            'objet' => 'required|string|max:500',
            'expediteur_nom' => 'required|string|max:255',
            'expediteur_email' => 'nullable|email|max:255',
            'categorie' => 'nullable|in:Ordinaire,Confidentiel,Facture,Juridique,RH,Autre',
            'urgence' => 'nullable|in:Normal,Urgent,TresUrgent',
            'moyen_envoi' => 'nullable|string|max:50',
            'service_id' => 'nullable|exists:services,id',
            'courrier_type_id' => 'nullable|exists:courrier_types,id',
            'date_reception' => 'nullable|date',
            'date_echeance' => 'nullable|date|after_or_equal:today',
            'observations' => 'nullable|string',
            'fichier' => 'nullable|file|max:20480|mimes:pdf,jpg,jpeg,png,tiff,bmp,gif,doc,docx,xlsx,xls',
            'generer_accuse_reception' => 'nullable|boolean',
            'check_doublon' => 'nullable|boolean',
        ]);

        try {
            $courrier = $this->courrierService->creerCourrierEntrant($validated, $request->file('fichier'));
            return redirect()->route('courriers.show', $courrier->id)->with('success', 'Courrier entrant enregistré avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['fichier' => $e->getMessage()]);
        }
    }

    /**
     * Stocker un courrier sortant
     */
    public function storeSortant(Request $request)
    {
        $validated = $request->validate([
            'objet' => 'required|string|max:500',
            'destinataire_nom' => 'required|string|max:255',
            'destinataire_email' => 'nullable|email|max:255',
            'categorie' => 'nullable|in:Ordinaire,Confidentiel,Facture,Juridique,RH,Autre',
            'urgence' => 'nullable|in:Normal,Urgent,TresUrgent',
            'moyen_envoi' => 'nullable|string|max:50',
            'service_id' => 'nullable|exists:services,id',
            'courrier_type_id' => 'nullable|exists:courrier_types,id',
            'date_envoi' => 'nullable|date',
            'date_echeance' => 'nullable|date|after_or_equal:today',
            'observations' => 'nullable|string',
            'fichier' => 'nullable|file|max:20480|mimes:pdf,jpg,jpeg,png,tiff,bmp,gif,doc,docx,xlsx,xls',
            'generer_accuse_reception' => 'nullable|boolean',
        ]);

        try {
            $courrier = $this->courrierService->creerCourrierSortant($validated, $request->file('fichier'));
            return redirect()->route('courriers.show', $courrier->id)->with('success', 'Courrier sortant enregistré avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['fichier' => $e->getMessage()]);
        }
    }

    /**
     * Afficher un courrier
     */
    public function show(Courrier $courrier)
    {
        $this->authorize('view', $courrier);

        $courrier->load([
            'service', 'agent', 'typeCourrier', 'statutCourrier',
            'documents', 'commentaires.utilisateur',
            'historiques.utilisateur',
            'notifications' => function ($q) {
                $q->where('user_id', auth()->id())->orderBy('created_at', 'desc');
            },
        ]);

        $services = \App\Models\Service::where('organisation_id', $courrier->organisation_id)->where('actif', true)->get(['id','nom']);
        $agents = Utilisateur::where('organisation_id', $courrier->organisation_id)->where('statut', 'actif')->get(['id','nom','prenom']);
        $courriers = Courrier::where('organisation_id', $courrier->organisation_id)->where('id', '!=', $courrier->id)->select('id','numero','objet')->get();

        return Inertia::render('courriers/show', [
            'courrier' => $courrier,
            'services' => $services,
            'agents' => $agents,
            'autresCourriers' => $courriers,
            'statuts' => [
                Courrier::STATUT_RECU => 'Reçu',
                Courrier::STATUT_AFFECTE => 'Affecté',
                Courrier::STATUT_EN_COURS => 'En cours',
                Courrier::STATUT_TRAITE => 'Traité',
                Courrier::STATUT_CLOTURE => 'Clôturé',
            ],
            'urgences' => Courrier::$urgences,
            'types' => [
                Courrier::TYPE_ENT => 'Entrant',
                Courrier::TYPE_SOR => 'Sortant',
            ],
            'categories' => [
                Courrier::CATEGORIE_ORDINAIRE,
                Courrier::CATEGORIE_CONFIDENTIEL,
                Courrier::CATEGORIE_FACTURE,
                Courrier::CATEGORIE_JURIDIQUE,
                Courrier::CATEGORIE_RH,
                Courrier::CATEGORIE_AUTRE,
            ],
        ]);
    }

    /**
     * Mettre à jour un courrier
     */
    public function update(Request $request, Courrier $courrier)
    {
        $this->authorize('update', $courrier);

        $validated = $request->validate([
            'objet' => 'required|string|max:500',
            'reference' => 'nullable|string|max:100',
            'categorie' => 'nullable|in:Ordinaire,Confidentiel,Facture,Juridique,RH,Autre',
            'urgence' => 'nullable|in:Normal,Urgent,TresUrgent',
            'observations' => 'nullable|string',
            'date_echeance' => 'nullable|date|after_or_equal:today',
        ]);

        $courrier->update($validated);
        $this->courrierService->ajouterHistorique($courrier->id, 'modification', null, null, null, 'Modification des informations');

        return redirect()->back()->with('success', 'Courrier mis à jour.');
    }

    /**
     * Supprimer un courrier
     */
    public function destroy(Courrier $courrier)
    {
        $this->authorize('delete', $courrier);
        $this->courrierService->supprimer($courrier);
        return redirect()->route('courriers.liste')->with('success', 'Courrier supprimé.');
    }

    /**
     * Affecter un courrier à un agent
     */
    public function affecter(Request $request, Courrier $courrier)
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:utilisateurs,id',
            'motif' => 'nullable|string',
        ]);

        $this->courrierService->affecter($courrier, $validated['agent_id'], $validated['motif']);
        return redirect()->back()->with('success', 'Courrier affecté avec succès.');
    }

    /**
     * Transférer un courrier
     */
    public function transferer(Request $request, Courrier $courrier)
    {
        $validated = $request->validate([
            'destinataire_id' => 'required|exists:utilisateurs,id',
            'motif' => 'required|string|max:500',
        ]);

        $this->courrierService->transferer($courrier, $validated['destinataire_id'], $validated['motif']);
        return redirect()->back()->with('success', 'Courrier transféré.');
    }

    /**
     * Changer le statut d'un courrier
     */
    public function changerStatut(Request $request, Courrier $courrier)
    {
        $validated = $request->validate([
            'statut' => 'required|in:RECU,AFFECTE,EN_COURS,TRAITE,CLOTURE',
            'motif' => 'nullable|string',
        ]);

        $this->courrierService->changerStatut($courrier, $validated['statut'], $validated['motif']);
        return redirect()->back()->with('success', 'Statut mis à jour.');
    }

    /**
     * Télécharger un document
     */
    public function telechargerDocument(CourrierDocument $document)
    {
        if (!Storage::disk('local')->exists($document->chemin)) {
            abort(404, 'Fichier introuvable');
        }
        return Storage::disk('local')->download($document->chemin, $document->nom_fichier_original);
    }

/**
     * Ajouter un commentaire interne
     */
    public function ajouterCommentaire(Request $request)
    {
        $validated = $request->validate([
            'contenu' => 'required|string|max:2000',
            'courrier_id' => 'required|exists:courriers,id',
        ]);

        $this->courrierService->ajouterCommentaire($validated['courrier_id'], $validated['contenu']);
        return redirect()->back()->with('success', 'Commentaire ajouté.');
    }

    /**
     * Uploader un document pour un courrier
     */
    public function uploadDocument(Request $request)
    {
        $validated = $request->validate([
            'courrier_id' => 'required|exists:courriers,id',
            'fichier' => 'required|file|max:20480|mimes:pdf,jpg,jpeg,png,tiff,bmp,gif,doc,docx,xlsx,xls',
            'description' => 'nullable|string|max:500',
        ]);

        $courrier = Courrier::findOrFail($validated['courrier_id']);
        $document = $this->courrierService->uploadDocument($courrier, $request->file('fichier'));

        if (!empty($validated['description'])) {
            $document->update(['description' => $validated['description']]);
        }

        return redirect()->back()->with('success', 'Document ajouté.');
    }

/**
      * Vérifier les doublons
      */
     public function verifierDoublon(Request $request)
     {
        $validated = $request->validate([
            'expediteur_nom' => 'required|string',
            'objet' => 'required|string',
            'date_reception' => 'required|date',
        ]);

        $doublon = Courrier::detecterDoublon($validated['expediteur_nom'], $validated['objet'], $validated['date_reception']);

        if ($doublon) {
            return response()->json([
                'doublon' => true,
                'courrier' => ['numero' => $doublon->numero, 'objet' => $doublon->objet, 'date_reception' => $doublon->date_reception->toDateString()],
            ]);
        }

        return response()->json(['doublon' => false]);
    }

/**
      * Notification read
      */
    public function marquerNotificationLu(CourrierNotification $notification)
    {
        $notification->update(['lu' => true, 'lu_le' => now()]);
        return redirect()->route('courriers.show', $notification->courrier_id);
    }

    /**
     * Archiver un courrier (clôturer avec archivage automatique)
     */
    public function archiver(Request $request, Courrier $courrier)
    {
        $validated = $request->validate([
            'motif' => 'nullable|string',
        ]);

        $this->courrierService->archiver($courrier, $validated['motif'] ?? '');
        return redirect()->back()->with('success', 'Courrier archivé avec succès.');
    }
}