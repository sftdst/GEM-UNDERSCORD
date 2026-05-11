<?php

namespace App\Http\Middleware;

use App\Models\DemandeChangementPlan;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        // Check if user is authenticated (regular user or superadmin)
        $user = $request->user() ?? $request->user('superadmin');

        // Eager load only relations that actually exist on the user model
        if ($user) {
            $toLoad = [];

            if (! $user->relationLoaded('organisation') && method_exists($user, 'organisation')) {
                $toLoad[] = 'organisation.plan.fonctionnalites';
            }

            if (! $user->relationLoaded('role') && method_exists($user, 'role')) {
                $toLoad[] = 'role';
            }

            if (method_exists($user, 'service')) {
                $toLoad[] = 'service.departement';
            }

            if (! empty($toLoad)) {
                $user->load($toLoad);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'nom' => $user->nom ?? $user->name,
                    'prenom' => $user->prenom ?? '',
                    'name' => $user->nom_complet ?? $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url ?? null,
                    'email_verified_at' => $user->email_verified_at,
                    'two_factor_enabled' => ! is_null($user->two_factor_confirmed_at ?? null),
                    'organisation_id' => $user->organisation_id ?? null,
                    'role_id' => $user->role_id ?? null,
                    'service_id' => $user->service_id ?? null,
                    'statut' => $user->statut ?? 'actif',
                    'langue' => $user->langue ?? 'fr',
                ] : null,
            ],
            'organisation' => $user?->organisation ? [
                'id' => $user->organisation->id,
                'nom' => $user->organisation->nom,
                'slug' => $user->organisation->slug,
                'logo_url' => $user->organisation->logo_url,
                'plan_id' => $user->organisation->plan_id,
                'statut' => $user->organisation->statut,
                'stockage_utilise_mo' => $user->organisation->stockage_utilise_mo,
                'plan_fonctionnalites' => app()->isLocal()
                    // En dev local : toutes les fonctionnalités disponibles (indépendant du plan)
                    ? [
                        'upload', 'versioning', 'bulk_upload', 'partage', 'export',
                        'ocr', 'scan', 'signature_electronique',
                        'workflow', 'commentaires', 'notifications',
                        'audit', 'deux_facteurs', 'recherche', 'chiffrement', 'sauvegarde',
                        'api', 'support_prioritaire',
                        'ia', 'recherche_ia',
                        'gmp',
                    ]
                    // En production : uniquement celles du plan souscrit
                    : collect($user->organisation->plan?->fonctionnalites ?? [])
                        ->where('actif', true)
                        ->pluck('code')
                        ->values()
                        ->toArray(),
            ] : null,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
            ],
            'permissions' => $user?->role?->permissions ?? [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'demandes_plan_count' => $request->user('superadmin')
                ? DemandeChangementPlan::where('statut', 'en_attente')->count()
                : 0,
        ];
    }
}
