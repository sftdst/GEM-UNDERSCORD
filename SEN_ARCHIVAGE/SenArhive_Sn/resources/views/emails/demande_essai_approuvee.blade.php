<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande approuvée</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a2f52; padding: 32px 40px; text-align: center; }
        .header .logo { color: #ff7631; font-size: 24px; font-weight: 700; }
        .header .logo span { color: white; }
        .body { padding: 40px; }
        h1 { color: #1a2f52; font-size: 22px; margin-top: 0; }
        p { color: #555; line-height: 1.7; }
        .highlight { background: #fff8f4; border-left: 4px solid #ff7631; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .btn { display: inline-block; background: #ff7631; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
        .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">Sen<span>Arhive</span></div>
    </div>
    <div class="body">
        <h1>🎉 Votre demande d'essai a été approuvée !</h1>
        <p>Bonjour <strong>{{ $utilisateur->prenom }} {{ $utilisateur->nom }}</strong>,</p>
        <p>
            Nous avons le plaisir de vous informer que votre demande d'accès à la période d'essai
            pour l'organisation <strong>{{ $organisation->nom }}</strong> a été approuvée.
        </p>
        <div class="highlight">
            <p style="margin:0;color:#333;">
                Vous disposez maintenant de <strong>14 jours d'essai gratuit</strong> pour explorer
                toutes les fonctionnalités de SenArhive.
            </p>
        </div>
        <p>Connectez-vous dès maintenant avec votre email <strong>{{ $utilisateur->email }}</strong> :</p>
        <a href="{{ $loginUrl }}" class="btn">Accéder à mon espace</a>
        <p style="margin-top:32px;">
            Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.
        </p>
        <p>À bientôt,<br><strong>L'équipe SenArhive</strong></p>
    </div>
    <div class="footer">
        © {{ date('Y') }} SenArhive — Plateforme d'archivage électronique
    </div>
</div>
</body>
</html>
