#!/usr/bin/env bash
# FocusGuard AI — Native Desktop Launcher (Tauri)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Closing FocusGuard AI desktop and background processes..."
    kill $(jobs -p) 2>/dev/null || true
    wait 2>/dev/null || true
    echo "Closed cleanly."
}

trap cleanup EXIT INT TERM

echo "Starting Python Vision Engine..."
./start_backend.sh &
BACKEND_PID=$!

echo "Waiting for Python Vision Engine to become ready on 127.0.0.1:8765..."
until curl -s http://127.0.0.1:8765/api/status > /dev/null 2>&1; do
    sleep 0.5
done
echo "✓ Python Vision Engine ready!"

echo "Launching FocusGuard AI Tauri Desktop Window..."
npm --prefix frontend run build
npx @tauri-apps/cli dev
