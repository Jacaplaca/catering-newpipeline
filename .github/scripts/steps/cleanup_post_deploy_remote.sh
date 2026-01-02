#!/bin/bash
# This script runs on the REMOTE server via ssh after the deployment is complete.
# It removes dangling images and also removes the dbtools image which is only needed for migrations.

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Post-Deploy Docker Cleanup Script START ---"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

if [ ! -f .env ]; then
  echo "Warning: .env file not found in $DEPLOY_DIR. Skipping dbtools image removal."
else
  APP_NAME=$(grep "^APP_NAME=" .env | cut -d "=" -f2- | tr -d '"' | tr -d "'")
  if [ -n "$APP_NAME" ]; then
    DBTOOLS_IMAGE="${APP_NAME}_dbtools_img"
    echo "Attempting to remove dbtools image: $DBTOOLS_IMAGE"
    docker image inspect "$DBTOOLS_IMAGE" >/dev/null 2>&1 && docker rmi -f "$DBTOOLS_IMAGE" || true
  else
    echo "Warning: APP_NAME not found in .env. Skipping dbtools image removal."
  fi
fi

echo "Pruning dangling images..."
docker image prune -f

echo "--- Post-Deploy Docker Cleanup Script END ---"


