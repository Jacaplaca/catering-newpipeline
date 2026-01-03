#!/bin/bash
# This script runs on the REMOTE server (inside DEPLOY_DIR).
# It checks whether the DB is initialized and deactivates the app (sets Setting app.active=false).

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Check DB (Remote) Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

TOOLS_SERVICE_NAME="dbtools"

require_env_file ".env" "Error: .env file not found in $DEPLOY_DIR. Cannot check database."

echo "Extracting DATABASE_URL from .env file..."
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d "=" -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found or empty in .env file."
  exit 1
fi

echo "Extracted DATABASE_URL (masked):"
printf "%s\n" "$DATABASE_URL" | sed "s/:[^@]*@/:*****@/"

echo "Attempting database connection and settings check..."

MONGOSH_SCRIPT='
  const settingsCount = db.Setting.countDocuments();
  if (settingsCount > 0) {
    print("DATABASE_STATUS=initialized");
    const updateResult = db.Setting.updateOne(
      { group: "app", name: "active" },
      { $set: { value: "false" } }
    );
    if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0 || updateResult.matchedCount > 0) {
       print("Setting updated successfully");
    } else {
       print("Setting found but not updated (maybe value was already false?)");
    }
  } else {
    print("DATABASE_STATUS=empty");
  }
' # End MONGOSH_SCRIPT definition

RESULT=$(echo "$MONGOSH_SCRIPT" | docker exec -i mongodb mongosh "$DATABASE_URL" --quiet)

echo "MongoDB command result:"
echo "$RESULT"

if echo "$RESULT" | grep -q "DATABASE_STATUS=initialized"; then
  echo "✅ Database is initialized."
  if echo "$RESULT" | grep -q "Setting updated successfully"; then
    echo "✅ Setting updated successfully."
  else
    echo "ℹ️ Setting status: No update performed or required."
  fi
elif echo "$RESULT" | grep -q "DATABASE_STATUS=empty"; then
  echo "⚠️ Database is empty. Starting initialization (Schema Push + Seed)..."

  echo "Pushing database schema (Prisma)..."
  docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" --profile tools run --rm --no-deps "$TOOLS_SERVICE_NAME" \
    npx prisma db push --skip-generate

  echo "Seeding database (db:init)..."
  docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" --profile tools run --rm --no-deps "$TOOLS_SERVICE_NAME" \
    npm run db:init

  echo "✅ Database initialized and seeded successfully."
else
  echo "❌ Failed to determine database status or execute command. Check Docker/MongoDB logs on the server."
fi

echo "Database check step finished."
echo "--- Check DB (Remote) Script END ---"


