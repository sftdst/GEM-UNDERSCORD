<?php

namespace Database\Seeders;

use App\Models\Fonctionnalite;
use Illuminate\Database\Seeder;

class FonctionnaliteSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            // Gestion documentaire
            ['code' => 'upload',           'nom' => 'Upload de documents',        'categorie' => 'documents',      'ordre' => 1],
            ['code' => 'versioning',       'nom' => 'Versioning de documents',    'categorie' => 'documents',      'ordre' => 2],
            ['code' => 'bulk_upload',      'nom' => 'Téléchargement en masse',    'categorie' => 'documents',      'ordre' => 3],
            ['code' => 'partage',          'nom' => 'Partage de documents',       'categorie' => 'documents',      'ordre' => 4],
            ['code' => 'export',           'nom' => 'Export de données',          'categorie' => 'documents',      'ordre' => 5],

            // Traitement & Conversion
            ['code' => 'ocr',                  'nom' => 'Reconnaissance optique (OCR)', 'categorie' => 'traitement', 'ordre' => 1],
            ['code' => 'scan',                 'nom' => 'Numérisation intégrée',        'categorie' => 'traitement', 'ordre' => 2],
            ['code' => 'signature_electronique','nom' => 'Signature électronique',      'categorie' => 'traitement', 'ordre' => 3],

            // Collaboration
            ['code' => 'workflow',      'nom' => "Workflow d'approbation",     'categorie' => 'collaboration', 'ordre' => 1],
            ['code' => 'commentaires',  'nom' => 'Commentaires et annotations','categorie' => 'collaboration', 'ordre' => 2],
            ['code' => 'notifications', 'nom' => 'Notifications email',        'categorie' => 'collaboration', 'ordre' => 3],

            // Sécurité & Conformité
            ['code' => 'audit',        'nom' => "Journal d'audit",           'categorie' => 'securite', 'ordre' => 1],
            ['code' => 'deux_facteurs','nom' => 'Authentification 2FA',      'categorie' => 'securite', 'ordre' => 2],
            ['code' => 'recherche',    'nom' => 'Recherche avancée',         'categorie' => 'securite', 'ordre' => 3],
            ['code' => 'chiffrement',  'nom' => 'Chiffrement des données',   'categorie' => 'securite', 'ordre' => 4],

            // Intégrations & Support
            ['code' => 'api',                'nom' => 'Accès API',          'categorie' => 'integration', 'ordre' => 1],
            ['code' => 'support_prioritaire','nom' => 'Support prioritaire', 'categorie' => 'integration', 'ordre' => 2],
            ['code' => 'sauvegarde',         'nom' => 'Sauvegarde automatique','categorie' => 'integration', 'ordre' => 3],

            // Intelligence Artificielle
            ['code' => 'ia',              'nom' => 'Intelligence artificielle',  'categorie' => 'ia', 'ordre' => 1],
            ['code' => 'recherche_ia',    'nom' => 'Recherche sémantique IA',    'categorie' => 'ia', 'ordre' => 2],
        ];

        foreach ($features as $feature) {
            Fonctionnalite::firstOrCreate(
                ['code' => $feature['code']],
                array_merge($feature, ['actif' => true])
            );
        }
    }
}
