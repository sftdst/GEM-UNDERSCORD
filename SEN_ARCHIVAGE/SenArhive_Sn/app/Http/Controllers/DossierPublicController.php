<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use Illuminate\Http\Request;

class DossierPublicController extends Controller
{
    public function show(string $token)
    {
        $dossier = Dossier::where('qr_token', $token)->firstOrFail();

        $arborescence = $this->buildArborescence($dossier);

        return view('dossier_public', [
            'dossier'       => $dossier,
            'arborescence'  => $arborescence,
        ]);
    }

    private function buildArborescence(Dossier $dossier): array
    {
        $documents = $dossier->documents()
            ->select('id', 'titre', 'numero_document', 'date_document', 'extension', 'taille_octets')
            ->get()
            ->map(fn ($d) => [
                'id'              => $d->id,
                'titre'           => $d->titre,
                'numero_document' => $d->numero_document,
                'date_document'   => $d->date_document,
                'extension'       => strtoupper($d->extension),
                'taille_formatee' => $this->formatBytes($d->taille_octets),
            ])->toArray();

        $enfants = $dossier->enfants()
            ->orderBy('nom')
            ->get()
            ->map(fn ($enfant) => $this->buildArborescence($enfant))
            ->toArray();

        return [
            'id'       => $dossier->id,
            'nom'      => $dossier->nom,
            'couleur'  => $dossier->couleur ?? '#6366f1',
            'niveau'   => $dossier->niveau,
            'documents'=> $documents,
            'enfants'  => $enfants,
        ];
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' Go';
        if ($bytes >= 1048576)    return round($bytes / 1048576, 2) . ' Mo';
        if ($bytes >= 1024)       return round($bytes / 1024, 2) . ' Ko';
        return $bytes . ' o';
    }
}
