<?php

namespace Database\Seeders;

use App\Models\Fonctionnalite;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    /**
     * Fonctionnalités incluses par plan.
     * Chaque niveau hérite du précédent + ajoute les siennes.
     */
    private array $featuresByPlan = [
        'gratuit' => [
            'upload',
            'notifications',
        ],
        'standard' => [
            'upload', 'versioning', 'bulk_upload', 'partage',
            'scan', 'commentaires', 'notifications',
            'audit', 'deux_facteurs', 'recherche', 'sauvegarde',
        ],
        'premium' => [
            'upload', 'versioning', 'bulk_upload', 'partage', 'export',
            'ocr', 'scan', 'signature_electronique',
            'workflow', 'commentaires', 'notifications',
            'audit', 'deux_facteurs', 'recherche', 'chiffrement', 'sauvegarde',
            'api', 'support_prioritaire',
            'ia', 'recherche_ia',
            'gmp',
        ],
        'entreprise' => [
            // Toutes les fonctionnalités
            'upload', 'versioning', 'bulk_upload', 'partage', 'export',
            'ocr', 'scan', 'signature_electronique',
            'workflow', 'commentaires', 'notifications',
            'audit', 'deux_facteurs', 'recherche', 'chiffrement', 'sauvegarde',
            'api', 'support_prioritaire',
            'ia', 'recherche_ia',
            'gmp',
        ],
    ];

    public function run(): void
    {
        $plans = [
            [
                'nom'             => 'gratuit',
                'description'     => 'Plan gratuit pour découvrir la plateforme. Idéal pour les indépendants.',
                'prix_mensuel'    => 0,
                'prix_annuel'     => 0,
                'stockage_max_go' => 1,
                'users_max'       => 3,
                'documents_max'   => 100,
                'avantages'       => json_encode([]),
                'actif'           => true,
            ],
            [
                'nom'             => 'standard',
                'description'     => 'Pour les petites équipes. Archivage, partage et traçabilité inclus.',
                'prix_mensuel'    => 9900,
                'prix_annuel'     => 99000,
                'stockage_max_go' => 50,
                'users_max'       => 10,
                'documents_max'   => 5000,
                'avantages'       => json_encode([]),
                'actif'           => true,
            ],
            [
                'nom'             => 'premium',
                'description'     => 'Pour les PME. OCR, workflows, signature électronique et IA inclus.',
                'prix_mensuel'    => 29900,
                'prix_annuel'     => 299000,
                'stockage_max_go' => 200,
                'users_max'       => 50,
                'documents_max'   => null,
                'avantages'       => json_encode([]),
                'actif'           => true,
            ],
            [
                'nom'             => 'entreprise',
                'description'     => 'Pour les grandes structures. Toutes les fonctionnalités, utilisateurs et stockage illimités.',
                'prix_mensuel'    => 79900,
                'prix_annuel'     => 799000,
                'stockage_max_go' => 1000,
                'users_max'       => null,
                'documents_max'   => null,
                'avantages'       => json_encode([]),
                'actif'           => true,
            ],
        ];

        foreach ($plans as $data) {
            $plan = Plan::firstOrCreate(
                ['nom' => $data['nom']],
                $data
            );

            // Synchroniser les fonctionnalités du plan
            $codes = $this->featuresByPlan[$data['nom']] ?? [];

            if (! empty($codes)) {
                $ids = Fonctionnalite::whereIn('code', $codes)
                    ->where('actif', true)
                    ->pluck('id')
                    ->toArray();

                $plan->fonctionnalites()->sync($ids);
            }

            $this->command->info(
                "Plan [{$plan->nom}] — " . count($codes) . ' fonctionnalité(s) assignée(s).'
            );
        }
    }
}
