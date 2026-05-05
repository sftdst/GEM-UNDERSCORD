<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\SendAccessCredentials;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\Utilisateur;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganisationController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
    ) {}

    /**
     * Liste toutes les organisations
     */
    public function index(Request $request)
    {
        $query = Organisation::with('plan', 'utilisateurs');

        // Filtrer par statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        // Recherche par nom ou domaine
        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($q_builder) use ($q) {
                $q_builder->where('nom', 'like', "%{$q}%")
                          ->orWhere('domaine', 'like', "%{$q}%")
                          ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        $organisations = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('superadmin/organisations/index', [
            'organisations' => $organisations,
            'filters' => $request->only('q', 'statut'),
        ]);
    }

    /**
     * Affiche le formulaire de création
     */
    public function create()
    {
        $plans = Plan::where('actif', true)->select('id', 'nom', 'prix_mensuel')->get();

        return Inertia::render('superadmin/organisations/create', [
            'plans' => $plans,
        ]);
    }

    /**
     * Crée une nouvelle organisation
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'slug' => 'required|string|unique:organisations,slug|regex:/^[a-z0-9\-]+$/',
            'domaine' => 'nullable|string|max:255|unique:organisations,domaine',
            'plan_id' => 'required|exists:plans,id',
            'pays' => 'required|string|max:2',
            'langue_defaut' => 'required|string|max:5',
            'admin_email' => 'required|email|unique:utilisateurs,email',
            'admin_nom' => 'required|string|max:255',
            'admin_prenom' => 'required|string|max:255',
        ]);

        $organisation = Organisation::create([
            'plan_id' => $validated['plan_id'],
            'nom' => $validated['nom'],
            'slug' => $validated['slug'],
            'domaine' => $validated['domaine'],
            'pays' => $validated['pays'],
            'langue_defaut' => $validated['langue_defaut'],
            'timezone' => 'Africa/Dakar',
            'statut' => 'actif',
        ]);

        // Créer l'utilisateur admin de l'organisation
        $role = $organisation->roles()->create([
            'nom' => 'Administrator',
            'description' => 'Administrateur de l\'organisation',
            'permissions' => json_encode(['*']),
        ]);

        $password = Str::random(12);
        
        $admin = $organisation->utilisateurs()->create([
            'email' => $validated['admin_email'],
            'nom' => $validated['admin_nom'],
            'prenom' => $validated['admin_prenom'],
            'role_id' => $role->id,
            'mot_de_passe_hash' => bcrypt($password),
            'statut' => 'actif',
            'email_verifie' => true,
        ]);

        // Envoyer les identifiants par email à l'administrateur
        try {
            Mail::to($admin->email)->send(
                new SendAccessCredentials($admin, $password, url('/login'), $organisation->nom)
            );
            $mailInfo = "Un email avec les identifiants a été envoyé à {$admin->email}.";
        } catch (\Exception $e) {
            $mailInfo = "Email non envoyé (erreur SMTP). Mot de passe temporaire : {$password}";
        }

        // Enregistrer dans les logs
        $this->auditService->log('org_create', $organisation, null, [
            'admin_email' => $admin->email,
            'plan_id' => $validated['plan_id'],
        ]);

        return redirect()->route('superadmin.organisations.show', $organisation)
                       ->with('success', "Organisation \"{$organisation->nom}\" créée avec succès. {$mailInfo}");
    }

    /**
     * Affiche les détails d'une organisation
     */
    public function show(Organisation $organisation)
    {
        $organisation->load(['plan', 'utilisateurs', 'abonnements', 'espaces', 'documents']);

        return Inertia::render('superadmin/organisations/show', [
            'organisation' => $organisation,
            'stats' => [
                'utilisateurs' => $organisation->utilisateurs->count(),
                'documents' => $organisation->documents->count(),
                'espaces' => $organisation->espaces->count(),
                'stockage_utilise' => $organisation->stockage_utilise_mo,
            ],
        ]);
    }

    /**
     * Affiche le formulaire d'édition
     */
    public function edit(Organisation $organisation)
    {
        $plans = Plan::where('actif', true)->select('id', 'nom', 'prix_mensuel')->get();

        return Inertia::render('superadmin/organisations/edit', [
            'organisation' => $organisation,
            'plans' => $plans,
        ]);
    }

    /**
     * Met à jour une organisation
     */
    public function update(Request $request, Organisation $organisation)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'plan_id' => 'required|exists:plans,id',
            'statut' => 'required|in:actif,inactif,suspendu',
            'langue_defaut' => 'required|string|max:5',
        ]);

        $organisation->update($validated);

        $this->auditService->log('org_update', $organisation);

        return redirect()->route('superadmin.organisations.show', $organisation)
                       ->with('success', 'Organisation mise à jour avec succès');
    }

    /**
     * Suspend une organisation
     */
    public function suspend(Organisation $organisation)
    {
        $organisation->update(['statut' => 'suspendu']);
        $this->auditService->log('org_suspend', $organisation);

        return redirect()->back()->with('success', 'Organisation suspendue');
    }

    /**
     * Réactive une organisation
     */
    public function activate(Organisation $organisation)
    {
        $organisation->update(['statut' => 'actif']);
        $this->auditService->log('org_activate', $organisation);

        return redirect()->back()->with('success', 'Organisation réactivée');
    }

    /**
     * Supprime une organisation
     */
    public function destroy(Organisation $organisation)
    {
        // Soft delete - déléguer la vraie suppression à une commande artisan ou webhook
        $organisation->delete();
        $this->auditService->log('org_delete', $organisation);

        return redirect()->route('superadmin.organisations.index')
                       ->with('success', 'Organisation supprimée');
    }
}
