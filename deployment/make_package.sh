#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="appgenius_packages.tar.gz"

FILES=(
  appgenius.tar.gz
  appgenius_backend_modules_nodejsv22_centos8.tar.gz
  opencode_config.tar.gz
  services.tar.gz
  deploy.sh
  deploy_online.sh
  start.sh
  stop.sh
)

echo "=== AppGenius Package Builder ==="
echo ""

for f in "${FILES[@]}"; do
  if [ ! -f "$SCRIPT_DIR/$f" ]; then
    echo "Error: Missing required file: $f" >&2
    exit 1
  fi
done

rm -f "$SCRIPT_DIR/$OUTPUT"

echo "Packaging $OUTPUT..."
tar -czf "$SCRIPT_DIR/$OUTPUT" -C "$SCRIPT_DIR" "${FILES[@]}"

echo ""
echo "=== Done ==="
echo "Output: $SCRIPT_DIR/$OUTPUT"
ls -lh "$SCRIPT_DIR/$OUTPUT"
