#!/usr/bin/env fish
# FocusGuard AI — Native Desktop Launcher (Tauri) for Fish shell

set SCRIPT_DIR (status dirname)
cd $SCRIPT_DIR

function cleanup --on-signal SIGINT --on-signal SIGTERM
    echo ""
    echo "Stopping FocusGuard AI background services..."
    kill (jobs -p) 2>/dev/null
    echo "FocusGuard AI desktop stopped."
    exit 0
end

if test -f .venv/bin/activate.fish
    source .venv/bin/activate.fish
end

echo "Starting Python Vision Engine..."
set -gx PYTHONPATH .
python -m backend.main &

echo "Waiting for Python Vision Engine on 127.0.0.1:8765..."
while not curl -s http://127.0.0.1:8765/api/status > /dev/null 2>&1
    sleep 0.5
end
echo "✓ Python Vision Engine ready!"

echo "Launching FocusGuard AI Tauri Desktop Window..."
npm --prefix frontend run build
npx @tauri-apps/cli dev
