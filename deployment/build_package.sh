#!/bin/bash
set -e

[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== AppGenius Deployment Build ==="
echo "Project: $PROJECT_DIR"
echo "Output: $SCRIPT_DIR"
echo ""

# Clean previous artifacts
rm -f "$SCRIPT_DIR"/backend.tar.gz "$SCRIPT_DIR"/frontend.tar.gz "$SCRIPT_DIR"/appgenius.tar.gz

# 1. Build backend
echo "[1/4] Building backend..."
cd "$PROJECT_DIR/backend"
npm run build:deploy

# 2. Package backend.tar.gz (dist/ + package.json)
echo "[2/4] Packaging backend.tar.gz..."
cd "$PROJECT_DIR/backend"
tar -czf "$SCRIPT_DIR/backend.tar.gz" dist package.json

# 3. Build frontend
echo "[3/4] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm run build

# 4. Package frontend.tar.gz (dist/)
echo "[4/4] Packaging frontend.tar.gz..."
cd "$PROJECT_DIR/frontend"
tar -czf "$SCRIPT_DIR/frontend.tar.gz" dist

# 5. Package appgenius.tar.gz
echo "Packaging appgenius.tar.gz..."
cd "$SCRIPT_DIR"
tar -czf appgenius.tar.gz \
-C "$SCRIPT_DIR" backend.tar.gz frontend.tar.gz \
-C "$PROJECT_DIR" .env.release \
-C "$PROJECT_DIR" scripts

# Clean intermediate tarballs
rm -f "$SCRIPT_DIR"/backend.tar.gz "$SCRIPT_DIR"/frontend.tar.gz

echo ""
echo "=== Done ==="
echo "Output: $SCRIPT_DIR/appgenius.tar.gz"
ls -lh "$SCRIPT_DIR/appgenius.tar.gz"
