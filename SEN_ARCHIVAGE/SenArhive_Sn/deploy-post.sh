#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Script de post-déploiement — SenArchivage (LWS / hébergement mutualisé)
# Exécuter via SSH après avoir uploadé les fichiers par FTP ou git
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
# Adapter ce chemin à votre hébergement LWS
APP_PATH="/home/senarchivage/laravel_app"
PHP_BIN="php"   # Sur LWS, peut être : php8.2 ou /usr/local/php8.2/bin/php
# ──────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✔] $1${NC}"; }
warn()  { echo -e "${YELLOW}[⚠] $1${NC}"; }
error() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

cd "$APP_PATH" || error "Dossier introuvable : $APP_PATH"

echo ""
echo "══ Post-déploiement SenArchivage ══"
echo ""

echo "─── 1/7 · Lien du stockage ───"
$PHP_BIN artisan storage:link --force 2>/dev/null || warn "storage:link déjà existant"
log "Lien storage OK"

echo "─── 2/7 · Migrations ───"
$PHP_BIN artisan migrate --force
log "Migrations OK"

echo "─── 3/7 · Cache de la configuration ───"
$PHP_BIN artisan config:cache
log "Config mis en cache"

echo "─── 4/7 · Cache des routes ───"
$PHP_BIN artisan route:cache
log "Routes mises en cache"

echo "─── 5/7 · Cache des vues ───"
$PHP_BIN artisan view:cache
log "Vues mises en cache"

echo "─── 6/7 · Cache des événements ───"
$PHP_BIN artisan event:cache
log "Événements mis en cache"

echo "─── 7/7 · Optimisation globale ───"
$PHP_BIN artisan optimize
log "Application optimisée"

echo ""
log "══ Post-déploiement terminé avec succès ! ══"
echo ""
