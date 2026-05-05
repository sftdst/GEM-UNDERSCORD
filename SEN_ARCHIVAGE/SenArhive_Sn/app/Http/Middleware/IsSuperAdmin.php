<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifier si un SuperAdmin est authentifié
        if (!auth('superadmin')->check()) {
            return redirect()->route('login')->with('error', 'Accès superadmin requis');
        }

        // Vérifier que le SuperAdmin est actif
        $superAdmin = auth('superadmin')->user();
        if ($superAdmin->statut !== 'actif') {
            auth('superadmin')->logout();
            return redirect()->route('login')->with('error', 'Compte superadmin désactivé');
        }

        return $next($request);
    }
}
