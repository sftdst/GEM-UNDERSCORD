<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GED GEM - Gestion Électronique des Courriers</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 { color: #1e40af; margin-bottom: 10px; }
        p { color: #64748b; margin-bottom: 20px; }
        .btn { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            margin: 5px;
            font-weight: 500;
        }
        .btn:hover { background: #1d4ed8; }
        .btn-outline { 
            background: transparent; 
            border: 2px solid #2563eb; 
            color: #2563eb;
        }
        .btn-outline:hover { background: #eff6ff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>GED GEM</h1>
        <p>Système de Gestion Électronique des Courriers</p>
        <p>Dématérialisez et centralisez vos courriers administratifs</p>
        <div>
            <a href="/login" class="btn">Se connecter</a>
            <a href="/register" class="btn btn-outline">S'inscrire</a>
        </div>
    </div>
</body>
</html>