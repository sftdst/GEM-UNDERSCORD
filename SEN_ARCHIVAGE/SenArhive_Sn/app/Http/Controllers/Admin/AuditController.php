<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JournalActivite;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalActivite::where('organisation_id', auth()->user()->organisation_id)
            ->with('utilisateur');

        if ($request->filled('utilisateur_id')) {
            $query->where('utilisateur_id', $request->input('utilisateur_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->input('date_to'));
        }

        $logs = $query->latest('created_at')->paginate(30)->withQueryString();

        return Inertia::render('admin/audit/logs', [
            'journaux' => $logs,
            'filters' => $request->only('utilisateur_id', 'action', 'date_from', 'date_to'),
        ]);
    }
}
