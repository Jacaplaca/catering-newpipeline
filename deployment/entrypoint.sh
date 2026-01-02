#!/bin/sh
set -e

echo "Starting runtime entrypoint..."

APP_USER="${APP_USER:-nextjs}"
APP_GROUP="${APP_GROUP:-nodejs}"

# Runtime writable dirs
mkdir -p /app/.next/cache/images /app/logs /app/.npm || true

if [ "$(id -u)" = "0" ]; then
  chown -R "${APP_USER}:${APP_GROUP}" \
    /app/.next/cache \
    /app/logs \
    /app/.npm || true
fi

# Drop privileges
if [ "$(id -u)" = "0" ]; then
  exec su-exec "${APP_USER}:${APP_GROUP}" "$@"
fi

exec "$@"
