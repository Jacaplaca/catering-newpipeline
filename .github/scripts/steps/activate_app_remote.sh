#!/bin/bash
# This script runs on the REMOTE server (inside DEPLOY_DIR) and activates the application:
# - sets Setting { group: "app", name: "active" } to "true" if currently "false"
# - calls an activation endpoint to refresh cache

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Activate App (Remote) Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

require_env_file ".env" "Error: .env file not found in $DEPLOY_DIR. Cannot activate application."

echo "Extracting DATABASE_URL from .env file..."
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d "=" -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found or empty in .env file."
  exit 1
fi

echo "Extracted DATABASE_URL (masked):"
printf "%s\n" "$DATABASE_URL" | sed "s/:[^@]*@/:*****@/"

echo "Extracting PORT from .env file..."
PORT=$(grep "^PORT=" .env | cut -d "=" -f2- | tr -d '"' | tr -d "'")

if [ -z "$PORT" ]; then
  echo "Error: PORT not found or empty in .env file."
  exit 1
fi

echo "Extracted PORT: $PORT"

ENDPOINT_PATH="/api/trpc/settings.cacheAppActive"
ACTIVATION_URL="http://localhost:$PORT$ENDPOINT_PATH"

echo "Activation URL: $ACTIVATION_URL"
echo "Attempting to activate application (setting active=true if currently false)..."

MONGOSH_SCRIPT='
  const updateResult = db.Setting.updateOne(
    { group: "app", name: "active", value: "false" },
    { $set: { value: "true" } }
  );

  if (updateResult.modifiedCount > 0) {
     print("ACTIVATION_STATUS=success");
  } else if (updateResult.matchedCount > 0) {
     print("ACTIVATION_STATUS=already_active_or_not_false");
  } else {
     print("ACTIVATION_STATUS=setting_not_found_or_not_false");
  }
' # End MONGOSH_SCRIPT definition

RESULT=$(echo "$MONGOSH_SCRIPT" | docker exec -i mongodb mongosh "$DATABASE_URL" --quiet)

echo "MongoDB command result:"
echo "$RESULT"

if echo "$RESULT" | grep -q "ACTIVATION_STATUS=success"; then
  echo "✅ Application activated successfully (active set to true)."

  echo "Calling application activation endpoint: $ACTIVATION_URL"
  curl -fsS -X GET "$ACTIVATION_URL" || echo "Warning: Failed to call activation endpoint $ACTIVATION_URL. Curl exit code: $?. Check application logs."

elif echo "$RESULT" | grep -q "ACTIVATION_STATUS=already_active_or_not_false"; then
  echo "ℹ️ Application setting 'active' was not 'false'. No update performed."
elif echo "$RESULT" | grep -q "ACTIVATION_STATUS=setting_not_found_or_not_false"; then
  echo "ℹ️ Setting { group: \"app\", name: \"active\", value: \"false\" } not found. No update performed."
else
  echo "❌ Failed to determine activation status or execute command. Check Docker/MongoDB logs on the server."
fi

echo "Application activation step finished."
echo "--- Activate App (Remote) Script END ---"


