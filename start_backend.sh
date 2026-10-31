#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
fi

source .venv/bin/activate
export PYTHONPATH="$SCRIPT_DIR"

echo "Starting FocusGuard AI Python Vision Engine on http://127.0.0.1:8765..."
python3 -m backend.main
