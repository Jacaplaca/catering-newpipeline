#!/bin/bash
# This script runs on the REMOTE server via ssh and waits for a service container to become healthy.

source "$(dirname "$0")/../common/_common_remote.sh"

# Environment variables passed from the ssh command:
# REPO_NAME: Name of the repository/docker compose project
# DEPLOY_DIR: Absolute path to the deployment directory (where docker-compose.yml is)
# Optional: WAIT_TIMEOUT, WAIT_INTERVAL

echo "--- Wait for App Health Script START ---"
echo "Using REPO_NAME: ${REPO_NAME:?REPO_NAME environment variable is required}"
echo "Using DEPLOY_DIR: ${DEPLOY_DIR:?DEPLOY_DIR environment variable is required}"

# Service name in docker-compose.yml (assuming it's consistently 'app')
SERVICE_NAME="app"
echo "Using SERVICE_NAME: $SERVICE_NAME"

# Configuration for waiting mechanism
# Consider Dockerfile HEALTHCHECK settings (start-period, interval, retries) when setting MAX_WAIT
MAX_WAIT=${WAIT_TIMEOUT:-180} # Default 180 seconds (increased from 120), override via WAIT_TIMEOUT env var
WAIT_INTERVAL=${WAIT_INTERVAL:-5} # Default 5 seconds, override via WAIT_INTERVAL env var
ELAPSED_TIME=0

echo "Waiting up to ${MAX_WAIT}s for service '$SERVICE_NAME' container to report healthy status..."

# --- Get Container ID ---
echo "Attempting to find the container ID for service '$SERVICE_NAME'..."
CONTAINER_ID=""

# Short pause allowing docker compose ps to reliably find the new container ID
echo "Waiting 5s for container '$SERVICE_NAME' to be listed by docker compose..."
sleep 5

# Get the container ID for the specified service within the project
CONTAINER_ID=$(docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" ps -q "$SERVICE_NAME")

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: Could not find running container for service '$SERVICE_NAME' in project '$REPO_NAME'."
  echo "Attempting to list all containers for project '$REPO_NAME':"
  docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" ps -a || echo "Failed to list containers."
  echo "Attempting to show logs for service '$SERVICE_NAME':"
  docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" logs "$SERVICE_NAME" || echo "Failed to get logs."
  exit 1
fi
echo "Found container ID for '$SERVICE_NAME': $CONTAINER_ID"
# --- End Get Container ID ---


# --- Wait for Health Status ---
echo "Waiting for container '$CONTAINER_ID' health status to become 'healthy'..."

while true; do
  # Inspect the container's health status. Handle cases where health check might not be configured.
  HEALTH_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no health check{{end}}' "$CONTAINER_ID")

  case "$HEALTH_STATUS" in
    "healthy")
      echo "✅ Service '$SERVICE_NAME' (Container: $CONTAINER_ID) is healthy."
      echo "--- Wait for App Health Script END ---"
      exit 0
      ;;
    "unhealthy")
      echo "⚠️ Service '$SERVICE_NAME' (Container: $CONTAINER_ID) reported unhealthy. Waiting for recovery or timeout..."
      # Continue loop, Docker HEALTHCHECK retries might eventually lead to healthy. Timeout will catch permanent failure.
      ;;
    "starting")
      echo "⏳ Service '$SERVICE_NAME' (Container: $CONTAINER_ID) health check is starting. Waiting..."
      ;;
    "no health check")
      echo "❌ Error: Container '$CONTAINER_ID' does not have a health check configured in its image."
      echo "Cannot wait based on health status. Please add a HEALTHCHECK instruction to the Dockerfile."
      exit 1
      ;;
    *)
      echo "❓ Unknown health status '$HEALTH_STATUS' for container '$CONTAINER_ID'. Waiting..."
      ;;
  esac

  # Check for timeout
  ELAPSED_TIME=$((ELAPSED_TIME + WAIT_INTERVAL))
  if [ $ELAPSED_TIME -ge $MAX_WAIT ]; then
    echo "❌ Error: Timeout waiting for service '$SERVICE_NAME' (Container: $CONTAINER_ID) to become healthy after ${MAX_WAIT}s."
    echo "Final reported health status: '$HEALTH_STATUS'"
    echo "--- Dumping diagnostic information ---"
    echo "> docker compose logs $SERVICE_NAME:"
    docker compose --env-file .env -f ./deployment/docker-compose.yml -p "$REPO_NAME" logs "$SERVICE_NAME" || echo "Failed to get logs."
    echo "> docker inspect $CONTAINER_ID:"
    docker inspect "$CONTAINER_ID" || echo "Failed to inspect container."
    echo "--- End diagnostic information ---"
    exit 1
  fi

  # Wait before next check
  echo "Current status: '$HEALTH_STATUS'. Waiting $WAIT_INTERVAL seconds... ($ELAPSED_TIME/$MAX_WAIT)"
  sleep $WAIT_INTERVAL
done

# Should not be reached
exit 1 