# Task: 縦長・横長スクロール分離および境界時の静止画ブレ・振動防止修正

- [x] 1. `scene.js` の wheel / touchmove イベントハンドラの調査と修正
  - [x] 動画スクロール: 通常の垂直スクロール操作で動画の進行・後退を維持（一切変更せず）
  - [x] 横長時 (`boxRatio >= 1.05`): 左右スクロール（deltaX / dx）で切れている上下領域（`platePanY` 0.0〜1.0）を表示。水平位置は中央（`platePanX = 0.5`）固定。
  - [x] 縦長時 (`boxRatio < 1.05`): 左右スクロール（deltaX / dx）で切れている左右領域（`platePanX` 0.0〜1.0）を表示。垂直位置は中央（`platePanY = 0.5`）固定。
  - [x] スクロールバック時: 上方向スクロール（deltaY < -15 / dy < -20）で即座に中央（50% 50%）に整列させ、ブレ・段差なく動画巻き戻しへ滑らかに遷移
- [x] 2. Chrome DevTools を用いた動作検証
  - [x] 横長画面 (1920x1080, 1440x900) で左右スクロールによる上下パン（天井〜机下）および上スクロールでの動画巻き戻し中央整列を実証
  - [x] 縦長画面 (390x844, 768x1024) で左右スクロールによる左右パン（タイプライター〜アトム人形）およびスクロールバック時の中央整列を実証
- [x] 3. 完了報告（結論先行・エビデンス提示）

---

# Task: 横長時タイトル中央配置・拡大 & CREDIT被り時PORTFOLIO横退避

- [x] 1. `scene.css` のタイトル配置およびメディアクエリ是正
  - [x] `top: 42%` / `top: 38%` 等の偏り設定を全廃し、常に `top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;` で完全な画面中央配置を保証
  - [x] 横長時のコンテナ制限（`max-width: 1440px`）を解除（`95vw`）し、タイトル文字サイズを `clamp(3.2rem, min(14.5vw, 24vh), 13.5rem)`（1440px時で約209px、1920px時で216px）の堂々たるシネマスケールに拡大
- [x] 2. 横長時にCREDITとフロアボタンが被る場合の動的退避処理
  - [x] `updateCreditBtnPosition()` を実装: 横長時かつフロアレールと近接（高さ<=720pxまたは上端距離<=50px）した時のみ、CREDITボタンを `.lab__header-left` へ移動しPORTFOLIOの横に配置
  - [x] 被りが発生しない高さ十分な横長画面や縦長画面では元の右端配置へ自動復帰
- [x] 3. Chrome DevTools 実機検証
  - [x] 1440x900 / 1920x1080 / 1440x480 で `centerOffsetY: 0`（完全中央）およびフォントサイズ（208px〜216px）を実証
  - [x] 短寸横長画面（1440x500 / 1440x480）で `CREDIT` が `PORTFOLIO` の横（左48px・右159px、間隔26px）へ退避し、フロアボタンとの重なりがゼロであることを実証

---

# Task: 不要ファイル削除およびリポジトリ整理・構造クリーンアップ

- [x] 1. ルート直下の必須画像（スライド画像6点、ルーツ画像1点、サッカーボール画像1点）を `image/` へ移動・整理
- [x] 2. `lp.html` および `presentation.html` の画像パス（`image/...`）を一括更新
- [x] 3. 完全未使用の不要ファイル群（`_legacy_three/`, `exterior.js`, `convert_gray.swift`, `test_screens/`, `tools/`, 旧メモ等）を `/usr/bin/trash` で安全削除
- [x] 4. Chrome DevTools MCP 実機検証
  - [x] `lp.html` および `presentation.html` の全スライド画像・ルーツ画像が 404 エラーなく正常にロード（`complete: true`, `naturalWidth > 0`）されることを完全実証
- [x] 5. コミット（`84f8642`）および `origin/dev` へのプッシュ完了


