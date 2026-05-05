<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\DemandeEssai;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Illuminate\Validation\Rule;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): Utilisateur
    {
        Validator::make($input, [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'organisation_nom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:utilisateurs'],
            'password' => $this->passwordRules(),
            'secteur_activite' => ['nullable', 'string', 'max:150'],
            'nb_utilisateurs_prevu' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'message' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $planGratuit = Plan::where('nom', 'gratuit')->first();

            // L'organisation est créée en attente de validation superadmin
            $organisation = Organisation::create([
                'plan_id' => $planGratuit->id,
                'nom' => $input['organisation_nom'],
                'slug' => Str::slug($input['organisation_nom']) . '-' . Str::random(4),
                'statut' => 'en_attente',
                'date_essai_fin' => now()->addDays(14),
            ]);

            $roleAdmin = Role::create([
                'organisation_id' => $organisation->id,
                'nom' => 'Administrateur',
                'description' => 'Administrateur de l\'organisation',
                'permissions' => [
                    'doc_create' => true, 'doc_read' => true, 'doc_update' => true,
                    'doc_delete' => true, 'doc_share' => true, 'doc_download' => true,
                    'user_manage' => true, 'role_manage' => true, 'org_manage' => true,
                    'billing_manage' => true, 'workflow_manage' => true,
                ],
                'est_systeme' => true,
            ]);

            $utilisateur = Utilisateur::create([
                'organisation_id' => $organisation->id,
                'role_id' => $roleAdmin->id,
                'email' => $input['email'],
                'nom' => $input['nom'],
                'prenom' => $input['prenom'],
                'mot_de_passe_hash' => bcrypt($input['password']),
                'statut' => 'en_attente',
                'email_verifie' => false,
            ]);

            // Créer la demande d'essai pour le superadmin
            DemandeEssai::create([
                'organisation_id'      => $organisation->id,
                'utilisateur_id'       => $utilisateur->id,
                'statut'               => 'en_attente',
                'secteur_activite'     => $input['secteur_activite'] ?? null,
                'nb_utilisateurs_prevu'=> $input['nb_utilisateurs_prevu'] ?? null,
                'message'              => $input['message'] ?? null,
            ]);

            return $utilisateur;
        });
    }
}
