#!/bin/bash
# Shared utilities for remote deployment scripts.
# Intended to be sourced from scripts located in the same directory.

# Always fail fast.
set -e

_common_bool_is_true() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

_common_bool_is_false() {
  case "${1:-}" in
    0|false|FALSE|no|NO|off|OFF) return 0 ;;
    *) return 1 ;;
  esac
}

_common_should_trace() {
  # Global override:
  # - REMOTE_TRACE=1 enables xtrace everywhere
  # - REMOTE_TRACE=0 disables xtrace everywhere
  if _common_bool_is_true "${REMOTE_TRACE:-}"; then
    return 0
  fi
  if _common_bool_is_false "${REMOTE_TRACE:-}"; then
    return 1
  fi

  # Preserve current per-script defaults (based on previously embedded `set -x`).
  # Note: `BASH_SOURCE[1]` is the script that sourced this file.
  case "$(basename -- "${BASH_SOURCE[1]:-}")" in
    build_docker_images_remote.sh|cleanup_post_deploy_remote.sh|start_backup_after_app_remote.sh|stop_and_remove_backup_remote.sh|cleanup_docker_images_remote.sh|apply_migrations_remote.sh)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if _common_should_trace; then
  set -x
fi

log_step() {
  # Usage: log_step "message"
  echo ""
  echo "==> ${1:-}"
}

require_var() {
  # Usage: require_var VAR_NAME ["error message"]
  local var_name="${1:?var name is required}"
  local msg="${2:-Error: ${var_name} environment variable is required}"
  # Indirect expansion to read variable by name.
  if [ -z "${!var_name:-}" ]; then
    echo "$msg" >&2
    exit 1
  fi
}

require_env_file() {
  # Usage: require_env_file /path/to/.env ["error message"]
  local env_path="${1:-.env}"
  local msg="${2:-Error: $env_path file not found.}"
  if [ ! -f "$env_path" ]; then
    echo "$msg" >&2
    exit 1
  fi
}

# ------------------------------------------------
# App naming (single source of truth)
# ------------------------------------------------

# APP_NAME is used for Docker image naming.
# If not explicitly set, default to REPO_NAME.
if [ -z "${APP_NAME:-}" ]; then
  if [ -n "${REPO_NAME:-}" ]; then
    export APP_NAME="${REPO_NAME}"
    echo "APP_NAME not set, using REPO_NAME=${APP_NAME}"
  else
    echo "ERROR: Neither APP_NAME nor REPO_NAME is set"
    exit 1
  fi
fi

cd_deploy_dir() {
  # Usage: cd_deploy_dir
  require_var "DEPLOY_DIR" "DEPLOY_DIR environment variable is required"
  cd "$DEPLOY_DIR" || { echo "Error: Failed to cd into $DEPLOY_DIR" >&2; exit 1; }
}

# --- Backup lifecycle (black box) ---

_backup_service_name() {
  echo "backup"
}

_backup_profile_name() {
  echo "backup"
}

_backup_compose() {
  # Usage: _backup_compose <docker-compose-args...>
  require_var "REPO_NAME" "REPO_NAME environment variable is required"
  docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" --profile "$(_backup_profile_name)" "$@"
}

_app_compose() {
  # Usage: _app_compose <docker-compose-args...>
  require_var "REPO_NAME" "REPO_NAME environment variable is required"
  require_env_file ".env" "Error: .env file not found in $DEPLOY_DIR"
  docker compose \
    --env-file .env \
    -f ./deployment/docker-compose.yml \
    -p "$REPO_NAME" \
    "$@"
}

backup_stop() {
  # Stop/remove backup even if it is under a profile (explicitly enabling profile is harmless here).
  local service_name
  service_name="$(_backup_service_name)"

  log_step "Stopping backup container (if running)..."
  _backup_compose stop "$service_name" || true

  log_step "Removing backup container (if exists)..."
  _backup_compose rm -f "$service_name" || true
}

backup_start() {
  local service_name
  service_name="$(_backup_service_name)"

  log_step "Building backup image..."
  _backup_compose build "$service_name"

  log_step "Starting backup service (force recreate, no deps)..."
  _backup_compose up -d --force-recreate --no-deps "$service_name"
}

# Default initialization for remote scripts.
cd_deploy_dir


