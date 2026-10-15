#!/bin/bash
set -u
cd "$(dirname "$0")" || exit 1

PIDS="$(lsof -tiTCP:3002 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null || true
  sleep 0.5
  LEFT="$(lsof -tiTCP:3002 -sTCP:LISTEN 2>/dev/null || true)"
  [ -n "$LEFT" ] && kill -9 $LEFT 2>/dev/null || true
fi

WIFI_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
[ -z "$WIFI_IP" ] && WIFI_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"

echo "TESHIMA LAB — local preview"
echo "Mac:    http://localhost:3002/"
if [ -n "$WIFI_IP" ]; then
  echo "Mobile: http://${WIFI_IP}:3002/"
fi
echo ""
echo "このウインドウを閉じるとローカルサーバーも終了します。"

python3 -m http.server 3002 --bind 0.0.0.0 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM
sleep 0.8
open "http://localhost:3002/" >/dev/null 2>&1 || true
wait "$SERVER_PID"
