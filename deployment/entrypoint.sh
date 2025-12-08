#!/bin/sh
set -e

# Funkcja logująca z datą
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting entrypoint script..."

# Eksport wersji aplikacji (jeśli .version istnieje)
if [ -f .version ]; then
  export APP_VERSION=$(cat .version)
  log "App version: $APP_VERSION"
fi

log "Running database migrations and updates..."

# Uruchamiamy operacje na bazie danych
# Używamy || exit 1, aby zatrzymać kontener w przypadku błędu
npx prisma db push || { log "Prisma db push failed"; exit 1; }
npm run db:init || { log "DB init failed"; exit 1; }
npm run db:update || { log "DB update failed"; exit 1; }

log "Database operations completed successfully."

# Uruchamiamy główną komendę (przekazaną w CMD w Dockerfile lub domyślnie node server.js)
log "Starting application..."
exec "$@"

