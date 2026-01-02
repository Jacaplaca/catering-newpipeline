#!/bin/bash
# This script runs on the REMOTE server via ssh to remove dangling Docker images.
# It is safe: it only prunes dangling (untagged) images.

source "$(dirname "$0")/../common/_common_remote.sh"

echo "--- Docker Cleanup Script START ---"

echo "Pruning dangling images..."
docker image prune -f

echo "--- Docker Cleanup Script END ---"


