#!/bin/bash

# restart_opencode.sh — stops and restarts the opencode service
# Lives in: $VITE_OPENCODE_CONFIG_PATH/restart_opencode.sh
# Reads port/hostname from .env in the appgenius root

# Load .env from appgenius root
APPGENIUS_PATH="${VITE_WORKSPACE_ROOT:-/usr/local/lib/appgenius}"
ENV_FILE="$APPGENIUS_PATH/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

PORT="${VITE_OPENCODE_PORT:-10090}"
HOSTNAME="${VITE_OPENCODE_HOSTNAME:-0.0.0.0}"

pids=$(pgrep -f "opencode serve")
if [ -n "$pids" ]; then
  echo "Stopping opencode (PIDs: $pids)..."
  kill $pids
  sleep 2
  remaining=$(pgrep -f "opencode serve")
  if [ -n "$remaining" ]; then
    echo "Force killing remaining processes..."
    kill -9 $remaining
    sleep 1
  fi
  echo "opencode stopped."
else
  echo "No running opencode process found."
fi

echo "Starting opencode serve --hostname $HOSTNAME --port $PORT --cors..."
cd /tmp/
nohup opencode serve --hostname "$HOSTNAME" --port "$PORT" --cors > /tmp/opencode.log 2>&1 &
echo "opencode started (PID: $!)"
