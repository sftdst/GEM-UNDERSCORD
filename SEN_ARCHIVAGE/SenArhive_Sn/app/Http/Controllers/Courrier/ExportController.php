<?php

namespace App\Http\Controllers\Courrier;

use App\Exports\CourriersExport;
use App\Http\Controllers\Controller;
use App\Models\Courrier;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportController extends Controller
{
    public function export(Request $request)
    {
        $format = $request->input('format', 'excel');
        $query = Courrier::with(['service', 'agent', 'typeCourrier', 'statutCourrier']);

        // Apply same filters as liste
        if ($request->input('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('numero', 'ilike', "%{$request->input('q')}%")
                  ->orWhere('objet', 'ilike', "%{$request->input('q')}%")
                  ->orWhere('expediteur_nom', 'ilike', "%{$request->input('q')}%");
            });
        }

        if ($request->input('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->input('statut')) {
            $query->where('statut', $request->input('statut'));
        }
        if ($request->input('categorie')) {
            $query->where('categorie', $request->input('categorie'));
        }
        if ($request->input('urgence')) {
            $query->where('urgence', $request->input('urgence'));
        }
        if ($request->input('service_id')) {
            $query->where('service_id', $request->input('service_id'));
        }
        if ($request->input('agent_id')) {
            $query->where('agent_affecte_id', $request->input('agent_id'));
        }
        if ($request->input('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->input('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $courriers = $query->get();

        switch ($format) {
            case 'pdf':
                return $this->exportPdf($courriers);
            case 'csv':
                return $this->exportCsv($courriers);
            case 'excel':
            default:
                return $this->exportExcel($courriers);
        }
    }

    private function exportExcel($courriers)
    {
        return Excel::download(new CourriersExport($courriers), 'courriers-' . now()->format('Y-m-d') . '.xlsx');
    }

    private function exportCsv($courriers)
    {
        return Excel::download(new CourriersExport($courriers), 'courriers-' . now()->format('Y-m-d') . '.csv');
    }

    private function exportPdf($courriers)
    {
        $pdf = Pdf::loadView('exports.courriers-pdf', ['courriers' => $courriers]);
        return $pdf->download('courriers-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportZip(Request $request)
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return back()->with('error', 'Aucun courrier sélectionné');
        }

        $courriers = Courrier::whereIn('id', $ids)
            ->with(['documents', 'service', 'agent'])
            ->get();

        $zipName = 'courriers-export-' . now()->format('Y-m-d-His') . '.zip';
        $zipPath = storage_path('app/public/' . $zipName);
        
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) === TRUE) {
            foreach ($courriers as $courrier) {
                $zip->addFromString("{$courrier->numero}-details.txt", $this->courrierDetails($courrier));
                
                foreach ($courrier->documents as $doc) {
                    if (\Storage::disk('local')->exists($doc->chemin)) {
                        $zip->addFile(
                            \Storage::disk('local')->path($doc->chemin),
                            "{$courrier->numero}/{$doc->nom_fichier_original}"
                        );
                    }
                }
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    private function courrierDetails(Courrier $c): string
    {
        return "Numéro: {$c->numero}\nObjet: {$c->objet}\nType: " . 
               ($c->type === 'ENT' ? 'Entrant' : 'Sortant') . 
               "\nDate: " . ($c->date_reception ?? $c->date_envoi)->format('d/m/Y') .
               "\nStatut: {$c->statut}\nService: {$c->service?->nom}\n";
    }
}