#!/bin/bash
# This script runs on the REMOTE server via ssh to apply database migrations.

source "$(dirname "$0")/../common/_common_remote.sh"

# Environment variables passed from the ssh command:
# REPO_NAME: Name of the repository/docker compose project
# DEPLOY_DIR: Absolute path to the deployment directory (where docker-compose.yml is)

echo "--- Apply Migrations Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

TOOLS_SERVICE_NAME="dbtools"
echo "Using TOOLS_SERVICE_NAME: $TOOLS_SERVICE_NAME"

require_env_file ".env" "Error: .env file not found in $DEPLOY_DIR. Cannot apply migrations properly."

echo "Applying database schema changes (Prisma db push) using tools container..."
docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" --profile tools run --rm --no-deps "$TOOLS_SERVICE_NAME" \
  npx prisma db push --skip-generate

echo "Running post-migration data script (npm run db:post-migration) using tools container..."
docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" --profile tools run --rm --no-deps "$TOOLS_SERVICE_NAME" \
  npm run db:post-migration

echo "Database migrations applied successfully."
echo "--- Apply Migrations Script END ---" 