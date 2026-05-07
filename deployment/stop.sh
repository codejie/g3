#!/bin/bash

APPGENIUS_PATH="/usr/local/lib/appgenius/"
PID_DIR="$APPGENIUS_PATH"

stop_by_pid() {
  local name="$1"
  local pidfile="$PID_DIR/${name}.pid"
  if [ ! -f "$pidfile" ]; then
    echo "$name not running (no pid file)"
    return 0
  fi
  local pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "$name stopped (PID $pid)"
  else
    echo "$name not running (stale pid $pid)"
  fi
  rm -f "$pidfile"
}

stop_opencode() {
  stop_by_pid "opencode"
}

stop_backend() {
  stop_by_pid "backend"
}

stop_frontend() {
  stop_by_pid "frontend"
}

case "${1:-all}" in
  opencode) stop_opencode ;;
  backend)  stop_backend ;;
  frontend) stop_frontend ;;
  all)      stop_frontend; stop_backend; stop_opencode ;;
  *)        echo "Usage: $0 {opencode|backend|frontend|all}" ;;
esac
