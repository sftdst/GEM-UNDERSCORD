<?php

namespace Database\Seeders;

use App\Models\CourrierStatut;
use App\Models\CourrierType;
use App\Models\Organisation;
use Illuminate\Database\Seeder;

class CourrierSeeder extends Seeder
{
    public function run(): void
    {
        $orgId = Organisation::first()?->id;
        if (!$orgId) {
            $this->command->error('No organisation found. Run db:seed first.');
            return;
        }

        // Types de courriers
        $types = [
            ['nom' => 'Lettre', 'code' => 'LETTRE', 'couleur' => '#3b82f6', 'icone' => 'file-text', 'organisation_id' => $orgId],
            ['nom' => 'Recommandé', 'code' => 'RECOMMANDE', 'couleur' => '#f59e0b', 'icone' => 'mail', 'organisation_id' => $orgId],
            ['nom' => 'Colis', 'code' => 'COLIS', 'couleur' => '#8b5cf6', 'icone' => 'package', 'organisation_id' => $orgId],
            ['nom' => 'Email', 'code' => 'EMAIL', 'couleur' => '#10b981', 'icone' => 'mail', 'organisation_id' => $orgId],
            ['nom' => 'Fax', 'code' => 'FAX', 'couleur' => '#6366f1', 'icone' => 'printer', 'organisation_id' => $orgId],
            ['nom' => 'Notification', 'code' => 'NOTIFICATION', 'couleur' => '#ef4444', 'icone' => 'alert-circle', 'organisation_id' => $orgId],
            ['nom' => 'Divers', 'code' => 'DIVERS', 'couleur' => '#6b7280', 'icone' => 'file', 'organisation_id' => $orgId],
        ];

        foreach ($types as $t) {
            CourrierType::firstOrCreate(['code' => $t['code']], $t);
        }

        $this->command?->info(count($types) . ' types de courriers créés.');

        // Statuts de courriers (pour les entrants et sortants)
        $statuts = [
            ['nom' => 'Reçu', 'code' => 'RECU', 'couleur' => '#6366f1', 'ordre' => 1, 'organisation_id' => $orgId],
            ['nom' => 'Non attribué', 'code' => 'NON_ATTRIBUE', 'couleur' => '#f59e0b', 'ordre' => 2, 'organisation_id' => $orgId],
            ['nom' => 'Affecté', 'code' => 'AFFECTE', 'couleur' => '#f59e0b', 'ordre' => 3, 'organisation_id' => $orgId],
            ['nom' => 'En cours', 'code' => 'EN_COURS', 'couleur' => '#3b82f6', 'ordre' => 4, 'organisation_id' => $orgId],
            ['nom' => 'En attente', 'code' => 'EN_ATTENTE', 'couleur' => '#8b5cf6', 'ordre' => 5, 'organisation_id' => $orgId],
            ['nom' => 'Traité', 'code' => 'TRAITE', 'couleur' => '#10b981', 'ordre' => 6, 'organisation_id' => $orgId],
            ['nom' => 'Clôturé', 'code' => 'CLOTURE', 'couleur' => '#6b7280', 'ordre' => 7, 'organisation_id' => $orgId],
            ['nom' => 'Envoyé', 'code' => 'ENVOYE', 'couleur' => '#10b981', 'ordre' => 10, 'organisation_id' => $orgId],
            ['nom' => 'Annulé', 'code' => 'ANNULE', 'couleur' => '#ef4444', 'ordre' => 99, 'organisation_id' => $orgId],
        ];

        foreach ($statuts as $s) {
            CourrierStatut::firstOrCreate(['code' => $s['code']], $s);
        }

        $this->command?->info(count($statuts) . ' statuts de courriers créés.');
    }
}