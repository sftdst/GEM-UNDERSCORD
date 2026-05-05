<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\DemandeChangementPlan;
use App\Models\Document;
use App\Models\Espace;
use App\Models\Facture;
use App\Models\Organisation;
use App\Models\Plan;
use App\Models\TicketSupport;
use App\Models\Utilisateur;
use App\Models\Workflow;
use App\Scopes\OrganisationScope;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ── KPI ─────────────────────────────────────────────────────────────
        $stockageTotalMo = (float) Organisation::sum('stockage_utilise_mo');

        $stats = [
            // Organisations
            'organisations_total'      => Organisation::count(),
            'organisations_actives'    => Organisation::where('statut', 'actif')->count(),
            'organisations_suspendues' => Organisation::where('statut', 'suspendu')->count(),

            // Utilisateurs
            'utilisateurs'             => Utilisateur::whereNotNull('organisation_id')->count(),
            'connectes_24h'            => Utilisateur::whereNotNull('organisation_id')
                                              ->where('derniere_connexion', '>=', now()->subHours(24))
                                              ->count(),
            'connectes_7j'             => Utilisateur::whereNotNull('organisation_id')
                                              ->where('derniere_connexion', '>=', now()->subDays(7))
                                              ->count(),

            // Abonnements & revenus
            'abonnements_actifs'       => Abonnement::withoutGlobalScope(OrganisationScope::class)->where('statut', 'actif')->count(),
            'demandes_en_attente'      => DemandeChangementPlan::where('statut', 'en_attente')->count(),
            'revenue_mensuel'          => $this->revenueMensuel(),
            'revenue_annuel'           => $this->revenueAnnuel(),

            // Documents & stockage
            'documents_total'          => Document::withoutGlobalScope(OrganisationScope::class)->count(),
            'documents_semaine'        => Document::withoutGlobalScope(OrganisationScope::class)
                                              ->where('created_at', '>=', now()->subDays(7))
                                              ->count(),
            'stockage_total_go'        => round($stockageTotalMo / 1024, 2),
            'stockage_total_mo'        => (int) $stockageTotalMo,

            // Plateforme
            'espaces_total'            => Espace::withoutGlobalScope(OrganisationScope::class)->count(),
            'workflows_actifs'         => Workflow::withoutGlobalScope(OrganisationScope::class)->where('actif', true)->count(),
            'tickets_ouverts'          => TicketSupport::withoutGlobalScope(OrganisationScope::class)->where('statut', 'ouvert')->count(),
            'plans_actifs'             => Plan::where('actif', true)->count(),
        ];

        // ── Alertes expiration ───────────────────────────────────────────────
        $expirantCritiques = Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('statut', 'actif')
            ->whereBetween('date_fin', [now(), now()->addDays(7)])
            ->with('organisation', 'plan')
            ->orderBy('date_fin')
            ->get();

        $expirantBientot = Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('statut', 'actif')
            ->whereBetween('date_fin', [now()->addDays(8), now()->addDays(30)])
            ->with('organisation', 'plan')
            ->orderBy('date_fin')
            ->get();

        $expires = Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('statut', 'actif')
            ->where('date_fin', '<', now())
            ->with('organisation', 'plan')
            ->orderBy('date_fin', 'desc')
            ->limit(5)
            ->get();

        // ── Demandes de changement de plan ───────────────────────────────────
        $demandesPlan = DemandeChangementPlan::with('organisation', 'planActuel', 'planDemande')
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // ── Dernières organisations ──────────────────────────────────────────
        $recentOrganisations = Organisation::with('plan')
            ->latest()
            ->limit(6)
            ->get();

        // ── Graphiques ──────────────────────────────────────────────────────
        $planDistribution = Plan::withCount('organisations')
            ->get()
            ->map(fn ($p) => ['nom' => $p->nom, 'count' => $p->organisations_count, 'actif' => $p->actif]);

        $revenueParPlan = Plan::get()->map(fn ($p) => [
            'nom'     => $p->nom,
            'revenue' => (float) Abonnement::withoutGlobalScope(OrganisationScope::class)
                ->where('plan_id', $p->id)
                ->where('statut', 'actif')
                ->sum('prix_applique'),
        ])->filter(fn ($r) => $r['revenue'] > 0)->values();

        // ── Stockage utilisé par organisation (top 10) ───────────────────────
        $stockageParOrg = Organisation::where('statut', 'actif')
            ->where('stockage_utilise_mo', '>', 0)
            ->orderByDesc('stockage_utilise_mo')
            ->limit(10)
            ->get(['nom', 'stockage_utilise_mo'])
            ->map(fn ($o) => [
                'nom' => $o->nom,
                'mo'  => $o->stockage_utilise_mo,
                'go'  => round($o->stockage_utilise_mo / 1024, 2),
            ])->values();

        // ── Renouvellements 30 jours ─────────────────────────────────────────
        $renouvellements = Abonnement::withoutGlobalScope(OrganisationScope::class)
            ->where('statut', 'actif')
            ->whereBetween('date_renouvellement', [now(), now()->addDays(30)])
            ->with('organisation', 'plan')
            ->orderBy('date_renouvellement')
            ->limit(10)
            ->get();

        // ── Utilisateurs connectés par organisation (7 derniers jours) ───────
        $utilisateursConnectesParOrg = DB::table('organisations')
            ->select('organisations.nom')
            ->selectRaw(
                'COUNT(CASE WHEN u.derniere_connexion >= ? THEN 1 END) AS connectes_7j',
                [now()->subDays(7)]
            )
            ->selectRaw('COUNT(u.id) AS total')
            ->leftJoin('utilisateurs AS u', 'u.organisation_id', '=', 'organisations.id')
            ->where('organisations.statut', 'actif')
            ->groupBy('organisations.id', 'organisations.nom')
            ->orderByDesc('connectes_7j')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'nom'          => $r->nom,
                'connectes_7j' => (int) $r->connectes_7j,
                'total'        => (int) $r->total,
            ])
            ->values();

        return Inertia::render('superadmin/dashboard', [
            'stats'                        => $stats,
            'expirantCritiques'            => $expirantCritiques,
            'expirantBientot'              => $expirantBientot,
            'expires'                      => $expires,
            'demandesPlan'                 => $demandesPlan,
            'recentOrganisations'          => $recentOrganisations,
            'planDistribution'             => $planDistribution,
            'revenueParPlan'               => $revenueParPlan,
            'renouvellements'              => $renouvellements,
            'utilisateursConnectesParOrg'  => $utilisateursConnectesParOrg,
            'stockageParOrg'               => $stockageParOrg,
        ]);
    }

    private function revenueMensuel(): float
    {
        return (float) Facture::withoutGlobalScope(OrganisationScope::class)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->where('statut', 'payee')
            ->sum('montant_ht');
    }

    private function revenueAnnuel(): float
    {
        return (float) Facture::withoutGlobalScope(OrganisationScope::class)
            ->whereYear('created_at', now()->year)
            ->where('statut', 'payee')
            ->sum('montant_ht');
    }
}
