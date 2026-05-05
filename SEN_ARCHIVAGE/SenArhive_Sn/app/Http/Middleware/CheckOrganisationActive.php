<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOrganisationActive
{
    /**
     * Bloque l'accès aux utilisateurs dont l'organisation est inactive (abonnement expiré > 30 j).
     * Ne s'applique qu'aux utilisateurs authentifiés possédant un organisation_id.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Laisser passer les pages de blocage elles-mêmes
        if ($request->routeIs('abonnement.expire') || $request->routeIs('validation.en_attente')) {
            return $next($request);
        }

        // Ne s'applique qu'aux utilisateurs authentifiés via le guard web (Utilisateur)
        if (!auth()->check()) {
            return $next($request);
        }

        $user = auth()->user();

        // Uniquement pour les utilisateurs appartenant à une organisation
        if (!$user->organisation_id) {
            return $next($request);
        }

        $organisation = $user->organisation;

        if ($organisation && $organisation->statut === 'en_attente') {
            return redirect()->route('validation.en_attente');
        }

        if ($organisation && in_array($organisation->statut, ['inactif', 'suspendu'])) {
            return redirect()->route('abonnement.expire');
        }

        return $next($request);
    }
}
