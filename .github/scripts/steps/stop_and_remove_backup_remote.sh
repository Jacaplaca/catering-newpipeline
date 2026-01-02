#!/bin/bash
# This script runs on the REMOTE server via ssh.
# It stops and removes the backup service container so it doesn't run during deploy/app restart.

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Stop & Remove Backup Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

backup_stop

echo "--- Stop & Remove Backup Script END ---"


