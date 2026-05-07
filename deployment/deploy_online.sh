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

# ── Prerequisites ──
echo "AppGenius requires:"
echo "  Node.js  v22+   (bundled in this package)"
echo "  Python   v3.9+  (yum install python3.9)"
echo "  GLIBC    2.28+  (CentOS 8+)"
echo "  GCC      8.5.0+ (yum install -y make gcc gcc-c++)"
echo ""
echo "Press any key to check prerequisites..."
read -n 1 -s -r

CHECK_PASS=true
MISSING_PYTHON=false
MISSING_GCC=false

# Check GLIBC
GLIBC_VER=$(ldd --version 2>&1 | head -1 | grep -oP '[\d.]+$' || echo "0")
GLIBC_MAJOR=$(echo "$GLIBC_VER" | cut -d. -f1)
GLIBC_MINOR=$(echo "$GLIBC_VER" | cut -d. -f2)
if [ "$GLIBC_MAJOR" -lt 2 ] || { [ "$GLIBC_MAJOR" -eq 2 ] && [ "$GLIBC_MINOR" -lt 28 ]; }; then
  echo "[FAIL] GLIBC $GLIBC_VER (required 2.28+)"
  echo "GLIBC cannot be upgraded easily. This system is not supported."
  exit 1
else
  echo "[ OK ] GLIBC $GLIBC_VER"
fi

# Check Python
if command -v python3 >/dev/null 2>&1; then
  PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "0")
  PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
  PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
  if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 9 ]; }; then
    echo "[FAIL] Python $PY_VER (required 3.9+)"
    MISSING_PYTHON=true
    CHECK_PASS=false
  else
    echo "[ OK ] Python $PY_VER"
  fi
else
  echo "[FAIL] Python not found (required 3.9+)"
  MISSING_PYTHON=true
  CHECK_PASS=false
fi

# Check GCC C++20 support
if command -v g++ >/dev/null 2>&1; then
  GCC_VER=$(g++ -dumpversion 2>/dev/null || echo "0")
  GCC_MAJOR=$(echo "$GCC_VER" | cut -d. -f1)
  if [ "$GCC_MAJOR" -lt 8 ]; then
    echo "[FAIL] GCC $GCC_VER (required 8.5.0+)"
    MISSING_GCC=true
    CHECK_PASS=false
  elif [ "$GCC_MAJOR" -eq 8 ]; then
    GCC_MINOR=$(echo "$GCC_VER" | cut -d. -f2)
    GCC_PATCH=$(echo "$GCC_VER" | cut -d. -f3)
    if [ "$GCC_MINOR" -lt 5 ]; then
      echo "[FAIL] GCC $GCC_VER (required 8.5.0+)"
      MISSING_GCC=true
      CHECK_PASS=false
    else
      echo "[ OK ] GCC $GCC_VER"
    fi
  else
    echo "[ OK ] GCC $GCC_VER"
  fi
else
  echo "[FAIL] GCC not found (required C++20 support)"
  MISSING_GCC=true
  CHECK_PASS=false
fi

if [ "$CHECK_PASS" = false ]; then
  echo ""
  echo "Missing prerequisites detected. Install now?"
  $SUDO yum install -y make gcc gcc-c++
  if [ "$MISSING_PYTHON" = true ]; then
    $SUDO yum install -y python3.9
  fi
  echo ""
  echo "Re-checking prerequisites..."
  CHECK_PASS=true

  if command -v python3 >/dev/null 2>&1; then
    PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "0")
    PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
    if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 9 ]; }; then
      echo "[FAIL] Python $PY_VER still below 3.9"
      CHECK_PASS=false
    else
      echo "[ OK ] Python $PY_VER"
    fi
  else
    echo "[FAIL] Python still not found"
    CHECK_PASS=false
  fi

  if command -v g++ >/dev/null 2>&1; then
    GCC_VER=$(g++ -dumpversion 2>/dev/null || echo "0")
    GCC_MAJOR=$(echo "$GCC_VER" | cut -d. -f1)
    if [ "$GCC_MAJOR" -lt 8 ]; then
      echo "[FAIL] GCC $GCC_VER still below 8.5.0"
      CHECK_PASS=false
    elif [ "$GCC_MAJOR" -eq 8 ]; then
      GCC_MINOR=$(echo "$GCC_VER" | cut -d. -f2)
      if [ "$GCC_MINOR" -lt 5 ]; then
        echo "[FAIL] GCC $GCC_VER still below 8.5.0"
        CHECK_PASS=false
      else
        echo "[ OK ] GCC $GCC_VER"
      fi
    else
      echo "[ OK ] GCC $GCC_VER"
    fi
  else
    echo "[FAIL] GCC still not found"
    CHECK_PASS=false
  fi

  if [ "$CHECK_PASS" = false ]; then
    echo ""
    echo "Prerequisites still not met. Please install manually and re-run."
    exit 1
  fi
fi

echo ""
echo "All prerequisites met. Starting deployment..."
echo ""

# Extract services.tar.gz
echo "[1/5] Extracting services.tar.gz -> $SERVICES_PATH"
$SUDO mkdir -p "$SERVICES_PATH"
$SUDO tar -xzf "$SCRIPT_DIR/services.tar.gz" -C "$SERVICES_PATH"

echo "[2/5] Adding nodejs to PATH in ~/.bashrc"
NODE_BIN_LINE='export PATH="/usr/local/lib/nodejs/node-v22.22.2-linux-arm64/bin:$PATH"'
if ! grep -qF "$NODE_BIN_LINE" "$HOME/.bashrc" 2>/dev/null; then
  echo "" >> "$HOME/.bashrc"
  echo "$NODE_BIN_LINE" >> "$HOME/.bashrc"
fi
export PATH="/usr/local/lib/nodejs/node-v22.22.2-linux-arm64/bin:$PATH"

# Extract appgenius.tar.gz -> backend + frontend
echo "[3/5] Extracting appgenius -> $APPGENIUS_PATH"
cd "$SCRIPT_DIR"
tar -xzf appgenius.tar.gz

$SUDO mkdir -p "$APPGENIUS_PATH/backend" "$APPGENIUS_PATH/frontend"

tar -xzf backend.tar.gz
$SUDO cp -r dist "$APPGENIUS_PATH/backend/"
$SUDO cp package.json "$APPGENIUS_PATH/backend/"
rm -rf dist

echo "Installing backend dependencies..."
cd "$APPGENIUS_PATH/backend" && $SUDO npm install --omit=dev
cd "$SCRIPT_DIR"

tar -xzf frontend.tar.gz
$SUDO cp -r dist "$APPGENIUS_PATH/frontend/"
rm -rf dist

$SUDO cp .env.release "$APPGENIUS_PATH/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/backend/.env"
$SUDO ln -sf "$APPGENIUS_PATH/.env" "$APPGENIUS_PATH/frontend/.env"
rm -f .env backend.tar.gz frontend.tar.gz

# Extract config.tar.gz
echo "[4/5] Extracting config.tar.gz -> $OPENCODE_CONFIG_PATH"
mkdir -p "$OPENCODE_CONFIG_PATH"
tar -xzf "$SCRIPT_DIR/config.tar.gz" -C "$OPENCODE_CONFIG_PATH"

echo "[5/5] Deployment finished"

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
