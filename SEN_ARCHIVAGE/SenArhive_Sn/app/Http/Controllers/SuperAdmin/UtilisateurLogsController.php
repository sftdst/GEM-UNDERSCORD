<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\JournalActivite;
use App\Models\Organisation;
use App\Scopes\OrganisationScope;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UtilisateurLogsController extends Controller
{
    /**
     * Liste paginée de TOUS les journaux d'activité toutes organisations confondues.
     */
    public function index(Request $request)
    {
        $query = JournalActivite::withoutGlobalScope(OrganisationScope::class)
            ->with(['organisation:id,nom', 'utilisateur:id,nom,prenom,email']);

        if ($request->filled('organisation_id')) {
            $query->where('organisation_id', $request->input('organisation_id'));
        }

        if ($request->filled('utilisateur_id')) {
            $query->where('utilisateur_id', $request->input('utilisateur_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->input('action') . '%');
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->input('date_to') . ' 23:59:59');
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        $journaux = $query->orderByDesc('created_at')->paginate(50)->withQueryString();

        $organisations = Organisation::orderBy('nom')->get(['id', 'nom']);

        $actions = JournalActivite::withoutGlobalScope(OrganisationScope::class)
            ->selectRaw('DISTINCT action')
            ->orderBy('action')
            ->pluck('action');

        return Inertia::render('superadmin/utilisateurs/logs', [
            'journaux'      => $journaux,
            'organisations' => $organisations,
            'actions'       => $actions,
            'filters'       => $request->only('organisation_id', 'utilisateur_id', 'action', 'date_from', 'date_to', 'statut'),
        ]);
    }

    /**
     * Export CSV des journaux d'activité (max 5 000 lignes).
     */
    public function export(Request $request)
    {
        $query = JournalActivite::withoutGlobalScope(OrganisationScope::class)
            ->with(['organisation:id,nom', 'utilisateur:id,nom,prenom']);

        if ($request->filled('organisation_id')) {
            $query->where('organisation_id', $request->input('organisation_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->input('action') . '%');
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->input('date_to') . ' 23:59:59');
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        $journaux = $query->orderByDesc('created_at')->limit(5000)->get();

        $csv  = "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
        $csv .= "Date,Organisation,Utilisateur,Action,Ressource Type,Ressource ID,IP,Statut\n";

        foreach ($journaux as $j) {
            $utilisateur = $j->utilisateur
                ? "\"{$j->utilisateur->prenom} {$j->utilisateur->nom}\""
                : '"N/A"';

            $csv .= implode(',', [
                '"' . ($j->created_at ?? '') . '"',
                '"' . ($j->organisation?->nom ?? '') . '"',
                $utilisateur,
                '"' . ($j->action ?? '') . '"',
                '"' . ($j->ressource_type ?? '') . '"',
                '"' . ($j->ressource_id ?? '') . '"',
                '"' . ($j->ip_address ?? '') . '"',
                '"' . ($j->statut ?? '') . '"',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="logs_activite_' . now()->format('Ymd_His') . '.csv"',
        ]);
    }
}
