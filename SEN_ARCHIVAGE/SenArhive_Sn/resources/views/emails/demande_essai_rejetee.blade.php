<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande d'essai</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a2f52; padding: 32px 40px; text-align: center; }
        .header .logo { color: #ff7631; font-size: 24px; font-weight: 700; }
        .header .logo span { color: white; }
        .body { padding: 40px; }
        h1 { color: #1a2f52; font-size: 22px; margin-top: 0; }
        p { color: #555; line-height: 1.7; }
        .reason { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #333; }
        .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">Sen<span>Arhive</span></div>
    </div>
    <div class="body">
        <h1>Votre demande d'essai</h1>
        <p>Bonjour <strong>{{ $utilisateur->prenom }} {{ $utilisateur->nom }}</strong>,</p>
        <p>
            Après examen de votre demande d'accès à la période d'essai pour l'organisation
            <strong>{{ $organisation->nom }}</strong>, nous ne sommes malheureusement pas en mesure
            de la valider pour le moment.
        </p>
        <div class="reason">
            <strong>Raison :</strong><br>
            {{ $raison }}
        </div>
        <p>
            Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez en savoir plus,
            n'hésitez pas à contacter notre équipe de support.
        </p>
        <p>Cordialement,<br><strong>L'équipe SenArhive</strong></p>
    </div>
    <div class="footer">
        © {{ date('Y') }} SenArhive — Plateforme d'archivage électronique
    </div>
</div>
</body>
</html>
