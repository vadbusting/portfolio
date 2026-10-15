#!/bin/sh
# ロビーのスクロール動画 → 連番画像（canvasでスクロール連動再生用）
# 使い方: tools/make-lobby-seq.sh <動画.mp4> [始点画像] [終点画像]
#   例) tools/make-lobby-seq.sh ~/Downloads/Camera_moving_towards_guidebook.mp4 start.jpg end.jpg
# 出力: assets/lobby_seq/f000.webp ... と manifest.json（scene.js の SEQ_COUNT をコマ数に合わせる）
#       始点/終点画像を渡すと assets/scenes/lobby_start.webp / lobby_end.webp も作る（3Dの入口投影と最終フレーム用）
set -e
v="$1"; [ -f "$v" ] || { echo "動画ファイルを指定してください"; exit 1; }
mkdir -p assets/lobby_seq /tmp/lobby_seq_png
rm -f /tmp/lobby_seq_png/*.png assets/lobby_seq/*.webp
# 1コマおき・横1280px（24fps/8秒なら96コマ ≒ 4MB）
ffmpeg -loglevel error -y -i "$v" -vf "select='not(mod(n,2))',scale=1280:-2" -vsync 0 /tmp/lobby_seq_png/f_%03d.png
i=0
for f in /tmp/lobby_seq_png/f_*.png; do
  n=$(printf "%03d" $i)
  ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 70 "assets/lobby_seq/f$n.webp"
  i=$((i+1))
done
echo "frames: $i  → scene.js の SEQ_COUNT を $i にしてください"
[ -n "$2" ] && ffmpeg -loglevel error -y -i "$2" -vf scale=2048:-2 -c:v libwebp -quality 88 assets/scenes/lobby_start.webp
[ -n "$3" ] && ffmpeg -loglevel error -y -i "$3" -vf scale=2048:-2 -c:v libwebp -quality 90 assets/scenes/lobby_end.webp
echo done
