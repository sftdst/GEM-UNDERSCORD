<?php

namespace App\Exports;

use App\Models\Courrier;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class CourriersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $courriers;

    public function __construct($courriers)
    {
        $this->courriers = $courriers;
    }

    public function collection()
    {
        return $this->courriers;
    }

    public function headings(): array
    {
        return [
            'Numéro',
            'Type',
            'Objet',
            'Expéditeur',
            'Destinataire',
            'Service',
            'Agent',
            'Statut',
            'Catégorie',
            'Urgence',
            'Date réception',
            'Date envoi',
            'Date échéance',
            'Date traitement',
            'Créé le',
        ];
    }

    public function map($courrier): array
    {
        return [
            $courrier->numero,
            $courrier->type === 'ENT' ? 'Entrant' : 'Sortant',
            $courrier->objet,
            $courrier->expediteur_nom ?? '',
            $courrier->destinataire_nom ?? '',
            $courrier->service?->nom ?? '',
            $courrier->agent ? "{$courrier->agent->prenom} {$courrier->agent->nom}" : '',
            $courrier->statut,
            $courrier->categorie ?? '',
            $courrier->urgence,
            $courrier->date_reception?->format('d/m/Y H:i') ?? '',
            $courrier->date_envoi?->format('d/m/Y H:i') ?? '',
            $courrier->date_echeance?->format('d/m/Y') ?? '',
            $courrier->date_traitement?->format('d/m/Y H:i') ?? '',
            $courrier->created_at->format('d/m/Y H:i'),
        ];
    }
}