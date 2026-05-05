# Guide de déploiement — SenArchivage (LWS)

**URL de production** : https://www.senarchive.synapsispharma.com
**Base de données** : PostgreSQL sur `185.124.202.73`
**Hébergement** : LWS (mutualisé)

---

## Étapes de déploiement

### 1. Préparation locale (sur votre machine Windows)

```bash
# Compiler les assets frontend
npm run build
```

> Les fichiers compilés se trouvent dans `public/build/` et doivent être uploadés sur le serveur.

---

### 2. Upload des fichiers sur LWS (via FTP)

Uploadez **tous les fichiers du projet** sauf les dossiers suivants (inutiles ou trop lourds) :

| Dossier / Fichier        | Action              |
|--------------------------|---------------------|
| `node_modules/`          | ❌ Ne pas uploader  |
| `.git/`                  | ❌ Ne pas uploader  |
| `.env` (local)           | ❌ Ne pas uploader  |
| `vendor/` (optionnel)    | ✅ Uploader OU installer via SSH |
| `public/build/`          | ✅ Uploader (compilé ci-dessus) |
| Tous les autres fichiers | ✅ Uploader         |

**Logiciel FTP recommandé** : FileZilla, WinSCP
**Répertoire cible LWS** : `/home/[votre-user]/laravel_app/`
**Document root LWS** : Pointer vers `/home/[votre-user]/laravel_app/public/`

---

### 3. Configurer l'environnement sur le serveur LWS

Via FTP, uploadez le fichier `.env` sur le serveur (ou créez-en un à partir de `.env.example`).

> ⚠️ Le fichier `.env` ne doit JAMAIS être accessible publiquement.

**Variables critiques à vérifier avant déploiement :**

```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
APP_URL=https://www.senarchive.synapsispharma.com

# PayDunya LIVE (récupérer dans Dashboard PayDunya > Settings > API Keys)
PAYDUNYA_SANDBOX=false
PAYDUNYA_MASTER_KEY=<votre-master-key-live>
PAYDUNYA_PRIVATE_KEY=<votre-private-key-live>
PAYDUNYA_PUBLIC_KEY=<votre-public-key-live>
PAYDUNYA_TOKEN=<votre-token-live>

# Tesseract OCR (chemin complet si hors du PATH)
TESSERACT_BINARY=/usr/bin/tesseract
TESSERACT_LANG=fra+eng
```

**Installer Tesseract sur le serveur Linux :**
```bash
apt install tesseract-ocr tesseract-ocr-fra tesseract-ocr-eng
which tesseract  # pour récupérer le chemin
```

---

### 4. Installation des dépendances PHP (via SSH)

Connectez-vous en SSH au serveur LWS :

```bash
ssh [votre-user]@[votre-serveur-lws]
```

Puis installez les dépendances Composer :

```bash
cd /home/[votre-user]/laravel_app

# Installer les dépendances PHP (sans les paquets de développement)
composer install --no-dev --optimize-autoloader --no-interaction
```

> Si Composer n'est pas disponible sur LWS, uploadez le dossier `vendor/` via FTP depuis votre machine locale.

---

### 5. Lancer le script de post-déploiement

```bash
cd /home/[votre-user]/laravel_app

# Rendre le script exécutable
chmod +x deploy-post.sh

# Adapter le chemin APP_PATH dans deploy-post.sh si besoin
# Puis l'exécuter :
./deploy-post.sh
```

Ce script exécute dans l'ordre :
1. `storage:link` — lien symbolique pour les fichiers publics
2. `migrate --force` — migrations de base de données
3. `config:cache` — mise en cache de la configuration
4. `route:cache` — mise en cache des routes
5. `view:cache` — mise en cache des vues
6. `event:cache` — mise en cache des événements
7. `optimize` — optimisation globale

---

### 6. Vérifications post-déploiement

Après le déploiement, vérifiez :

- [ ] L'application est accessible : https://www.senarchive.synapsispharma.com
- [ ] La connexion fonctionne (login utilisateur et superadmin)
- [ ] L'upload de documents fonctionne
- [ ] La base de données est connectée (dashboard visible)
- [ ] L'envoi d'emails fonctionne (test depuis Paramètres → Email)
- [ ] Les logs ne contiennent pas d'erreurs : `storage/logs/laravel.log`

---

## Mises à jour ultérieures

Pour mettre à jour l'application après une modification du code :

### A. Si le code a changé côté frontend (React/TypeScript)

```bash
# 1. Localement : recompiler les assets
npm run build

# 2. Uploader public/build/ via FTP

# 3. Sur le serveur SSH (si PHP a changé aussi) :
./deploy-post.sh
```

### B. Si seul le code PHP a changé (pas de frontend)

```bash
# 1. Uploader les fichiers PHP modifiés via FTP

# 2. Sur le serveur SSH :
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force   # si nouvelles migrations
```

---

## Arborescence des fichiers sur LWS

```
/home/[votre-user]/
├── laravel_app/          ← Répertoire de l'application
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/           ← Document root (pointer LWS ici)
│   │   ├── build/        ← Assets compilés (Vite)
│   │   ├── storage → ../storage/app/public  ← Lien symbolique
│   │   └── index.php
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   │   └── logs/
│   │       └── laravel.log
│   ├── vendor/
│   ├── .env              ← Fichier de configuration (depuis .env.production)
│   ├── deploy-post.sh
│   └── ...
```

---

## Résolution de problèmes courants

| Problème | Solution |
|----------|----------|
| Page blanche | Vérifier `storage/logs/laravel.log` |
| Erreur 500 | Désactiver temporairement `APP_DEBUG=true` pour voir l'erreur |
| Assets CSS/JS manquants | Re-uploader `public/build/` |
| Erreur de base de données | Vérifier `DB_HOST`, `DB_PASSWORD` dans `.env` |
| Erreur de permissions | `chmod -R 775 storage bootstrap/cache` |
| `storage:link` échoue | Supprimer `public/storage` puis relancer |
| Emails non envoyés | Vérifier la config SMTP dans `.env` et les logs |

---

## Fichiers créés pour le déploiement

| Fichier | Description |
|---------|-------------|
| `.env.production` | Configuration de production (à uploader sur LWS comme `.env`) |
| `deploy-post.sh` | Script de post-déploiement à exécuter via SSH |
| `deploy.sh` | Script de déploiement complet pour VPS (si VPS) |
| `nginx/senarchivage.conf` | Configuration Nginx (si VPS avec Nginx) |
| `public/build/` | Assets frontend compilés (à uploader via FTP) |
