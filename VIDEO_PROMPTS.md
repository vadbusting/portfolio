# 各階の動画を作るための指示書（Veo / Flow / Runway 用）

目的: `assets/video/` のプレースホルダを、**実写風の本物のドリー映像**に差し替える。
入れ替えはファイル名そのまま上書きでOK（README参照）。

## 共通ルール
- 開始画像（Image-to-Video の First Frame）に `assets/scenes/<floor>_start.webp` を使う（文字なしの実写風素材）
- 尺 3〜4秒 / 横長16:9 / 音声なし。カメラは「ゆっくり前進するドリーイン」、水平維持、手ブレなし
- 共通の否定指示: `no text, no logos, no people, no morphing furniture, no flicker, keep the monitor content unchanged and sharp`
- 作品画面（モニター）は動画内で変形しやすい。**画面は最終フレームで HTML の OPEN PAGE を重ねるだけ**なので、読める必要はないが、歪まないことを優先
- 終点は、各階の画面・主役が画面の中央〜やや上に収まる構図（下側にHTMLの文字を重ねるため余白を残す）

## ロビー(1F:ABOUT)とエレベーター
ロビーの連番は完成済み（`tools/make-lobby-seq.sh`）。エレベーターはCSSで作ってあり動画は不要です（扉が開くと各階のドリー動画が見える）。

## 各階ドリー（`<floor>_dolly.mp4`）
共通テンプレ:
```
Photorealistic night interior, {SCENE}. Slow, smooth dolly-in toward {SUBJECT}, camera level, 3.5 seconds.
Warm practical lights, dark walnut and concrete, subtle dust in the air. Preserve the exact composition
and the screen content of the first frame. No text, no people, no morphing.
```
| floor | key | {SCENE} | {SUBJECT} |
|---|---|---|---|
| 2F | presentation | dark desk, silver laptop showing a slide gallery, brass desk lamp | the laptop screen |
| 3F | lp | desk with a MacBook, black speaker, ashtray, grey desk lamp | the laptop screen |
| 4F | web | studio desk, widescreen display, keyboard, speaker, black lamp | the display |
| 5F | direction | long walnut meeting table, leather chairs, open catalog on the table | the open catalog |
| 6F | other | dark studio desk, large monitor, vintage silver audio amplifier | the monitor |

## 仕上げ
```
ffmpeg -i in.mp4 -an -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -vf scale=1600:-2 assets/video/<key>_dolly.mp4
tools/make-end-frame.sh <key>      # 最終フレーム → assets/scenes/<key>_end.webp
```
空間が崩れたら: 生成を「3秒・前進距離を短く」にして、各階1カットに留める（長尺で通さない）。
