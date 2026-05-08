#!/bin/bash
set -e

# Use sudo only when not running as root
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

SERVICES_PATH="/usr/local/lib/nodejs"
OPENCODE_CONFIG_PATH="$HOME/.config"
APPGENIUS_PATH="/usr/local/lib/appgenius"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Extract services.tar.gz
echo "[1/4] Extracting services.tar.gz -> $SERVICES_PATH"
$SUDO mkdir -p "$SERVICES_PATH"
$SUDO tar --warning=no-unknown-keyword -xzf "$SCRIPT_DIR/services.tar.gz" -C "$SERVICES_PATH"

# Extract appgenius.tar.gz -> backend + frontend + node_modules
echo "[2/4] Extracting appgenius -> $APPGENIUS_PATH"
cd "$SCRIPT_DIR"
tar --warning=no-unknown-keyword -xzf appgenius.tar.gz

$SUDO mkdir -p "$APPGENIUS_PATH/backend" "$APPGENIUS_PATH/frontend"

tar --warning=no-unknown-keyword -xzf backend.tar.gz
$SUDO cp -r dist "$APPGENIUS_PATH/backend/"
$SUDO cp package.json "$APPGENIUS_PATH/backend/"
rm -rf dist

tar --warning=no-unknown-keyword -xzf appgenius_backend_modules_nodejsv22_centos8.tar.gz
$SUDO cp -r appgenius_backend_modules_nodejsv22_centos8/node_modules "$APPGENIUS_PATH/backend/"
$SUDO cp appgenius_backend_modules_nodejsv22_centos8/package-lock.json "$APPGENIUS_PATH/backend/"
rm -rf appgenius_backend_modules_nodejsv22_centos8

tar --warning=no-unknown-keyword -xzf frontend.tar.gz
$SUDO cp -r dist "$APPGENIUS_PATH/frontend/"
rm -rf dist

$SUDO cp .env.release "$APPGENIUS_PATH/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/backend/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/frontend/.env"
rm -f .env backend.tar.gz frontend.tar.gz

# Extract opencode_config.tar.gz
echo "[3/4] Extracting opencode_config.tar.gz -> $OPENCODE_CONFIG_PATH"
mkdir -p "$OPENCODE_CONFIG_PATH"
tar --warning=no-unknown-keyword -xzf "$SCRIPT_DIR/opencode_config.tar.gz" -C "$OPENCODE_CONFIG_PATH"

if [ -f "$SCRIPT_DIR/scripts/restart_opencode.sh" ]; then
  $SUDO cp "$SCRIPT_DIR/scripts/restart_opencode.sh" "$OPENCODE_CONFIG_PATH/opencode/restart_opencode.sh"
  $SUDO chmod +x "$OPENCODE_CONFIG_PATH/opencode/restart_opencode.sh"
fi

echo "[4/4] Adding nodejs to PATH in ~/.bashrc"
NODE_BIN_LINE='export PATH="/usr/local/lib/nodejs/node-v22.22.2-linux-arm64/bin:$PATH"'
if ! grep -qF "$NODE_BIN_LINE" "$HOME/.bashrc" 2>/dev/null; then
  echo "" >> "$HOME/.bashrc"
  echo "$NODE_BIN_LINE" >> "$HOME/.bashrc"
fi
export PATH="/usr/local/lib/nodejs/node-v22.22.2-linux-arm64/bin:$PATH"

echo ""
echo "=== Deployment Complete ==="
echo " Node.js: $SERVICES_PATH"
echo " AppGenius: $APPGENIUS_PATH"
echo " OpenCode: $OPENCODE_CONFIG_PATH"
echo ""
echo "Run: source ~/.bashrc"
echo ""
echo "Start applications:"
echo " $SCRIPT_DIR/start.sh # Start all"
echo " $SCRIPT_DIR/start.sh backend # Start backend only"
echo " $SCRIPT_DIR/start.sh frontend # Start frontend only"
echo ""
echo "Stop applications:"
echo " $SCRIPT_DIR/stop.sh # Stop all"
