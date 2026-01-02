#!/bin/bash
# Remote deploy driver. This script runs on the REMOTE server inside DEPLOY_DIR and orchestrates
# existing step scripts (it does not replace or remove them).
#
# Expected env:
# - REPO_NAME
# - DEPLOY_DIR
# - APP_DIR (required only when SHOULD_REBUILD=yes)
# - SHOULD_REBUILD: yes/no (default: yes)
# - SHOULD_DOCKER_VERSION: yes/no (default: yes)

source "$(dirname "$0")/common/_common_remote.sh"

run_step() {
  local label="$1"
  local script="$2"

  if [ "${DEPLOY_PLAN_ONLY:-no}" = "yes" ]; then
    echo "[PLAN] Would run: $script ($label)"
  else
    log_step "$label"
    bash "$script"
  fi
}

echo "--- Deploy Driver Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"
echo "Using SHOULD_REBUILD: ${SHOULD_REBUILD:-yes}"
echo "Using SHOULD_DOCKER_VERSION: ${SHOULD_DOCKER_VERSION:-yes}"

SCRIPT_DIR_ON_REMOTE="${DEPLOY_DIR}/.github/scripts/steps"

if [ "${SHOULD_REBUILD:-yes}" = "yes" ]; then
  echo "Rebuild enabled. Using APP_DIR: ${APP_DIR:?APP_DIR environment variable is required}"

  run_step "Build Docker images" \
    "${SCRIPT_DIR_ON_REMOTE}/build_docker_images_remote.sh"

  run_step "Cleanup dangling Docker images" \
    "${SCRIPT_DIR_ON_REMOTE}/cleanup_docker_images_remote.sh"
else
  log_step "Rebuild disabled. Skipping image build and dangling image cleanup"
fi

run_step "Check Database Status and Deactivate Application" \
  "${SCRIPT_DIR_ON_REMOTE}/check_db_and_deactivate_app.sh"

run_step "Restart containers and wait for app" \
  "${SCRIPT_DIR_ON_REMOTE}/restart_and_wait_for_app_remote.sh"

run_step "Apply database migrations" \
  "${SCRIPT_DIR_ON_REMOTE}/apply_migrations_remote.sh"

run_step "Activate application" \
  "${SCRIPT_DIR_ON_REMOTE}/activate_app_remote.sh"

run_step "Start backup service (after app is ready)" \
  "${SCRIPT_DIR_ON_REMOTE}/start_backup_after_app_remote.sh"

run_step "Post-deploy cleanup" \
  "${SCRIPT_DIR_ON_REMOTE}/cleanup_post_deploy_remote.sh"

echo "--- Deploy Driver Script END ---"
