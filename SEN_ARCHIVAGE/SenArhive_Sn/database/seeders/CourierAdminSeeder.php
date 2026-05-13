<?php

namespace Database\Seeders;

use App\Models\Organisation;
use App\Models\Role;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CourierAdminSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organisation::first();
        if (!$org) {
            $this->command->error('No organisation found. Run db:seed first.');
            return;
        }

        $role = Role::where('nom', 'Administrateur')->where('organisation_id', $org->id)->first();
        if (!$role) {
            $this->command->error('No admin role found.');
            return;
        }

        $existing = Utilisateur::where('email', 'admin@gestioncourriers.sn')->first();
        if ($existing) {
            $this->command->info('Admin user already exists: admin@gestioncourriers.sn');
            return;
        }

        $admin = Utilisateur::create([
            'organisation_id' => $org->id,
            'role_id' => $role->id,
            'nom' => 'Admin',
            'prenom' => 'Gestion Courriers',
            'email' => 'admin@gestioncourriers.sn',
            'mot_de_passe_hash' => Hash::make('AdminGC2026!@#'),
            'service_id' => null,
            'statut' => 'actif',
            'email_verifie' => true,
        ]);

        $this->command->info('Admin created: ' . $admin->email);
        $this->command->info('Password: AdminGC2026!@#');
    }
}