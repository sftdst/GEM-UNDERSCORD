<?php

namespace Database\Seeders;

use App\Models\SuperAdmin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        SuperAdmin::firstOrCreate(
            ['email' => 'superadmin@senarchive.sn'],
            [
                'nom' => 'Admin',
                'prenom' => 'Super',
                'telephone' => '+221 77 000 00 00',
                'mot_de_passe_hash' => bcrypt('SuperAdmin@2025'),
                'statut' => 'actif',
                'email_verifie' => true,
            ]
        );

        $this->command->info('SuperAdmin créé/vérifié: superadmin@senarchive.sn / SuperAdmin@2025');
    }
}
