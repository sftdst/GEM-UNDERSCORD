<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste des courriers</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #2563eb; color: white; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #2563eb; }
        .date { text-align: right; color: #666; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Liste des courriers</h1>
        <p class="date">Généré le {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Expéditeur</th>
                <th>Destinataire</th>
                <th>Service</th>
                <th>Agent</th>
                <th>Statut</th>
                <th>Catégorie</th>
                <th>Urgence</th>
                <th>Échéance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($courriers as $c)
            <tr>
                <td>{{ $c->numero }}</td>
                <td>{{ $c->type === 'ENT' ? 'Entrant' : 'Sortant' }}</td>
                <td>{{ Str::limit($c->objet, 30) }}</td>
                <td>{{ $c->expediteur_nom ?? '-' }}</td>
                <td>{{ $c->destinataire_nom ?? '-' }}</td>
                <td>{{ $c->service?->nom ?? '-' }}</td>
                <td>{{ $c->agent ? $c->agent->prenom . ' ' . $c->agent->nom : '-' }}</td>
                <td>{{ $c->statut }}</td>
                <td>{{ $c->categorie ?? '-' }}</td>
                <td>{{ $c->urgence }}</td>
                <td>{{ $c->date_echeance?->format('d/m/Y') ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <p style="margin-top: 20px; text-align: center; color: #666;">
        Total : {{ $courriers->count() }} courrier(s)
    </p>
</body>
</html>