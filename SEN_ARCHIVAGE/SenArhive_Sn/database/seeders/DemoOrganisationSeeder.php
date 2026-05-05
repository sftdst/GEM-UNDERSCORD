<?php

namespace Database\Seeders;

use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\Espace;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Tag;
use App\Models\Utilisateur;
use App\Models\Workflow;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoOrganisationSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::where('nom', 'premium')->first();
        if (!$plan) {
            $this->command->warn('Veuillez d\'abord exécuter PlansSeeder.');
            return;
        }

        if (Organisation::where('slug', 'entreprise-demo')->exists()) {
            $this->command->info('Organisation démo existe déjà, seeder ignoré.');
            return;
        }

        // Organisation démo
        $org = Organisation::create([
            'id' => (string) Str::uuid(),
            'plan_id' => $plan->id,
            'nom' => 'Entreprise Démo SA',
            'slug' => 'entreprise-demo',
            'pays' => 'SN',
            'langue_defaut' => 'fr',
            'timezone' => 'Africa/Dakar',
            'statut' => 'actif',
            'stockage_utilise_mo' => 0,
        ]);

        // Rôles
        $adminRole = Role::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Administrateur',
            'est_systeme' => true,
            'permissions' => [
                'documents.lire' => true,
                'documents.ecrire' => true,
                'documents.supprimer' => true,
                'documents.partager' => true,
                'dossiers.creer' => true,
                'dossiers.supprimer' => true,
                'workflows.gerer' => true,
                'admin.utilisateurs' => true,
                'admin.roles' => true,
                'admin.facturation' => true,
            ],
        ]);

        $editeurRole = Role::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Éditeur',
            'est_systeme' => false,
            'permissions' => [
                'documents.lire' => true,
                'documents.ecrire' => true,
                'documents.partager' => true,
                'dossiers.creer' => true,
            ],
        ]);

        $lecteurRole = Role::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Lecteur',
            'est_systeme' => false,
            'permissions' => [
                'documents.lire' => true,
            ],
        ]);

        // Utilisateurs
        $admin = Utilisateur::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'role_id' => $adminRole->id,
            'nom' => 'Diallo',
            'prenom' => 'Mamadou',
            'email' => 'admin@demo.sn',
            'mot_de_passe_hash' => Hash::make('password'),
            'statut' => 'actif',
            'langue' => 'fr',
            'email_verifie' => true,
        ]);

        $editeur = Utilisateur::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'role_id' => $editeurRole->id,
            'nom' => 'Ndiaye',
            'prenom' => 'Fatou',
            'email' => 'editeur@demo.sn',
            'mot_de_passe_hash' => Hash::make('password'),
            'statut' => 'actif',
            'langue' => 'fr',
            'email_verifie' => true,
        ]);

        $lecteur = Utilisateur::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'role_id' => $lecteurRole->id,
            'nom' => 'Sow',
            'prenom' => 'Ibrahima',
            'email' => 'lecteur@demo.sn',
            'mot_de_passe_hash' => Hash::make('password'),
            'statut' => 'actif',
            'langue' => 'fr',
            'email_verifie' => true,
        ]);

        // Espaces
        $espaceRH = Espace::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Ressources Humaines',
            'description' => 'Documents RH et paie',
            'couleur' => '#ff7631',
            'created_by' => $admin->id,
        ]);

        $espaceCompta = Espace::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Comptabilité',
            'description' => 'Factures et documents comptables',
            'couleur' => '#002f59',
            'created_by' => $admin->id,
        ]);

        $espaceJuridique = Espace::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Juridique',
            'description' => 'Contrats et documents juridiques',
            'couleur' => '#10b981',
            'created_by' => $admin->id,
        ]);

        // Dossiers
        $dossierContrats = Dossier::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'espace_id' => $espaceRH->id,
            'nom' => 'Contrats de travail',
            'chemin' => '/contrats-de-travail',
            'niveau' => 0,
            'created_by' => $admin->id,
        ]);

        Dossier::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'espace_id' => $espaceRH->id,
            'nom' => 'Fiches de paie',
            'chemin' => '/fiches-de-paie',
            'niveau' => 0,
            'created_by' => $admin->id,
        ]);

        Dossier::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'espace_id' => $espaceRH->id,
            'parent_id' => $dossierContrats->id,
            'nom' => 'CDI',
            'chemin' => '/contrats-de-travail/cdi',
            'niveau' => 1,
            'created_by' => $admin->id,
        ]);

        Dossier::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'espace_id' => $espaceCompta->id,
            'nom' => 'Factures 2026',
            'chemin' => '/factures-2026',
            'niveau' => 0,
            'created_by' => $admin->id,
        ]);

        Dossier::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'espace_id' => $espaceJuridique->id,
            'nom' => 'Contrats fournisseurs',
            'chemin' => '/contrats-fournisseurs',
            'niveau' => 0,
            'created_by' => $admin->id,
        ]);

        // Tags
        foreach (['Urgent', 'Confidentiel', 'À signer', 'Archivé', 'Important'] as $tagNom) {
            Tag::create([
                'id' => (string) Str::uuid(),
                'organisation_id' => $org->id,
                'nom' => $tagNom,
            ]);
        }

        // Catégories
        $catAdmin = Categorie::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Administratif',
        ]);

        Categorie::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Courrier',
            'parent_id' => $catAdmin->id,
        ]);

        Categorie::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Financier',
        ]);

        Categorie::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Technique',
        ]);

        // Workflow d'approbation
        Workflow::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Approbation contrat',
            'description' => 'Workflow de validation des contrats',
            'etapes' => [
                ['ordre' => 1, 'nom' => 'Vérification RH', 'type' => 'approbation'],
                ['ordre' => 2, 'nom' => 'Validation juridique', 'type' => 'approbation'],
                ['ordre' => 3, 'nom' => 'Signature direction', 'type' => 'approbation'],
            ],
            'actif' => true,
            'created_by' => $admin->id,
        ]);

        Workflow::create([
            'id' => (string) Str::uuid(),
            'organisation_id' => $org->id,
            'nom' => 'Validation facture',
            'description' => 'Workflow de validation des factures fournisseurs',
            'etapes' => [
                ['ordre' => 1, 'nom' => 'Contrôle comptable', 'type' => 'approbation'],
                ['ordre' => 2, 'nom' => 'Bon à payer', 'type' => 'approbation'],
            ],
            'actif' => true,
            'created_by' => $admin->id,
        ]);

        $this->command->info('Organisation démo créée avec succès !');
        $this->command->info('  Admin : admin@demo.sn / password');
        $this->command->info('  Éditeur : editeur@demo.sn / password');
        $this->command->info('  Lecteur : lecteur@demo.sn / password');
    }
}
