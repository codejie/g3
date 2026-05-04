#!/bin/bash
set -e

# Use sudo only when not running as root
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

SERVICES_PATH="/usr/local/lib/nodejs/"
OPENCODE_CONFIG_PATH="$HOME/.config/"
APPGENIUS_PATH="/usr/local/lib/appgenius/"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 4. Extract services.tar.gz
echo "[1/6] Extracting services.tar.gz -> $SERVICES_PATH"
$SUDO mkdir -p "$SERVICES_PATH"
$SUDO tar -xzf "$SCRIPT_DIR/services.tar.gz" -C "$SERVICES_PATH"

# 5. Extract appgenius.tar.gz -> backend + frontend to APPGENIUS_PATH
echo "[2/6] Extracting appgenius.tar.gz -> $APPGENIUS_PATH"
cd "$SCRIPT_DIR"
tar -xzf appgenius.tar.gz

$SUDO mkdir -p "$APPGENIUS_PATH/backend" "$APPGENIUS_PATH/frontend"

tar -xzf backend.tar.gz
$SUDO mv dist "$APPGENIUS_PATH/backend/"
$SUDO mv package.json "$APPGENIUS_PATH/backend/"
rm -rf dist

tar -xzf appgenius_backend_modules_nodejs_v22_centos8.tar.gz
$SUDO mv appgenius_backend_modules_nodejs_v22_centos8/node_modules "$APPGENIUS_PATH/backend/"
$SUDO mv appgenius_backend_modules_nodejs_v22_centos8/package-lock.json "$APPGENIUS_PATH/backend/"
rm -rf appgenius_backend_modules_nodejs_v22_centos8

tar -xzf frontend.tar.gz
$SUDO mv dist/* "$APPGENIUS_PATH/frontend/"
rm -rf dist

$SUDO cp .env "$APPGENIUS_PATH/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/backend/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/frontend/.env"
rm -f .env backend.tar.gz frontend.tar.gz

# 6. Extract config.tar.gz -> OPENCODE_CONFIG_PATH
echo "[3/6] Extracting config.tar.gz -> $OPENCODE_CONFIG_PATH"
mkdir -p "$OPENCODE_CONFIG_PATH"
tar -xzf "$SCRIPT_DIR/config.tar.gz" -C "$OPENCODE_CONFIG_PATH"

# 7. Add nodejs bin to PATH in ~/.bashrc
echo "[4/6] Adding nodejs to PATH in ~/.bashrc"
NODE_BIN_LINE='export PATH="/usr/local/lib/nodejs/node-v22.22.2-linux-arm64/bin:$PATH"'
if ! grep -qF "$NODE_BIN_LINE" "$HOME/.bashrc" 2>/dev/null; then
  echo "" >> "$HOME/.bashrc"
  echo "$NODE_BIN_LINE" >> "$HOME/.bashrc"
fi

echo ""
echo "=== Deployment Complete ==="
echo " Node.js: $SERVICES_PATH"
echo " AppGenius: $APPGENIUS_PATH"
echo " OpenCode: $OPENCODE_CONFIG_PATH"
echo ""
echo "Next steps:"
echo " 1. Reload shell: source ~/.bashrc"
echo " 2. Install backend deps: cd $APPGENIUS_PATH/backend && ${SUDO:-sudo} npm install --omit=dev"
echo " 3. Start backend: cd $APPGENIUS_PATH/backend && node dist/index.js"
echo " 4. Start frontend: serve $APPGENIUS_PATH/frontend with nginx/other static server"
