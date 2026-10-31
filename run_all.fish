#!/usr/bin/env fish
# FocusGuard AI — Native Fish Shell Launcher
# Designed specifically for Arch Linux Fish shell

set SCRIPT_DIR (status dirname)
cd $SCRIPT_DIR

function cleanup --on-signal SIGINT --on-signal SIGTERM
    echo ""
    echo "Stopping FocusGuard AI services..."
    kill (jobs -p) 2>/dev/null
    echo "FocusGuard AI stopped cleanly."
    exit 0
end

echo "=========================================================="
echo "          FocusGuard AI — Stay Present. Study Smarter.    "
echo "=========================================================="

# Activate virtualenv if present
if test -f .venv/bin/activate.fish
    source .venv/bin/activate.fish
end

# 1. Start Python Vision Engine in background
set -gx PYTHONPATH .
python -m backend.main &

# Wait for backend
echo "Waiting for Python Vision Engine on 127.0.0.1:8765..."
while not curl -s http://127.0.0.1:8765/api/status > /dev/null 2>&1
    sleep 0.5
end
echo "✓ Python Vision Engine is online!"

# 2. Start Frontend server
echo "Starting Frontend Server..."
npm --prefix frontend run dev &

echo ""
echo "=========================================================="
echo " FocusGuard AI is running!"
echo " Web UI:     http://127.0.0.1:5173"
echo " API Docs:   http://127.0.0.1:8765/docs"
echo " Camera:     Active on /dev/video0"
echo " Press Ctrl+C to terminate services cleanly."
echo "=========================================================="
echo ""

# Wait for background jobs
wait
