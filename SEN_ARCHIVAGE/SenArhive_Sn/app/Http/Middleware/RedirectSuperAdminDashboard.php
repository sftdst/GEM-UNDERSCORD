<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectSuperAdminDashboard
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifier si un superadmin vient de se connecter et qu'on n'est pas déjà sur une page de redirection
        // Faire la vérification avant d'appeler le reste du pipeline pour éviter des boucles de redirection
        if (session()->has('just_logged_in_as_superadmin') && auth('superadmin')->check()) {
            // On enlève le flag (pull) et on redirige uniquement si on n'est pas déjà sur le dashboard ou la page de login
            $was = session()->pull('just_logged_in_as_superadmin');
            $path = $request->path();

            // Exclure les routes de login et la route du dashboard pour éviter les boucles
            if ($was && !str_contains($path, 'login') && !str_contains($path, 'superadmin')) {
                return redirect()->route('superadmin.dashboard');
            }
        }

        return $next($request);
    }
}   
