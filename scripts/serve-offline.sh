#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8080}"
URL="http://127.0.0.1:${PORT}/"
echo "Outer-Reach hors ligne : ${URL}"
if command -v xdg-open >/dev/null 2>&1 && [ "${NO_BROWSER:-0}" != "1" ]; then
  (sleep 1; xdg-open "$URL" >/dev/null 2>&1 || true) &
fi
exec python3 -m http.server "$PORT" --bind 127.0.0.1
