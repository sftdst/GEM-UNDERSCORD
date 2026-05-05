<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanFeature
{
    /**
     * Bloque l'accès à une route si l'abonnement de l'organisation
     * ne comprend pas la fonctionnalité demandée.
     *
     * Usage : ->middleware('plan.feature:workflow')
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        // En environnement local, toutes les fonctionnalités sont accessibles
        if (app()->isLocal()) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user || ! $user->organisation) {
            return redirect()->route('dashboard')
                ->with('error', 'Accès refusé.');
        }

        if (! $user->organisation->hasFonctionnalite($feature)) {
            if ($request->header('X-Inertia')) {
                return redirect()->route('dashboard')
                    ->with('error', 'Votre abonnement ne permet pas d\'accéder à cette fonctionnalité.');
            }

            abort(403, 'Votre abonnement ne permet pas d\'accéder à cette fonctionnalité.');
        }

        return $next($request);
    }
}
