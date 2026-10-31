#!/usr/bin/env bash
# FocusGuard AI — Unified Launcher
# Launches the Python Vision Engine and Frontend concurrently.
# Gracefully terminates all background sub-processes on SIGINT / exit.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Stopping FocusGuard AI services..."
    kill $(jobs -p) 2>/dev/null || true
    wait 2>/dev/null || true
    echo "FocusGuard AI stopped cleanly."
}

trap cleanup EXIT INT TERM

echo "=========================================================="
echo "          FocusGuard AI — Stay Present. Study Smarter.    "
echo "=========================================================="
echo "1. Checking environment & dependencies..."

chmod +x start_backend.sh start_frontend.sh

# 1. Start Python Vision Engine in background
./start_backend.sh &
BACKEND_PID=$!

# Wait for backend port 8765 to become available
echo "Waiting for Python Vision Engine on 127.0.0.1:8765..."
until curl -s http://127.0.0.1:8765/api/status > /dev/null 2>&1; do
    sleep 0.5
done
echo "✓ Python Vision Engine is online!"

# 2. Start Frontend development server
echo "Starting Frontend Server..."
./start_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " FocusGuard AI is running!"
echo " Web UI:     http://127.0.0.1:5173"
echo " API Docs:   http://127.0.0.1:8765/docs"
echo " Camera:     Active on /dev/video0"
echo " Press Ctrl+C to terminate both services cleanly."
echo "=========================================================="
echo ""

# Keep running until user exits
wait
