<?php

namespace App\Http\Controllers;

use App\Models\Abonnement;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\Espace;
use App\Models\InstanceWorkflow;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if ($user->statut === 'en_attente') {
            return redirect()->route('validation.en_attente');
        }

        $orgId = $user->organisation_id;
        $organisation = $user->organisation;

        // ── Stats de base ────────────────────────────────────────────────────
        $totalDocuments = Document::where('organisation_id', $orgId)->count();
        $totalDossiers  = Dossier::where('organisation_id', $orgId)->count();
        $totalEspaces   = Espace::where('organisation_id', $orgId)->count();
        $totalUtilisateurs = Utilisateur::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->count();

        $pendingWorkflows = InstanceWorkflow::whereHas('workflow', fn ($q) => $q->where('organisation_id', $orgId))
            ->where('statut', 'en_cours')
            ->count();

        // Documents dont la date d'archivage est dépassée
        $documentsArchivageDepasse = Document::where('organisation_id', $orgId)
            ->whereNotNull('date_archivage')
            ->where('date_archivage', '<', now())
            ->where('statut', '!=', 'archive')
            ->count();

        // ── Graphe 1 : Évolution mensuelle (12 derniers mois) ────────────────
        $rawMensuel = Document::where('organisation_id', $orgId)
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("strftime('%Y-%m', created_at) as mois, COUNT(*) as total")
            ->groupBy('mois')
            ->orderBy('mois')
            ->get()
            ->keyBy('mois');

        $documentsParMois = collect();
        for ($i = 11; $i >= 0; $i--) {
            $m = now()->subMonths($i);
            $key = $m->format('Y-m');
            $documentsParMois->push([
                'mois'  => $m->translatedFormat('M Y'),
                'short' => $m->format('M'),
                'total' => $rawMensuel->has($key) ? (int) $rawMensuel[$key]->total : 0,
            ]);
        }

        // ── Graphe 2 : Répartition par statut ────────────────────────────────
        $documentsParStatut = Document::where('organisation_id', $orgId)
            ->selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->get()
            ->map(fn ($r) => [
                'statut' => match ($r->statut) {
                    'actif'      => 'Actifs',
                    'archive'    => 'Archivés',
                    'en_attente' => 'En attente',
                    'supprime'   => 'Supprimés',
                    default      => ucfirst($r->statut),
                },
                'total' => (int) $r->total,
            ])
            ->values();

        // ── Graphe 3 : Top 6 extensions ──────────────────────────────────────
        $documentsParType = Document::where('organisation_id', $orgId)
            ->selectRaw('UPPER(COALESCE(extension, \'Autre\')) as extension, COUNT(*) as total')
            ->groupBy('extension')
            ->orderByDesc('total')
            ->take(6)
            ->get()
            ->map(fn ($r) => [
                'extension' => $r->extension ?: 'Autre',
                'total'     => (int) $r->total,
            ])
            ->values();

        // ── Graphe 4 : Top 5 espaces par nombre de documents ─────────────────
        $documentsParEspace = Document::where('documents.organisation_id', $orgId)
            ->whereNotNull('documents.dossier_id')
            ->join('dossiers', 'documents.dossier_id', '=', 'dossiers.id')
            ->join('espaces', 'dossiers.espace_id', '=', 'espaces.id')
            ->selectRaw('espaces.nom, COUNT(documents.id) as total')
            ->groupBy('espaces.nom')
            ->orderByDesc('total')
            ->take(5)
            ->get()
            ->map(fn ($r) => [
                'nom'   => $r->nom,
                'total' => (int) $r->total,
            ])
            ->values();

        // ── Documents récents & archivage ─────────────────────────────────────
        $recentDocuments = Document::where('organisation_id', $orgId)
            ->with('createur', 'categorie', 'dossier')
            ->latest()
            ->take(8)
            ->get();

        $documentsArchivageBientot = Document::where('organisation_id', $orgId)
            ->whereNotNull('date_archivage')
            ->where('date_archivage', '<=', now()->addDays(30))
            ->where('date_archivage', '>=', now())
            ->where('statut', '!=', 'archive')
            ->with('dossier', 'categorie')
            ->orderBy('date_archivage')
            ->take(10)
            ->get();

        // ── Abonnement actif & compte à rebours ───────────────────────────────
        $abonnementActif = Abonnement::where('organisation_id', $orgId)
            ->where('statut', 'actif')
            ->with('plan')
            ->latest('date_fin')
            ->first();

        $joursRestantsAbonnement = null;
        if ($abonnementActif?->date_fin) {
            $joursRestantsAbonnement = (int) now()->diffInDays($abonnementActif->date_fin, false);
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'total_documents'            => $totalDocuments,
                'total_dossiers'             => $totalDossiers,
                'total_espaces'              => $totalEspaces,
                'total_utilisateurs'         => $totalUtilisateurs,
                'stockage_utilise_mo'        => $organisation?->stockage_utilise_mo ?? 0,
                'stockage_max_go'            => $organisation?->plan?->stockage_max_go ?? 5,
                'workflows_en_cours'         => $pendingWorkflows,
                'documents_archivage_depasse'=> $documentsArchivageDepasse,
            ],
            'charts' => [
                'documents_par_mois'   => $documentsParMois,
                'documents_par_statut' => $documentsParStatut,
                'documents_par_type'   => $documentsParType,
                'documents_par_espace' => $documentsParEspace,
            ],
            'documents_recents'           => $recentDocuments,
            'documents_archivage_bientot' => $documentsArchivageBientot,
            'abonnement' => $abonnementActif ? [
                'plan_nom'              => $abonnementActif->plan?->nom,
                'date_fin'              => $abonnementActif->date_fin?->toDateString(),
                'jours_restants'        => $joursRestantsAbonnement,
            ] : null,
        ]);
    }
}
