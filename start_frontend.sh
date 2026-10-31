#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

echo "Starting FocusGuard AI Frontend on http://127.0.0.1:5173..."
npm run dev -- --host 127.0.0.1 --port 5173
