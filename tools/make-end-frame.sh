#!/bin/sh
# 使い方: tools/make-end-frame.sh <floorKey>
#   例) tools/make-end-frame.sh presentation
# assets/video/<floorKey>_dolly.mp4 の「最後のフレーム」を assets/scenes/<floorKey>_end.webp に書き出します。
# Veo等で作った本番クリップを差し替えたら、これを実行してください（動画が使えない端末の静止画フォールバック用）。
# 先頭フレーム(_start.webp)は tools/make-end-frame.sh <floorKey> start で書き出せます。
set -e
k="$1"; mode="${2:-end}"
[ -n "$k" ] || { echo "floorKey を指定してください (about|presentation|lp|web|direction|other)"; exit 1; }
v="assets/video/${k}_dolly.mp4"
if [ "$mode" = "start" ]; then
  ffmpeg -y -loglevel error -i "$v" -frames:v 1 -c:v libwebp -quality 86 "assets/scenes/${k}_start.webp"
else
  ffmpeg -y -loglevel error -sseof -0.1 -i "$v" -update 1 -frames:v 1 -c:v libwebp -quality 86 "assets/scenes/${k}_end.webp"
fi
echo "ok: $k ($mode)"
