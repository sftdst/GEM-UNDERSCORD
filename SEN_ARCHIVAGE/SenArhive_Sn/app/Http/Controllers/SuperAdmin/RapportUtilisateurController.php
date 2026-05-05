<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RapportUtilisateurController extends Controller
{
    /**
     * Rapport des utilisateurs connectés par organisation.
     */
    public function index(Request $request)
    {
        [$depuis, $jusqu] = $this->parsePeriode($request);

        // Requête SQL optimisée : une seule jointure pour tout calculer
        $rapportRaw = DB::table('organisations')
            ->select(
                'organisations.id',
                'organisations.nom',
                'organisations.statut',
            )
            ->selectRaw('COUNT(u.id) AS total_utilisateurs')
            ->selectRaw(
                'COUNT(CASE WHEN u.derniere_connexion BETWEEN ? AND ? THEN 1 END) AS connectes',
                [$depuis, $jusqu]
            )
            ->selectRaw('MAX(u.derniere_connexion) AS derniere_connexion')
            ->leftJoin('utilisateurs AS u', 'u.organisation_id', '=', 'organisations.id')
            ->groupBy('organisations.id', 'organisations.nom', 'organisations.statut')
            ->orderBy('organisations.nom')
            ->get();

        $rapport = $rapportRaw->map(function ($row) {
            $total     = (int) $row->total_utilisateurs;
            $connectes = (int) $row->connectes;
            return [
                'id'                 => $row->id,
                'nom'                => $row->nom,
                'statut'             => $row->statut,
                'total_utilisateurs' => $total,
                'connectes'          => $connectes,
                'taux_connexion'     => $total > 0 ? round($connectes / $total * 100) : 0,
                'derniere_connexion' => $row->derniere_connexion,
            ];
        })->values();

        // Top 10 organisations pour le graphique
        $chartData = $rapport
            ->sortByDesc('connectes')
            ->take(10)
            ->values()
            ->map(fn ($r) => [
                'nom'       => $r['nom'],
                'connectes' => $r['connectes'],
                'total'     => $r['total_utilisateurs'],
            ]);

        $periode = $request->input('periode', '7d');

        $stats = [
            'total_utilisateurs'    => Utilisateur::whereNotNull('organisation_id')->count(),
            'connectes_periode'     => (int) DB::table('utilisateurs')
                ->whereNotNull('organisation_id')
                ->whereBetween('derniere_connexion', [$depuis, $jusqu])
                ->count(),
            'orgs_avec_connexions'  => $rapport->where('connectes', '>', 0)->count(),
            'periode_label'         => $this->periodeLabel($periode, $depuis, $jusqu),
        ];

        return Inertia::render('superadmin/utilisateurs/rapport', [
            'rapport'   => $rapport,
            'chartData' => $chartData,
            'stats'     => $stats,
            'filters'   => $request->only('periode', 'date_from', 'date_to'),
        ]);
    }

    /**
     * Export CSV du rapport.
     */
    public function export(Request $request)
    {
        [$depuis, $jusqu] = $this->parsePeriode($request);

        $rows = DB::table('organisations')
            ->select('organisations.nom', 'organisations.statut')
            ->selectRaw('COUNT(u.id) AS total_utilisateurs')
            ->selectRaw(
                'COUNT(CASE WHEN u.derniere_connexion BETWEEN ? AND ? THEN 1 END) AS connectes',
                [$depuis, $jusqu]
            )
            ->selectRaw('MAX(u.derniere_connexion) AS derniere_connexion')
            ->leftJoin('utilisateurs AS u', 'u.organisation_id', '=', 'organisations.id')
            ->groupBy('organisations.nom', 'organisations.statut')
            ->orderBy('organisations.nom')
            ->get();

        $csv  = "\xEF\xBB\xBF";
        $csv .= "Organisation,Statut,Total utilisateurs,Connectés,Taux (%),Dernière connexion\n";

        foreach ($rows as $row) {
            $total     = (int) $row->total_utilisateurs;
            $connectes = (int) $row->connectes;
            $taux      = $total > 0 ? round($connectes / $total * 100) : 0;

            $csv .= implode(',', [
                '"' . $row->nom . '"',
                '"' . $row->statut . '"',
                $total,
                $connectes,
                $taux,
                '"' . ($row->derniere_connexion ?? '') . '"',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rapport_connexions_' . now()->format('Ymd') . '.csv"',
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function parsePeriode(Request $request): array
    {
        $periode = $request->input('periode', '7d');

        $depuis = match ($periode) {
            '24h'    => now()->subHours(24),
            '30d'    => now()->subDays(30),
            'custom' => $request->filled('date_from')
                            ? \Carbon\Carbon::parse($request->input('date_from'))->startOfDay()
                            : now()->subDays(7),
            default  => now()->subDays(7), // '7d'
        };

        $jusqu = $periode === 'custom' && $request->filled('date_to')
            ? \Carbon\Carbon::parse($request->input('date_to'))->endOfDay()
            : now();

        return [$depuis, $jusqu];
    }

    private function periodeLabel(string $periode, $depuis, $jusqu): string
    {
        return match ($periode) {
            '24h'    => 'Dernières 24 heures',
            '7d'     => '7 derniers jours',
            '30d'    => '30 derniers jours',
            'custom' => 'Du ' . $depuis->format('d/m/Y') . ' au ' . $jusqu->format('d/m/Y'),
            default  => '7 derniers jours',
        };
    }
}
