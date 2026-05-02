#!/bin/bash

# Stop running opencode processes
pids=$(pgrep -f "opencode serve")
if [ -n "$pids" ]; then
  echo "Stopping opencode (PIDs: $pids)..."
  kill $pids
  sleep 2
  # Force kill if still running
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

# Start opencode
echo "Starting opencode serve --port=10090 --cors..."
cd /tmp/
nohup opencode serve --port=10090 --cors > /tmp/opencode.log 2>&1 &
echo "opencode started (PID: $!)"
