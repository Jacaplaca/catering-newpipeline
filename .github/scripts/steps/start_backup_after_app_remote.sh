#!/bin/bash
# This script runs on the REMOTE server via ssh.
# It rebuilds (if needed) and starts the backup service only after the main app is healthy.

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Start Backup After App Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

backup_start

echo "--- Start Backup After App Script END ---"


