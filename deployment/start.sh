#!/bin/bash

source ~/.bashrc

APPGENIUS_PATH="/usr/local/lib/appgenius/"
PID_DIR="$APPGENIUS_PATH"

load_env() {
  local env_file="$APPGENIUS_PATH/.env"
  if [ -f "$env_file" ]; then
    set -a
    . "$env_file"
    set +a
  fi
}

load_env

generate_frontend_config() {
  local config_file="$APPGENIUS_PATH/frontend/dist/config.js"
  {
    echo '// Auto-generated runtime config from .env'
    echo 'window.__APP_CONFIG__ = {'
    for var in VITE_OPENCODE_PORT VITE_OPENCODE_URL VITE_BACKEND_PORT VITE_BACKEND_URL \
    VITE_FRONTEND_PORT VITE_DATABASE_FILE VITE_WORKSPACE_ROOT \
    VITE_INIT_AGENT_MODE VITE_AGENT_BUILD VITE_AGENT_PLAN VITE_HIDE_THINKING \
    VITE_OPENCODE_CONFIG_PATH VITE_OPENCODE_SKILLS_PATH VITE_BACKEND_TEMPORARY_PATH; do
      if [ -n "${!var:-}" ]; then
        echo "  ${var}: \"${!var}\","
      fi
    done
    echo '};'
  } > "$config_file"
}

start_opencode() {
  if [ -f "$PID_DIR/opencode.pid" ] && kill -0 "$(cat "$PID_DIR/opencode.pid")" 2>/dev/null; then
    echo "OpenCode already running (PID $(cat "$PID_DIR/opencode.pid"))"
    return 1
  fi
  local port="${VITE_OPENCODE_PORT:-10090}"
  nohup opencode serve --hostname 0.0.0.0 --port "$port" --cors > "$APPGENIUS_PATH/opencode.log" 2>&1 &
  echo $! > "$PID_DIR/opencode.pid"
  echo "OpenCode started on port $port (PID $(cat "$PID_DIR/opencode.pid"))"
}

start_backend() {
  if [ -f "$PID_DIR/backend.pid" ] && kill -0 "$(cat "$PID_DIR/backend.pid")" 2>/dev/null; then
    echo "Backend already running (PID $(cat "$PID_DIR/backend.pid"))"
    return 1
  fi
  cd "$APPGENIUS_PATH/backend"
  local port="${VITE_BACKEND_PORT:-10089}"
  VITE_BACKEND_PORT="$port" nohup node dist/index.js > "$APPGENIUS_PATH/backend.log" 2>&1 &
  echo $! > "$PID_DIR/backend.pid"
  echo "Backend started on port $port (PID $(cat "$PID_DIR/backend.pid"))"
}

start_frontend() {
  if [ -f "$PID_DIR/frontend.pid" ] && kill -0 "$(cat "$PID_DIR/frontend.pid")" 2>/dev/null; then
    echo "Frontend already running (PID $(cat "$PID_DIR/frontend.pid"))"
    return 1
  fi
  generate_frontend_config
  cd "$APPGENIUS_PATH/frontend"
  local port="${VITE_FRONTEND_PORT:-10091}"
  nohup vite --host 0.0.0.0 --port "$port" dist > "$APPGENIUS_PATH/frontend.log" 2>&1 &
  echo $! > "$PID_DIR/frontend.pid"
  echo "Frontend started on port $port (PID $(cat "$PID_DIR/frontend.pid"))"
}

case "${1:-all}" in
opencode) start_opencode ;;
backend) start_backend ;;
frontend) start_frontend ;;
restart_opencode)
  OPENCODE_CONFIG_DIR="${VITE_OPENCODE_CONFIG_PATH:-$HOME/.config/opencode}"
  if [ -f "$OPENCODE_CONFIG_DIR/restart_opencode.sh" ]; then
    bash "$OPENCODE_CONFIG_DIR/restart_opencode.sh"
  else
    echo "restart_opencode.sh not found at $OPENCODE_CONFIG_DIR/restart_opencode.sh"
    exit 1
  fi
  ;;
all) start_opencode; start_backend; start_frontend ;;
*) echo "Usage: $0 {opencode|backend|frontend|restart_opencode|all}" ;;
esac
