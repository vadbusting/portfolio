# TESHIMA LAB portfolio — v18

`start-3002.command` をダブルクリック → http://localhost:3002/

## 体験の流れ
1. **外観（3D・夜景）** — 夜空・月・星、ライトアップされたドーム、街灯、窓の灯るビル群。下スクロール／スワイプ／`↓`キーで入口へ接近（`exterior.js`）。
2. **入口が開く** — カメラが入口に着くと、3Dの中に投影した「ロビー始点画像」がちょうど画面いっぱいに収まり、そのまま下のDOMのロビー連番に**継ぎ目なく**切り替わる。
3. **ロビー（スクロール動画）** — 続けてスクロールするとロビー全景 → 受付 → ガイドブックへ寄るカメラが進む（`assets/lobby_seq/f000〜f095.webp` を canvas に描画、スクロール連動）。**ロビー＝1F:ABOUT**。
4. **ロビーの終点** — 左に `ABOUT` と `OPEN PAGE`、右に階数選択（01〜06）。**ここでスクロールは止まり**、階は右の選択か `1`〜`6`キーで選ぶ。
5. **2F以降** — エレベーター（カゴの中から見る視点。階数が上がり扉が開くと、その階の動画が見える）→ ドリー動画 → 左に階名と `OPEN PAGE`。
6. 左上の `PORTFOLIO` で最初（外観）に戻る。`#about` `#presentation` などのURLで各階へ直接リンク可（3Dを飛ばす）。

画面内の文字（PORTFOLIO / CONTACT / 同じ条件を異なる結果へ… / 階名 / OPEN PAGE / LOADING 3D など）は**すべて元サイトの文言のまま**です（`hero-v13.css` も元のまま流用）。

## 素材の差し替え
| 何を | どこを | 備考 |
|---|---|---|
| ロビーの動画 | `tools/make-lobby-seq.sh 動画.mp4 始点.jpg 終点.jpg` | 連番と始点/終点静止画を作り直す。コマ数が変わったら `scene.js` の `SEQ_COUNT` |
| 2F〜6Fの動画 | `assets/video/<key>_dolly.mp4` を同名で上書き → `tools/make-end-frame.sh <key>` | 現在は**静止画からの仮ズーム**（プロンプトは `VIDEO_PROMPTS.md`） |
| 各階の静止画 | `assets/scenes/<key>_start.webp / _end.webp` | 動画が使えない端末でのクロスフェード用 |

## フォールバック
- 動画を使わず静止画クロスフェード: 「視差効果を減らす」、データセーバー、`?novideo=1`、動画が4.5秒以内に再生開始しない場合
- WebGL非対応／3Dの読込が40秒を超える場合: 外観を飛ばしてロビー連番から開始

## 構成
- `index.html` `scene.css` `scene.js` — 画面遷移の制御（元サイトのUIマークアップを流用）
- `exterior.js` — 外観3D（`assets/architecture/city.glb` `dome.glb` のみ読込）
- `assets/lobby_seq/` `assets/scenes/` `assets/video/` `assets/elevator/` — 素材
- `_legacy_three/` — 旧Three.js全フロア版（不要なら削除可）
- `about.html` `presentation.html` `lp.html` `other.html` `works.html` — 詳細ページ（変更なし）

## 既知の制限
- 3Dの建物・ドームは手作りのジオメトリ＋プロシージャルな夜景です。写真並みの質感にするには、外部の夜景HDRI／高精細GLBの追加が必要です。
- 2F〜6Fの動画はまだ仮です。
