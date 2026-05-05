<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            FonctionnaliteSeeder::class, // doit être en premier
            PlansSeeder::class,
            DemoOrganisationSeeder::class,
        ]);
    }
}
