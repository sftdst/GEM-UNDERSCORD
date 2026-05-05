<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Pipeline;
use App\Models\PipelineEtapeInstance;
use App\Models\PipelineInstance;
use App\Models\Role;
use App\Models\Service;
use App\Models\Utilisateur;
use App\Services\PipelineService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PipelineInstanceController extends Controller
{
    public function __construct(private readonly PipelineService $pipelineService) {}

    public function index(Request $request)
    {
        $user   = auth()->user();
        $filtre = $request->input('filtre', 'tous'); // 'tous' | 'mes_taches'

        $query = PipelineInstance::with(['pipeline', 'document', 'initiateur', 'etapeCourante.etape'])
            ->whereHas('pipeline', fn ($q) => $q->where('organisation_id', $user->organisation_id));

        if ($filtre === 'mes_taches') {
            // Instances actives où l'étape courante m'est assignée (override prioritaire, sinon template)
            $query->where('statut', 'en_cours')
                ->whereHas('etapeCourante', function ($q) use ($user) {
                    $q->where(function ($sub) use ($user) {
                        // Cas 1 : override défini — vérifier acteur_type_override + acteur_id_override
                        $sub->where(function ($o) use ($user) {
                            $o->whereNotNull('acteur_type_override')
                                ->where(function ($ov) use ($user) {
                                    $ov->where(function ($u) use ($user) {
                                        $u->where('acteur_type_override', 'utilisateur')
                                          ->where('acteur_id_override', $user->id);
                                    })->orWhere(function ($s) use ($user) {
                                        $s->where('acteur_type_override', 'service')
                                          ->where('acteur_id_override', $user->service_id);
                                    })->orWhere(function ($r) use ($user) {
                                        $r->where('acteur_type_override', 'role')
                                          ->where('acteur_id_override', $user->role_id);
                                    });
                                });
                        })
                        // Cas 2 : pas d'override — utiliser le template pipeline_etapes
                        ->orWhere(function ($no) use ($user) {
                            $no->whereNull('acteur_type_override')
                                ->whereHas('etape', function ($e) use ($user) {
                                    $e->where(function ($u) use ($user) {
                                        $u->where('type_acteur', 'utilisateur')->where('acteur_id', $user->id);
                                    })->orWhere(function ($s) use ($user) {
                                        $s->where('type_acteur', 'service')->where('acteur_id', $user->service_id);
                                    })->orWhere(function ($r) use ($user) {
                                        $r->where('type_acteur', 'role')->where('acteur_id', $user->role_id);
                                    });
                                });
                        });
                    });
                });
        }

        $instances = $query->latest()->paginate(20)->withQueryString();

        $pipelines = Pipeline::where('organisation_id', $user->organisation_id)
            ->where('statut', 'actif')
            ->select('id', 'nom')
            ->get();

        $documents = Document::where('organisation_id', $user->organisation_id)
            ->whereNull('deleted_at')
            ->select('id', 'titre', 'numero_document')
            ->latest()
            ->get();

        return Inertia::render('pipeline/instances/index', [
            'instances' => $instances,
            'pipelines' => $pipelines,
            'documents' => $documents,
            'filtre'    => $filtre,
        ]);
    }

    public function show(PipelineInstance $pipelineInstance)
    {
        $pipelineInstance->load([
            'pipeline.etapes',
            'document',
            'initiateur',
            'etapeCourante.etape',
            'etapeInstances.etape',
            'etapeInstances.traitePar',
            'etapeInstances.annotations.utilisateur',
            'historique.utilisateur',
            'historique.etapeInstance.etape',
        ]);

        $user = auth()->user();
        $orgId = $user->organisation_id;
        $etapeCourante = $pipelineInstance->etapeCourante;
        $peutTraiter = false;

        if ($etapeCourante && $pipelineInstance->statut === 'en_cours') {
            // Utilise peutEtreTraiteePar() sur l'instance qui respecte les overrides
            $peutTraiter = $etapeCourante->peutEtreTraiteePar($user);
        }

        return Inertia::render('pipeline/instances/show', [
            'instance'            => $pipelineInstance,
            'peutTraiter'         => $peutTraiter,
            'utilisateur_courant' => [
                'id'         => $user->id,
                'service_id' => $user->service_id,
                'role_id'    => $user->role_id,
            ],
            // Pour le formulaire de réassignation
            'utilisateurs' => Utilisateur::where('organisation_id', $orgId)
                ->where('statut', 'actif')
                ->select('id', 'nom', 'prenom')
                ->orderBy('nom')
                ->get(),
            'services' => Service::where('organisation_id', $orgId)
                ->where('actif', true)
                ->select('id', 'nom')
                ->get(),
            'roles' => Role::where('organisation_id', $orgId)
                ->select('id', 'nom')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pipeline_id' => 'required|exists:pipelines,id',
            'document_id' => 'required|exists:documents,id',
            'commentaire' => 'nullable|string',
        ]);

        $pipeline = Pipeline::findOrFail($validated['pipeline_id']);
        $document = Document::findOrFail($validated['document_id']);
        $user     = auth()->user();

        try {
            $this->pipelineService->initier($pipeline, $document, $user, $validated['commentaire'] ?? null);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Une erreur est survenue.';
            return redirect()->back()->with('error', $msg);
        }

        return redirect()->back()->with('success', 'Pipeline initié avec succès.');
    }

    public function valider(Request $request, PipelineInstance $pipelineInstance)
    {
        $validated = $request->validate([
            'commentaire' => 'nullable|string',
            'fichier'     => 'nullable|file|max:20480',
        ]);

        try {
            $this->pipelineService->valider(
                $pipelineInstance,
                auth()->user(),
                $validated['commentaire'] ?? null,
                $request->file('fichier'),
            );
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Une erreur est survenue.';
            return redirect()->back()->with('error', $msg);
        }

        return redirect()->back()->with('success', 'Étape validée avec succès.');
    }

    public function rejeter(Request $request, PipelineInstance $pipelineInstance)
    {
        $validated = $request->validate([
            'motif'              => 'required|string|min:10',
            'etape_retour_id'    => 'nullable|exists:pipeline_etapes,id',
        ]);

        try {
            $this->pipelineService->rejeter(
                $pipelineInstance,
                auth()->user(),
                $validated['motif'],
                $validated['etape_retour_id'] ?? null,
            );
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Une erreur est survenue.';
            return redirect()->back()->with('error', $msg);
        }

        return redirect()->back()->with('success', 'Étape rejetée.');
    }

    public function demanderCorrection(Request $request, PipelineInstance $pipelineInstance)
    {
        $validated = $request->validate([
            'commentaire' => 'required|string|min:5',
        ]);

        try {
            $this->pipelineService->demanderCorrection($pipelineInstance, auth()->user(), $validated['commentaire']);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Une erreur est survenue.';
            return redirect()->back()->with('error', $msg);
        }

        return redirect()->back()->with('success', 'Demande de correction envoyée.');
    }

    public function reassigner(Request $request, PipelineEtapeInstance $etapeInstance)
    {
        $validated = $request->validate([
            'type_acteur' => 'required|in:utilisateur,service,role',
            'acteur_id'   => 'required|uuid',
        ]);

        if (!in_array($etapeInstance->statut, ['en_attente', 'en_cours', 'retour_modification'])) {
            return redirect()->back()->with('error', 'Impossible de réassigner une étape déjà traitée.');
        }

        $etapeInstance->update([
            'acteur_type_override' => $validated['type_acteur'],
            'acteur_id_override'   => $validated['acteur_id'],
        ]);

        return redirect()->back()->with('success', 'Étape réassignée avec succès.');
    }

    public function annoter(Request $request, PipelineEtapeInstance $etapeInstance)
    {
        $validated = $request->validate([
            'texte'   => 'required|string',
            'fichier' => 'nullable|file|max:20480', // 20MB max
        ]);

        try {
            $this->pipelineService->annoter(
                $etapeInstance,
                auth()->user(),
                $validated['texte'],
                $request->file('fichier'),
            );
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Une erreur est survenue.';
            return redirect()->back()->with('error', $msg);
        }

        return redirect()->back()->with('success', 'Annotation ajoutée.');
    }
}
