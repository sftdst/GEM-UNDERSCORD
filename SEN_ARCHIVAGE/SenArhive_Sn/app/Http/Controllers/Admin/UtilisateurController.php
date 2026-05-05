<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SendAccessCredentials;
use App\Models\Abonnement;
use App\Models\Role;
use App\Models\Service;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UtilisateurController extends Controller
{
    public function index()
    {
        $orgId = auth()->user()->organisation_id;

        $utilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->with(['role', 'service.departement'])
            ->latest()
            ->get();

        $roles = Role::where('organisation_id', $orgId)->get();

        $services = Service::where('organisation_id', $orgId)
            ->with('departement')
            ->where('actif', true)
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/utilisateurs/index', [
            'utilisateurs' => $utilisateurs,
            'roles' => $roles,
            'services' => $services,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'        => 'required|string|max:255',
            'prenom'     => 'required|string|max:255',
            'email'      => 'required|email|unique:utilisateurs,email',
            'role_id'    => 'required|exists:roles,id',
            'service_id' => 'nullable|exists:services,id',
            'photo'      => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Vérifier la limite d'utilisateurs du plan actif
        $orgId = auth()->user()->organisation_id;
        $abonnement = Abonnement::where('statut', 'actif')
            ->with('plan')
            ->latest('date_debut')
            ->first();

        if ($abonnement && $abonnement->plan && $abonnement->plan->users_max !== null) {
            $nbActuels = Utilisateur::where('organisation_id', $orgId)
                ->where('statut', 'actif')
                ->count();

            if ($nbActuels >= $abonnement->plan->users_max) {
                return redirect()->back()
                    ->withErrors(['email' => "Limite d'utilisateurs atteinte ({$nbActuels}/{$abonnement->plan->users_max} selon le plan \"{$abonnement->plan->nom}\"). Passez à un plan supérieur."])
                    ->withInput();
            }
        }

        // Générer un mot de passe temporaire aléatoire
        $temporaryPassword = Str::random(12);

        $avatarUrl = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('avatars', 'public');
            $avatarUrl = Storage::url($path);
        }

        $utilisateur = Utilisateur::create([
            'organisation_id'  => auth()->user()->organisation_id,
            'nom'              => $validated['nom'],
            'prenom'           => $validated['prenom'],
            'email'            => $validated['email'],
            'role_id'          => $validated['role_id'],
            'service_id'       => $validated['service_id'] ?? null,
            'mot_de_passe_hash' => Hash::make($temporaryPassword),
            'statut'           => 'actif',
            'email_verifie'    => false,
            'avatar_url'       => $avatarUrl,
        ]);

        // Envoyer l'email avec les accès
        $loginUrl = url('/login');
        Mail::to($utilisateur->email)->send(
            new SendAccessCredentials($utilisateur, $temporaryPassword, $loginUrl)
        );

        return redirect()->back()->with('success', 'Utilisateur créé avec succès. Un email avec les accès a été envoyé.');
    }

    public function update(Request $request, Utilisateur $utilisateur)
    {
        $validated = $request->validate([
            'role_id'    => 'sometimes|exists:roles,id',
            'service_id' => 'nullable|exists:services,id',
            'statut'     => 'sometimes|in:actif,inactif,suspendu',
            'nom'        => 'sometimes|string|max:255',
            'prenom'     => 'sometimes|string|max:255',
            'photo'      => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            // Supprimer l'ancienne photo si elle existe
            if ($utilisateur->avatar_url) {
                $oldPath = str_replace('/storage/', '', $utilisateur->avatar_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('photo')->store('avatars', 'public');
            $validated['avatar_url'] = Storage::url($path);
        }

        unset($validated['photo']);
        $utilisateur->update($validated);

        return redirect()->back()->with('success', 'Utilisateur mis à jour.');
    }

    public function destroy(Utilisateur $utilisateur)
    {
        $utilisateur->update(['statut' => 'inactif']);

        return redirect()->back()->with('success', 'Utilisateur désactivé.');
    }
}
