# TESHIMA LAB portfolio

ポートフォリオサイト（シネマティック映像遷移 ＆ 3D回廊アーカイブ）

## 起動方法
`start-3002.command` をダブルクリック、またはターミナルで実行：
```bash
./start-3002.command
# または
python3 serve.py 3002
```
ブラウザで `http://localhost:3002/` を開きます。
（`serve.py` は動画シーク用の HTTP Range リクエストや Unicode ファイル名解決に対応しています）

## サイト構造とフロア構成
- **HERO（エントランス）**: シネマティック高精細背景映像。スクロールまたは下スワイプでエントランスからフロアへ突入。
- **1F ABOUT**: プロフィール、スキルセット、お問い合わせ窓口。
- **2F PRESENTATION**: プレゼンテーション実績（スライド・企画書ギャラリー）。
- **3F LP**: ランディングページ制作実績（LP詳細・デザイン解説）。
- **4F WEB**: Webサイト・コーポレートサイト実績。
- **5F DIRECTION**: ディレクション・ブランディング実績。
- **B1F OTHER**: ディスカバリー号 3D回廊空間（Three.js WebGL / 移動・ズーム・作品ライトボックス閲覧機能）。

## 主要ファイル構成
- `index.html` / `scene.css` / `scene.js`: メインサイトの画面遷移・フロア管理・シネマティック動画/静止画制御
- `other.html` / `floating-world.js`: B1F OTHER の 3D回廊アーカイブ空間（Three.js r160 CDN 利用）
- `about.html`, `presentation.html`, `lp.html`, `works.html`: 各フロアの詳細閲覧ページ
- `serve.py`: HTTP Range（206 Partial Content）対応のローカル配信サーバー
- `start-3002.command`: ワンクリック起動スクリプト
- `assets/scenes/`: 画面静止画プレート（共通始点 `floor_start.webp`、各フロア終点画像等）
- `assets/video/`: 高精細シネマティック背景動画
