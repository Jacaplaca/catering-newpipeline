#!/bin/bash
# This script runs on the REMOTE server via ssh.
# It first restarts Docker containers and then waits for the application container to become healthy.

source "$(dirname "$0")/../common/_common_remote.sh"

# Environment variables passed from the ssh command:
# REPO_NAME: Name of the repository/docker compose project
# DEPLOY_DIR: Absolute path to the deployment directory (where docker-compose.yml is)

echo "--- Restart and Wait for App Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

# Define the directory where the other scripts are located on the remote server
# This assumes this script (restart_and_wait_for_app_remote.sh) is in the same .github/scripts/steps directory
# as the scripts it calls, once deployed.
SCRIPT_DIR_ON_REMOTE="${DEPLOY_DIR}/.github/scripts/steps"

echo "Stopping/removing backup (so it doesn't run during deploy)..."
bash "${SCRIPT_DIR_ON_REMOTE}/stop_and_remove_backup_remote.sh"

echo "Executing restart_docker_containers_remote.sh..."
# Pass current environment variables (including REPO_NAME, DEPLOY_DIR) to the sub-script
bash "${SCRIPT_DIR_ON_REMOTE}/restart_docker_containers_remote.sh"

echo "Executing wait_for_app_remote.sh..."
# Pass current environment variables (including REPO_NAME, DEPLOY_DIR) to the sub-script
bash "${SCRIPT_DIR_ON_REMOTE}/wait_for_app_remote.sh"

echo "--- Restart and Wait for App Script END ---" 