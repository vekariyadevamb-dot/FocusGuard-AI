#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv --python /home/dev/.local/share/uv/python/cpython-3.12-linux-x86_64-gnu/bin/python3.12 .venv
    source .venv/bin/activate
    uv pip install "mediapipe<1.0" opencv-python numpy fastapi uvicorn websockets pydantic aiosqlite pytest pytest-asyncio httpx
fi

source .venv/bin/activate
export PYTHONPATH="$SCRIPT_DIR"

echo "Starting FocusGuard AI Python Vision Engine on http://127.0.0.1:8765..."
python3 -m backend.main
