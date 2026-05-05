<?php

namespace App\Http\Controllers;

use App\Models\EtapeWorkflow;
use App\Models\InstanceWorkflow;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InstanceWorkflowController extends Controller
{
    public function index()
    {
        $instances = InstanceWorkflow::with(['document', 'workflow', 'initiateur'])
            ->whereHas('workflow', fn ($q) => $q->where('organisation_id', auth()->user()->organisation_id))
            ->where('statut', 'en_cours')
            ->latest()
            ->paginate(20);

        return Inertia::render('workflows/instances/index', [
            'instances' => $instances,
        ]);
    }

    public function show(InstanceWorkflow $instanceWorkflow)
    {
        $instanceWorkflow->load(['etapes.approbateur', 'document', 'workflow', 'initiateur']);

        return Inertia::render('workflows/instances/show', [
            'instance' => $instanceWorkflow,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'workflow_id' => 'required|exists:workflows,id',
            'document_id' => 'required|exists:documents,id',
            'commentaire' => 'nullable|string',
        ]);

        $workflow = Workflow::findOrFail($validated['workflow_id']);

        $instance = InstanceWorkflow::create([
            'workflow_id' => $validated['workflow_id'],
            'document_id' => $validated['document_id'],
            'statut' => 'en_cours',
            'etape_courante' => 1,
            'initie_par' => auth()->id(),
            'commentaire' => $validated['commentaire'] ?? null,
        ]);

        // Create etapes from workflow template
        foreach ($workflow->etapes as $index => $etape) {
            EtapeWorkflow::create([
                'instance_id' => $instance->id,
                'numero_etape' => $index + 1,
                'approbateur_id' => $etape['approbateur_id'],
                'statut' => $index === 0 ? 'en_attente' : 'en_attente',
            ]);
        }

        return redirect()->back()->with('success', 'Instance de workflow créée.');
    }

    public function approve(Request $request, InstanceWorkflow $instanceWorkflow)
    {
        $validated = $request->validate([
            'commentaire' => 'nullable|string',
        ]);

        $currentEtape = $instanceWorkflow->etapes()
            ->where('numero_etape', $instanceWorkflow->etape_courante)
            ->first();

        if ($currentEtape) {
            $currentEtape->update([
                'statut' => 'approuve',
                'commentaire' => $validated['commentaire'] ?? null,
                'traite_le' => now(),
            ]);
        }

        $nextEtape = $instanceWorkflow->etapes()
            ->where('numero_etape', $instanceWorkflow->etape_courante + 1)
            ->first();

        if ($nextEtape) {
            $instanceWorkflow->update([
                'etape_courante' => $instanceWorkflow->etape_courante + 1,
            ]);
        } else {
            $instanceWorkflow->update([
                'statut' => 'termine',
            ]);
        }

        return redirect()->back()->with('success', 'Étape approuvée.');
    }

    public function reject(Request $request, InstanceWorkflow $instanceWorkflow)
    {
        $validated = $request->validate([
            'commentaire' => 'nullable|string',
        ]);

        $currentEtape = $instanceWorkflow->etapes()
            ->where('numero_etape', $instanceWorkflow->etape_courante)
            ->first();

        if ($currentEtape) {
            $currentEtape->update([
                'statut' => 'rejete',
                'commentaire' => $validated['commentaire'] ?? null,
                'traite_le' => now(),
            ]);
        }

        $instanceWorkflow->update([
            'statut' => 'rejete',
        ]);

        return redirect()->back()->with('success', 'Workflow rejeté.');
    }
}
