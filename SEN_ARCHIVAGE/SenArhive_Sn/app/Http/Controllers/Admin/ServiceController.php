<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\Service;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $services = Service::where('organisation_id', $orgId)
            ->with(['departement', 'responsable'])
            ->withCount(['utilisateurs', 'documents'])
            ->orderBy('nom')
            ->get();

        $departements = Departement::where('organisation_id', $orgId)
            ->where('actif', true)
            ->orderBy('nom')
            ->get();

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->select('id', 'nom', 'prenom')
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/services/index', [
            'services' => $services,
            'departements' => $departements,
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'departement_id' => 'required|exists:departements,id',
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'nullable|string|max:20',
            'responsable_id' => 'nullable|exists:utilisateurs,id',
        ]);

        Service::create([
            ...$validated,
            'organisation_id' => auth()->user()->organisation_id,
        ]);

        return redirect()->back()->with('success', 'Service cree avec succes.');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'departement_id' => 'sometimes|required|exists:departements,id',
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'nullable|string|max:20',
            'responsable_id' => 'nullable|exists:utilisateurs,id',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Service mis a jour.');
    }

    public function destroy(Service $service)
    {
        $service->delete();

        return redirect()->back()->with('success', 'Service supprime.');
    }
}
