<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Accusé de réception</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .title { font-size: 20px; margin-top: 10px; }
        .content { line-height: 1.8; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GED GEM</div>
        <div class="title">Accusé de réception de courrier</div>
    </div>

    <div class="content">
        <p>Je soussigné(e), officier public, certifie que le courrier suivant a bien été reçu et enregistré dans notre système de gestion des courriers.</p>

        <div class="field"><span class="label">Numéro :</span> {{ $numero }}</div>
        <div class="field"><span class="label">Date :</span> {{ $date }}</div>
        <div class="field"><span class="label">Objet :</span> {{ $objet }}</div>
        <div class="field"><span class="label">Expéditeur :</span> {{ $expediteur }}</div>
        @if($destinataire)
        <div class="field"><span class="label">Destinataire :</span> {{ $destinataire }}</div>
        @endif
        <div class="field"><span class="label">Type :</span> {{ $type }}</div>

        <p>Ce document est établi à l'électronique et a valeur légale d'accusé de réception.</p>
    </div>

    <div class="footer">
        <p>Document généré automatiquement par le système GED GEM - {{ now()->format('d/m/Y H:i') }}</p>
        <p>Conformément aux dispositions légales sur l'archivage électronique des documents.</p>
    </div>
</body>
</html>