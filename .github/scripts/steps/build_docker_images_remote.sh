#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/_common_remote.sh"

log_step "Build Docker images"

echo "==============================================="
echo " Building Docker images for project"
echo "==============================================="

# ------------------------------------------------
# Configuration / assumptions
# ------------------------------------------------

# APP_NAME powinno przychodzić z .env / pipeline
if [ -z "${APP_NAME:-}" ]; then
  echo "ERROR: APP_NAME is not set"
  exit 1
fi

APP_IMAGE="${APP_NAME}_img"

# Use DEPLOY_DIR as the project root
if [ -z "${DEPLOY_DIR:-}" ]; then
  echo "ERROR: DEPLOY_DIR is not set"
  exit 1
fi

cd "$DEPLOY_DIR"

echo "Project directory: $DEPLOY_DIR"

echo "App image name:     $APP_IMAGE"

# ------------------------------------------------
# Build images (this always produces :latest)
# ------------------------------------------------

echo "-----------------------------------------------"
echo " Running docker compose build"
echo "-----------------------------------------------"

_app_compose build app

# ------------------------------------------------
# Versioned image tagging (SAFE / IDPOTENT)
# ------------------------------------------------

# Default to "yes" if not set
SHOULD_DOCKER_VERSION="${SHOULD_DOCKER_VERSION:-yes}"

if [ "$SHOULD_DOCKER_VERSION" = "no" ]; then
  echo "Skipping version tagging as requested (SHOULD_DOCKER_VERSION=no)."
else
  echo "-----------------------------------------------"
  echo " Resolving application version"
  echo "-----------------------------------------------"

  APP_VERSION="$(jq -r '.version' package.json)"

  echo "Detected app version: $APP_VERSION"

  # ------------------------------------------------
  # Tag only if this version does NOT already exist
  # ------------------------------------------------

  if docker image inspect "${APP_IMAGE}:${APP_VERSION}" >/dev/null 2>&1; then
    echo "Image ${APP_IMAGE}:${APP_VERSION} already exists."
    echo "Skipping version tag (probably chore/ci/docs deploy)."
  else
    echo "Tagging image:"
    echo "  ${APP_IMAGE}:latest -> ${APP_IMAGE}:${APP_VERSION}"

    docker tag "${APP_IMAGE}:latest" "${APP_IMAGE}:${APP_VERSION}"

    echo "Versioned image created: ${APP_IMAGE}:${APP_VERSION}"
  fi
fi

echo "-----------------------------------------------"
echo " Docker image build completed"
echo "-----------------------------------------------"

docker image ls "${APP_IMAGE}" --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}"

echo "==============================================="
echo " Build step finished successfully"
echo "==============================================="
