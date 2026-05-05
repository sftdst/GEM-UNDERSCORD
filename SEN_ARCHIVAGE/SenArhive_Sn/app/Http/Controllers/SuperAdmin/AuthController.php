<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Afficher le formulaire de connexion SuperAdmin
     */
    public function showLoginForm(Request $request)
    {
        return Inertia::render('superadmin/auth/login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Authentifier le SuperAdmin
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::guard('superadmin')->attempt(
            ['email' => $request->email, 'password' => $request->password],
            $request->boolean('remember')
        )) {
            return back()->withErrors([
                'email' => 'Ces identifiants ne correspondent à aucun compte SuperAdmin.',
            ])->onlyInput('email');
        }

        $superAdmin = Auth::guard('superadmin')->user();

        if ($superAdmin->statut !== 'actif') {
            Auth::guard('superadmin')->logout();
            return back()->withErrors([
                'email' => 'Ce compte SuperAdmin est désactivé.',
            ])->onlyInput('email');
        }

        // Mise à jour de la dernière connexion
        $superAdmin->update(['derniere_connexion' => now()]);

        $request->session()->regenerate();

        return Inertia::location(route('superadmin.dashboard'));
    }

    /**
     * Déconnexion SuperAdmin
     */
    public function logout(Request $request)
    {
        auth('superadmin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('superadmin.login');
    }
}
