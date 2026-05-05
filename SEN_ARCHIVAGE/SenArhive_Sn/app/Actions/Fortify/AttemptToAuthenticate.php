<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\LogoutResponse;

class AttemptToAuthenticate
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(StatefulGuard $guard, Request $request): mixed
    {
        // Essayer d'authentifier en tant que superadmin d'abord
        $credentials = [
            'email' => $request->input('email'),
            'password' => $request->input('password'),
        ];

        if (auth('superadmin')->attempt($credentials, $request->filled('remember'))) {
            $request->session()->regenerate();
            return null; // Continue le processus de Fortify
        }

        // Si l'authentification superadmin échoue, essayer avec le guard 'web' (utilisateur normal)
        if ($guard->attempt($credentials, $request->filled('remember'))) {
            $request->session()->regenerate();
            return null; // Continue le processus de Fortify
        }

        // L'authentification a échoué pour les deux guards
        throw ValidationException::withMessages([
            'email' => __('auth.failed'),
        ]);
    }
}
