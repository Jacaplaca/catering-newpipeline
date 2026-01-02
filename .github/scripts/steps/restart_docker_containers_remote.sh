#!/bin/bash
# This script runs on the REMOTE server via ssh and restarts Docker containers.

source "$(dirname "$0")/../common/_common_remote.sh"

# Environment variables passed from the ssh command:
# REPO_NAME: Name of the repository/docker compose project
# DEPLOY_DIR: Absolute path to the deployment directory (where docker-compose.yml is)

echo "--- Docker Containers Restart Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

echo "Restarting Docker containers..."
# Use project name based on REPO_NAME (passed env var)
docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" up -d --remove-orphans

echo "Docker containers restarted successfully."
echo "--- Docker Containers Restart Script END ---" 