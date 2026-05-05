# Guide Déploiement SenArhive sur LWS Mutualisé

## Structure à créer sur le serveur LWS (via FTP)

```
/home/login-lws/                ← racine FTP
├── senarchive/                 ← dossier Laravel (tout sauf public/)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                   ← contenu de .env.production
│   └── ...
└── public_html/               ← dossier web visible (ou www/ selon LWS)
    ├── index.php              ← fichier modifié (voir ci-dessous)
    ├── .htaccess              ← copié depuis public/.htaccess
    ├── favicon.ico
    ├── favicon.png
    └── build/                 ← copié depuis public/build/
        ├── manifest.json
        └── assets/
```

---

## Étapes FTP (FileZilla ou cPanel)

### 1. Créer le dossier `senarchive` sur le serveur
Via FTP : créer `/home/login-lws/senarchive/`

### 2. Uploader le code Laravel dans `senarchive/`
Uploader ces dossiers/fichiers (PAS node_modules, PAS .git) :
- `app/`
- `bootstrap/`
- `config/`
- `database/`
- `resources/views/` (seulement views, pas js/css)
- `routes/`
- `storage/` (vide sauf structure)
- `vendor/`
- `artisan`
- `composer.json`
- `composer.lock`

### 3. Créer le `.env` sur le serveur
Uploader le fichier `.env.production` renommé en `.env` dans `senarchive/`

### 4. Uploader les assets dans `public_html/`
Copier depuis le dossier local `public/` vers `public_html/` :
- `public/build/` → `public_html/build/`
- `public/.htaccess` → `public_html/.htaccess`
- `public/favicon.ico` → `public_html/favicon.ico`
- `public/favicon.png` → `public_html/favicon.png`
- `public/storage/` → `public_html/storage/` (si photos uploadées)

### 5. Remplacer `index.php` dans `public_html/`
Uploader le fichier `index.php` de ce dossier (`deployment_lws/index.php`)
vers `public_html/index.php` — IL REMPLACE L'ORIGINAL.

### 6. Permissions des dossiers (cPanel → File Manager)
Donner les permissions 755 à :
- `senarchive/storage/`
- `senarchive/bootstrap/cache/`
- Tous les sous-dossiers de `storage/`

### 7. Lancer les migrations
Depuis votre machine locale (la base de données est accessible à 185.124.202.73) :
```bash
php artisan migrate --force --env=production
```

---

## Vérification .htaccess
Le fichier `public_html/.htaccess` doit contenir (original Laravel) :
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## Si LWS nécessite PHP 8.2+
Dans cPanel → PHP Selector : choisir PHP 8.2 ou 8.3

## En cas d'erreur 500
Activer temporairement APP_DEBUG=true dans le `.env` sur le serveur
pour voir l'erreur, puis remettre false.
