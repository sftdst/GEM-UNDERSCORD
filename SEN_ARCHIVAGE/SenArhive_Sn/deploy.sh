#!/bin/bash
#==============================================================================
# Script de déploiement complet — SenArchivage
# Exécuter depuis le serveur via SSH :
#   chmod +x deploy.sh && ./deploy.sh
#==============================================================================

set -euo pipefail

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
APP_PATH="/var/www/senarchivage"                       # Chemin de l'application
APP_URL="https://www.senarchive.synapsispharma.com"   # URL de production
GIT_BRANCH="master"                                    # Branche de production
PHP_BIN="php"                                          # ou /usr/bin/php8.2
COMPOSER_BIN="composer"
NPM_BIN="npm"
WEB_USER="www-data"                                   # Utilisateur du serveur web (apache: www-data / nginx: www-data)
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()   { echo -e "${GREEN}[$(date +%H:%M:%S)] ✔  $1${NC}"; }
warn()  { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠  $1${NC}"; }
step()  { echo -e "${CYAN}[$(date +%H:%M:%S)] ── $1${NC}"; }
error() { echo -e "${RED}[$(date +%H:%M:%S)] ✗  $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Déploiement SenArchivage — Production      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_PATH" || error "Dossier introuvable : $APP_PATH"

# ── 1. Vérification de l'environnement ────────────────────────────────────────
step "1/10 · Vérification de l'environnement..."
[ -f ".env" ] || error ".env introuvable — copier .env.example et le configurer"
command -v "$PHP_BIN" >/dev/null 2>&1 || error "PHP non trouvé : $PHP_BIN"
command -v "$COMPOSER_BIN" >/dev/null 2>&1 || error "Composer non trouvé"
command -v "$NPM_BIN" >/dev/null 2>&1 || error "npm non trouvé"
log "Environnement OK"

# ── 2. Maintenance ────────────────────────────────────────────────────────────
step "2/10 · Mise en maintenance (503)..."
$PHP_BIN artisan down --render="errors::503" --retry=60 2>/dev/null || true
log "Application en maintenance"

# ── 3. Mise à jour du code ────────────────────────────────────────────────────
step "3/10 · Récupération du code (git pull $GIT_BRANCH)..."
git fetch --all
git reset --hard "origin/$GIT_BRANCH"
log "Code mis à jour"

# ── 4. Dépendances PHP (production) ──────────────────────────────────────────
step "4/10 · Installation des dépendances PHP..."
$COMPOSER_BIN install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --quiet
log "Dépendances PHP installées"

# ── 5. Build frontend ─────────────────────────────────────────────────────────
step "5/10 · Build des assets frontend (Vite)..."
$NPM_BIN ci --silent
$NPM_BIN run build
log "Assets frontend compilés"

# ── 6. Configuration .env pour la production ──────────────────────────────────
step "6/10 · Configuration de l'environnement production..."

# Basculer en production
sed -i "s|^APP_ENV=.*|APP_ENV=production|" .env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=false|" .env
sed -i "s|^LOG_LEVEL=.*|LOG_LEVEL=error|" .env

# Décommenter ou remplacer APP_URL
if grep -q "^#APP_URL=" .env; then
    sed -i "s|^#APP_URL=.*|APP_URL=$APP_URL|" .env
elif grep -q "^APP_URL=http://localhost" .env; then
    sed -i "s|^APP_URL=http://localhost.*|APP_URL=$APP_URL|" .env
fi

# Utiliser le driver 'database' pour les sessions en production
# (décommentez si vous souhaitez changer de 'file' à 'database')
# sed -i "s|^SESSION_DRIVER=.*|SESSION_DRIVER=database|" .env

log "Environnement configuré pour la production"

# ── 7. Base de données ────────────────────────────────────────────────────────
step "7/10 · Migrations de la base de données..."
$PHP_BIN artisan migrate --force
log "Migrations exécutées"

# ── 8. Stockage ───────────────────────────────────────────────────────────────
step "8/10 · Lien symbolique du stockage..."
$PHP_BIN artisan storage:link --force 2>/dev/null || true
log "Lien storage créé"

# ── 9. Cache & optimisation ───────────────────────────────────────────────────
step "9/10 · Mise en cache et optimisation..."
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache
$PHP_BIN artisan optimize
log "Cache et optimisation appliqués"

# ── 10. Permissions & remise en ligne ─────────────────────────────────────────
step "10/10 · Correction des permissions et remise en ligne..."
chmod -R 775 storage bootstrap/cache
chown -R "$WEB_USER:$WEB_USER" storage bootstrap/cache 2>/dev/null || \
    warn "chown échoué (peut nécessiter sudo)"

$PHP_BIN artisan up
log "Application remise en ligne"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓  Déploiement terminé avec succès !           ║${NC}"
echo -e "${GREEN}║   →  $APP_URL${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
