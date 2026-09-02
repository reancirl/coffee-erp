#!/usr/bin/env bash
#
# Staging deploy. Safe to run by hand over SSH or from CI; it does the same
# thing either way and can be re-run without harm.
#
#   ./deploy.sh
#
# Override anything with the environment:
#   APP_DIR=/var/www/swiftly/coffee-erp DEPLOY_BRANCH=develop ./deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/swiftly/coffee-erp}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"
PHP_FPM="${PHP_FPM:-php8.4-fpm}"
BUILD_ASSETS="${BUILD_ASSETS:-1}"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

cd "$APP_DIR"

# Refuse to deploy into the wrong tree. Without this a mistyped APP_DIR
# quietly reinstalls the production checkout.
[ -f artisan ] || { echo "No artisan in $APP_DIR — wrong directory."; exit 1; }

say "Fetching $DEPLOY_BRANCH"
git fetch --prune origin "$DEPLOY_BRANCH"

BEFORE="$(git rev-parse HEAD)"
AFTER="$(git rev-parse "origin/$DEPLOY_BRANCH")"

if [ "$BEFORE" = "$AFTER" ]; then
    echo "Already at $BEFORE — nothing to deploy."
    exit 0
fi

echo "$BEFORE -> $AFTER"
git log --oneline "$BEFORE..$AFTER" | sed 's/^/    /'

# Anything uncommitted on the server is a mistake someone made by hand.
# Say so rather than clobbering it silently.
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Uncommitted changes in $APP_DIR. Commit, stash, or discard them first."
    exit 1
fi

say "Maintenance mode"
php artisan down --retry=15 || true
# However this exits, bring the site back up.
trap 'php artisan up || true' EXIT

say "Checking out $AFTER"
git checkout --quiet "$DEPLOY_BRANCH"
git reset --hard --quiet "origin/$DEPLOY_BRANCH"

say "PHP dependencies"
composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader

if [ "$BUILD_ASSETS" = "1" ]; then
    say "Frontend assets"
    # npm ci on a small box can be killed by the OOM reaper. If that happens,
    # add swap or set BUILD_ASSETS=0 and ship public/build from CI instead.
    npm ci --no-audit --no-fund
    npm run build
fi

say "Migrations"
# --force because there is no TTY here. A migration that guards itself (the
# users.roles drop, for one) will abort the deploy rather than destroy data,
# which is the intent.
php artisan migrate --force

say "Caches"
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

say "Permissions"
# Files arriving from git are owned by the deploy user; php-fpm writes as
# www-data, so the group needs write on everything it touches.
chmod -R ug+rw storage bootstrap/cache
[ -f database/database.sqlite ] && chmod ug+rw database/database.sqlite

if command -v systemctl >/dev/null && systemctl is-active --quiet "$PHP_FPM"; then
    say "Reloading $PHP_FPM"
    # Needs a passwordless sudo rule; skipped rather than failed without one.
    sudo -n systemctl reload "$PHP_FPM" 2>/dev/null || echo "  (no sudo rule; skipped)"
fi

say "Deployed $(git rev-parse --short HEAD)"
