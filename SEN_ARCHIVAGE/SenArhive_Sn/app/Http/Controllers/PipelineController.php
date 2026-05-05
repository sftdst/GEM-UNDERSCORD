<?php

namespace App\Http\Controllers;

use App\Models\Pipeline;
use App\Models\Role;
use App\Models\Service;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PipelineController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $pipelines = Pipeline::with(['createur', 'etapes' => fn($q) => $q->orderBy('ordre')])
            ->withCount(['etapes', 'instances'])
            ->latest()
            ->get();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->select('id', 'nom', 'prenom', 'email')
            ->get();

        $services = Service::where('organisation_id', $orgId)
            ->where('actif', true)
            ->select('id', 'nom', 'code')
            ->get();

        $roles = Role::where('organisation_id', $orgId)
            ->select('id', 'nom')
            ->get();

        return Inertia::render('pipeline/index', [
            'pipelines'    => $pipelines,
            'utilisateurs' => $utilisateurs,
            'services'     => $services,
            'roles'        => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $orgId = auth()->user()->organisation_id;

        $validated = $request->validate([
            'nom'           => ['required', 'string', 'max:255',
                Rule::unique('pipelines', 'nom')->where('organisation_id', $orgId)],
            'description'   => 'nullable|string',
            'type_document' => 'nullable|string|max:100',
            'etapes'        => 'required|array|min:1',
            'etapes.*.nom'         => 'required|string|max:255',
            'etapes.*.description' => 'nullable|string',
            'etapes.*.type_acteur' => 'required|in:utilisateur,service,role',
            'etapes.*.acteur_id'   => 'required|uuid',
            'etapes.*.annotation_obligatoire' => 'boolean',
            'etapes.*.fichier_requis'         => 'boolean',
            'etapes.*.commentaire_requis'     => 'boolean',
            'etapes.*.signature_requise'      => 'boolean',
            'etapes.*.rejet_etape_retour_id'  => 'nullable|integer', // index dans le tableau
        ]);

        $pipeline = Pipeline::create([
            'organisation_id' => $orgId,
            'nom'             => $validated['nom'],
            'description'     => $validated['description'] ?? null,
            'type_document'   => $validated['type_document'] ?? null,
            'statut'          => 'actif',
            'created_by'      => auth()->id(),
        ]);

        foreach ($validated['etapes'] as $index => $etapeData) {
            $pipeline->etapes()->create([
                'ordre'                   => $index + 1,
                'nom'                     => $etapeData['nom'],
                'description'             => $etapeData['description'] ?? null,
                'type_acteur'             => $etapeData['type_acteur'],
                'acteur_id'               => $etapeData['acteur_id'],
                'annotation_obligatoire'  => $etapeData['annotation_obligatoire'] ?? false,
                'fichier_requis'          => $etapeData['fichier_requis'] ?? false,
                'commentaire_requis'      => $etapeData['commentaire_requis'] ?? false,
                'signature_requise'       => $etapeData['signature_requise'] ?? false,
                'rejet_etape_retour_id'   => null, // sera résolu après
            ]);
        }

        return redirect()->back()->with('success', 'Pipeline créé avec succès.');
    }

    public function update(Request $request, Pipeline $pipeline)
    {
        $validated = $request->validate([
            'nom'           => ['sometimes', 'required', 'string', 'max:255',
                Rule::unique('pipelines', 'nom')
                    ->where('organisation_id', auth()->user()->organisation_id)
                    ->ignore($pipeline->id)],
            'description'   => 'nullable|string',
            'type_document' => 'nullable|string|max:100',
            'statut'        => 'sometimes|in:actif,inactif',
            'etapes'        => 'sometimes|array|min:1',
            'etapes.*.nom'                   => 'required_with:etapes|string|max:255',
            'etapes.*.description'           => 'nullable|string',
            'etapes.*.type_acteur'           => 'required_with:etapes|in:utilisateur,service,role',
            'etapes.*.acteur_id'             => 'required_with:etapes|uuid',
            'etapes.*.annotation_obligatoire' => 'boolean',
            'etapes.*.fichier_requis'        => 'boolean',
            'etapes.*.commentaire_requis'    => 'boolean',
        ]);

        $pipeline->update(array_intersect_key($validated, array_flip(['nom', 'description', 'type_document', 'statut'])));

        if (isset($validated['etapes'])) {
            if ($pipeline->instances()->whereIn('statut', ['en_cours', 'en_attente'])->exists()) {
                return redirect()->back()->with('error', 'Impossible de modifier les étapes d\'un pipeline avec des instances actives.');
            }

            $pipeline->etapes()->delete();

            foreach ($validated['etapes'] as $index => $etapeData) {
                $pipeline->etapes()->create([
                    'ordre'                  => $index + 1,
                    'nom'                    => $etapeData['nom'],
                    'description'            => $etapeData['description'] ?? null,
                    'type_acteur'            => $etapeData['type_acteur'],
                    'acteur_id'              => $etapeData['acteur_id'],
                    'annotation_obligatoire' => $etapeData['annotation_obligatoire'] ?? false,
                    'fichier_requis'         => $etapeData['fichier_requis'] ?? false,
                    'commentaire_requis'     => $etapeData['commentaire_requis'] ?? false,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Pipeline mis à jour.');
    }

    public function destroy(Pipeline $pipeline)
    {
        if ($pipeline->instances()->whereIn('statut', ['en_cours', 'en_attente'])->exists()) {
            return redirect()->back()->with('error', 'Impossible de supprimer un pipeline avec des instances en cours.');
        }

        $pipeline->delete();

        return redirect()->back()->with('success', 'Pipeline supprimé.');
    }
}
