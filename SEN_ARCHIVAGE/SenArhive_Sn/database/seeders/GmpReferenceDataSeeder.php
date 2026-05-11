<?php

namespace Database\Seeders;

use App\Models\Gmp\GmpModePassation;
use App\Models\Gmp\GmpParametreIa;
use App\Models\Gmp\GmpSecteurIntervention;
use App\Models\Gmp\GmpSeuilReglementaire;
use App\Models\Gmp\GmpSourceFinancement;
use App\Models\Gmp\GmpTypeMarche;
use App\Models\Organisation;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GmpReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $organisations = Organisation::where('statut', 'actif')->get();

        if ($organisations->isEmpty()) {
            $this->command->warn('Aucune organisation active. Exécutez DemoOrganisationSeeder d\'abord.');
            return;
        }

        foreach ($organisations as $org) {
            $this->seedForOrganisation($org->id);
        }

        $this->command->info('Données de référence GMP créées pour ' . $organisations->count() . ' organisation(s).');
    }

    private function seedForOrganisation(string $orgId): void
    {
        $this->seedTypesMarche($orgId);
        $this->seedModesPassation($orgId);
        $this->seedSourcesFinancement($orgId);
        $this->seedSecteursIntervention($orgId);
        $this->seedSeuilsArmp($orgId);
        $this->seedParametresIa($orgId);
        $this->seedRolesGmp($orgId);
    }

    private function seedTypesMarche(string $orgId): void
    {
        $types = [
            ['code' => 'TRAVAUX',     'libelle' => 'Travaux',                      'description' => 'Marchés de travaux de construction, réhabilitation et maintenance'],
            ['code' => 'FOURNITURES', 'libelle' => 'Fournitures',                  'description' => 'Marchés de fournitures de biens et équipements'],
            ['code' => 'SERVICES',    'libelle' => 'Services',                     'description' => 'Marchés de prestations intellectuelles et de services courants'],
            ['code' => 'PI',          'libelle' => 'Prestations Intellectuelles',  'description' => 'Missions de conseil, études, audits et assistance technique'],
            ['code' => 'DSP',         'libelle' => 'Délégation de Service Public', 'description' => 'Concessions et délégations de service public'],
        ];

        foreach ($types as $type) {
            if (!GmpTypeMarche::where('organisation_id', $orgId)->where('code', $type['code'])->exists()) {
                GmpTypeMarche::create([
                    'id'             => (string) Str::uuid(),
                    'organisation_id'=> $orgId,
                    'code'           => $type['code'],
                    'libelle'        => $type['libelle'],
                    'description'    => $type['description'],
                    'actif'          => true,
                ]);
            }
        }
    }

    private function seedModesPassation(string $orgId): void
    {
        $modes = [
            ['code' => 'AO_OUVERT',       'libelle' => 'Appel d\'Offres Ouvert',    'description' => 'Procédure ouverte à tous les candidats qualifiés'],
            ['code' => 'AO_RESTREINT',    'libelle' => 'Appel d\'Offres Restreint', 'description' => 'Consultation d\'un nombre limité de candidats présélectionnés'],
            ['code' => 'ENTENTE_DIRECTE', 'libelle' => 'Entente Directe',           'description' => 'Négociation directe avec un fournisseur sans mise en concurrence'],
            ['code' => 'COTATION',        'libelle' => 'Demande de Cotation',       'description' => 'Consultation simplifiée pour les achats de faible montant'],
            ['code' => 'CONSULTATION',    'libelle' => 'Consultation',              'description' => 'Mise en concurrence restreinte pour services et fournitures courants'],
        ];

        foreach ($modes as $mode) {
            if (!GmpModePassation::where('organisation_id', $orgId)->where('code', $mode['code'])->exists()) {
                GmpModePassation::create([
                    'id'             => (string) Str::uuid(),
                    'organisation_id'=> $orgId,
                    'code'           => $mode['code'],
                    'libelle'        => $mode['libelle'],
                    'description'    => $mode['description'],
                    'actif'          => true,
                ]);
            }
        }
    }

    private function seedSourcesFinancement(string $orgId): void
    {
        $sources = [
            ['code' => 'BUDGET_NAT', 'libelle' => 'Budget National',                   'bailleur' => 'État du Sénégal'],
            ['code' => 'BM',         'libelle' => 'Banque Mondiale',                   'bailleur' => 'IDA/BIRD'],
            ['code' => 'BOAD',       'libelle' => 'BOAD',                              'bailleur' => 'BOAD'],
            ['code' => 'BAD',        'libelle' => 'Banque Africaine de Développement', 'bailleur' => 'BAD/FAD'],
            ['code' => 'BID',        'libelle' => 'Banque Islamique de Développement', 'bailleur' => 'BID'],
            ['code' => 'UE',         'libelle' => 'Union Européenne',                  'bailleur' => 'FED/UE'],
            ['code' => 'PPP',        'libelle' => 'Partenariat Public-Privé',          'bailleur' => null],
            ['code' => 'AUTRE',      'libelle' => 'Autre source',                      'bailleur' => null],
        ];

        foreach ($sources as $source) {
            if (!GmpSourceFinancement::where('organisation_id', $orgId)->where('code', $source['code'])->exists()) {
                GmpSourceFinancement::create([
                    'id'             => (string) Str::uuid(),
                    'organisation_id'=> $orgId,
                    'code'           => $source['code'],
                    'libelle'        => $source['libelle'],
                    'bailleur'       => $source['bailleur'],
                    'devise'         => 'XOF',
                    'actif'          => true,
                ]);
            }
        }
    }

    private function seedSecteursIntervention(string $orgId): void
    {
        $secteurs = [
            ['code' => 'SANTE',        'libelle' => 'Santé',                   'couleur' => '#EF4444'],
            ['code' => 'EDUCATION',    'libelle' => 'Éducation',               'couleur' => '#3B82F6'],
            ['code' => 'INFRA',        'libelle' => 'Infrastructures',         'couleur' => '#F59E0B'],
            ['code' => 'ENERGIE',      'libelle' => 'Énergie',                 'couleur' => '#10B981'],
            ['code' => 'EAU',          'libelle' => 'Eau et Assainissement',   'couleur' => '#06B6D4'],
            ['code' => 'AGRI',         'libelle' => 'Agriculture',             'couleur' => '#84CC16'],
            ['code' => 'NUMERIQUE',    'libelle' => 'Numérique et Télécom',    'couleur' => '#8B5CF6'],
            ['code' => 'SECURITE',     'libelle' => 'Sécurité et Défense',     'couleur' => '#6B7280'],
            ['code' => 'TRANSPORT',    'libelle' => 'Transport',               'couleur' => '#F97316'],
            ['code' => 'SOCIAL',       'libelle' => 'Protection Sociale',      'couleur' => '#EC4899'],
            ['code' => 'ENVIRONNEMENT','libelle' => 'Environnement',           'couleur' => '#22C55E'],
            ['code' => 'ADMIN',        'libelle' => 'Administration Générale', 'couleur' => '#64748B'],
        ];

        foreach ($secteurs as $secteur) {
            if (!GmpSecteurIntervention::where('organisation_id', $orgId)->where('code', $secteur['code'])->exists()) {
                GmpSecteurIntervention::create([
                    'id'             => (string) Str::uuid(),
                    'organisation_id'=> $orgId,
                    'code'           => $secteur['code'],
                    'libelle'        => $secteur['libelle'],
                    'couleur'        => $secteur['couleur'],
                    'actif'          => true,
                ]);
            }
        }
    }

    private function seedSeuilsArmp(string $orgId): void
    {
        $annee = 2025;
        $pays  = 'SN';

        $travaux    = GmpTypeMarche::where('organisation_id', $orgId)->where('code', 'TRAVAUX')->first();
        $fourniture = GmpTypeMarche::where('organisation_id', $orgId)->where('code', 'FOURNITURES')->first();
        $services   = GmpTypeMarche::where('organisation_id', $orgId)->where('code', 'SERVICES')->first();
        $pi         = GmpTypeMarche::where('organisation_id', $orgId)->where('code', 'PI')->first();

        $aoOuvert       = GmpModePassation::where('organisation_id', $orgId)->where('code', 'AO_OUVERT')->first();
        $aoRestreint    = GmpModePassation::where('organisation_id', $orgId)->where('code', 'AO_RESTREINT')->first();
        $ententeDirecte = GmpModePassation::where('organisation_id', $orgId)->where('code', 'ENTENTE_DIRECTE')->first();
        $cotation       = GmpModePassation::where('organisation_id', $orgId)->where('code', 'COTATION')->first();
        $consultation   = GmpModePassation::where('organisation_id', $orgId)->where('code', 'CONSULTATION')->first();

        if (!$travaux || !$aoOuvert) return;

        // Seuils ARMP Sénégal en FCFA (source : décret n°2014-1212 et circulaire 2022)
        $seuils = [
            ['type_id' => $travaux->id,    'mode_id' => $aoOuvert->id,        'min' => 100_000_000, 'max' => null,        'desc' => 'Travaux — AO Ouvert (≥ 100M FCFA)'],
            ['type_id' => $travaux->id,    'mode_id' => $aoRestreint->id,     'min' => 30_000_000,  'max' => 100_000_000, 'desc' => 'Travaux — AO Restreint (30M–100M FCFA)'],
            ['type_id' => $travaux->id,    'mode_id' => $cotation->id,        'min' => 5_000_000,   'max' => 30_000_000,  'desc' => 'Travaux — Cotation (5M–30M FCFA)'],
            ['type_id' => $travaux->id,    'mode_id' => $ententeDirecte->id,  'min' => 0,           'max' => 5_000_000,   'desc' => 'Travaux — Entente Directe (< 5M FCFA)'],
            ['type_id' => $fourniture->id, 'mode_id' => $aoOuvert->id,        'min' => 60_000_000,  'max' => null,        'desc' => 'Fournitures — AO Ouvert (≥ 60M FCFA)'],
            ['type_id' => $fourniture->id, 'mode_id' => $aoRestreint->id,     'min' => 15_000_000,  'max' => 60_000_000,  'desc' => 'Fournitures — AO Restreint (15M–60M FCFA)'],
            ['type_id' => $fourniture->id, 'mode_id' => $cotation->id,        'min' => 3_000_000,   'max' => 15_000_000,  'desc' => 'Fournitures — Cotation (3M–15M FCFA)'],
            ['type_id' => $fourniture->id, 'mode_id' => $ententeDirecte->id,  'min' => 0,           'max' => 3_000_000,   'desc' => 'Fournitures — Entente Directe (< 3M FCFA)'],
            ['type_id' => $services->id,   'mode_id' => $aoOuvert->id,        'min' => 60_000_000,  'max' => null,        'desc' => 'Services — AO Ouvert (≥ 60M FCFA)'],
            ['type_id' => $services->id,   'mode_id' => $consultation->id,    'min' => 10_000_000,  'max' => 60_000_000,  'desc' => 'Services — Consultation (10M–60M FCFA)'],
            ['type_id' => $services->id,   'mode_id' => $ententeDirecte->id,  'min' => 0,           'max' => 10_000_000,  'desc' => 'Services — Entente Directe (< 10M FCFA)'],
            ['type_id' => $pi->id,         'mode_id' => $aoRestreint->id,     'min' => 50_000_000,  'max' => null,        'desc' => 'PI — AO Restreint (≥ 50M FCFA)'],
            ['type_id' => $pi->id,         'mode_id' => $consultation->id,    'min' => 10_000_000,  'max' => 50_000_000,  'desc' => 'PI — Consultation (10M–50M FCFA)'],
            ['type_id' => $pi->id,         'mode_id' => $ententeDirecte->id,  'min' => 0,           'max' => 10_000_000,  'desc' => 'PI — Entente Directe (< 10M FCFA)'],
        ];

        foreach ($seuils as $seuil) {
            $exists = GmpSeuilReglementaire::where('organisation_id', $orgId)
                ->where('type_marche_id', $seuil['type_id'])
                ->where('mode_passation_id', $seuil['mode_id'])
                ->where('pays', $pays)
                ->where('annee_application', $annee)
                ->exists();

            if (!$exists) {
                GmpSeuilReglementaire::create([
                    'id'               => (string) Str::uuid(),
                    'organisation_id'  => $orgId,
                    'type_marche_id'   => $seuil['type_id'],
                    'mode_passation_id'=> $seuil['mode_id'],
                    'pays'             => $pays,
                    'annee_application'=> $annee,
                    'montant_min'      => $seuil['min'],
                    'montant_max'      => $seuil['max'],
                    'description'      => $seuil['desc'],
                    'actif'            => true,
                ]);
            }
        }
    }

    private function seedParametresIa(string $orgId): void
    {
        if (!GmpParametreIa::where('organisation_id', $orgId)->exists()) {
            GmpParametreIa::create([
                'id'                           => (string) Str::uuid(),
                'organisation_id'              => $orgId,
                'seuil_alerte_budget'          => 80.00,
                'seuil_alerte_delai'           => 7,
                'sensibilite_anomalie'         => 'normale',
                'score_risque_actif'           => true,
                'assistant_ia_actif'           => true,
                'generation_docs_active'       => true,
                'rapport_anomalies_frequence'  => 'hebdo',
                'rapport_anomalies_destinataires' => [],
                'modele_ia'                    => 'claude-sonnet-4-6',
            ]);
        }
    }

    private function seedRolesGmp(string $orgId): void
    {
        $rolesGmp = [
            [
                'nom'         => 'Responsable PPM',
                'description' => 'Élabore et gère le Plan de Passation des Marchés',
                'permissions' => ['gmp.ppm.creer' => true, 'gmp.ppm.soumettre' => true, 'gmp.ao.creer' => true, 'gmp.marches.lire' => true],
            ],
            [
                'nom'         => 'Superviseur GMP',
                'description' => 'Supervise l\'exécution des marchés et valide les étapes clés',
                'permissions' => ['gmp.marches.valider' => true, 'gmp.rapports.lire' => true, 'gmp.alertes.lire' => true, 'gmp.marches.lire' => true],
            ],
            [
                'nom'         => 'Agent de Saisie GMP',
                'description' => 'Saisit les données d\'exécution : situations, décomptes, OS',
                'permissions' => ['gmp.situations.creer' => true, 'gmp.decomptes.creer' => true, 'gmp.os.creer' => true, 'gmp.marches.lire' => true],
            ],
            [
                'nom'         => 'Valideur GMP',
                'description' => 'Valide les paiements et les bons à payer',
                'permissions' => ['gmp.bap.valider' => true, 'gmp.decomptes.certifier' => true, 'gmp.marches.lire' => true],
            ],
            [
                'nom'         => 'Lecteur GMP',
                'description' => 'Accès en lecture seule aux marchés et rapports GMP',
                'permissions' => ['gmp.marches.lire' => true, 'gmp.rapports.lire' => true],
            ],
        ];

        foreach ($rolesGmp as $roleData) {
            if (!Role::where('organisation_id', $orgId)->where('nom', $roleData['nom'])->exists()) {
                Role::create([
                    'id'             => (string) Str::uuid(),
                    'organisation_id'=> $orgId,
                    'nom'            => $roleData['nom'],
                    'description'    => $roleData['description'],
                    'est_systeme'    => false,
                    'permissions'    => $roleData['permissions'],
                ]);
            }
        }
    }
}
