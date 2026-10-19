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

---

# Task: 暗号モーダル HAL 9000 精密光学レンズ明滅調整 & 5状態レスポンシブ最適化

- [x] 1. `scene.css` の赤ランプ（HAL 9000）の光学エフェクト是正
  - [x] 中心焦点（`.hal-eye-focal`）のサイズを従来の12pxから4〜5pxへ縮小し、白飛びを抑えた極小の繊細な光学コアへと改良
  - [x] グロー拡散半径を過剰な発光から `box-shadow: 0 0 2px 1px #ffffff, 0 0 6px 2px rgba(255, 26, 42, 0.75)` の引き締まった精密な光学レンズ明滅へと調整
  - [x] モーダルカード（`.auth-card.hal-console`）の各ブレークポイント（デスクトップ、低全高画面、極小モバイル横・縦）でのパディング・フォント・レンズサイズを最適化
- [x] 2. 5状態レスポンシブ検証（Chrome DevTools MCP 実機検証）
  - [x] PC Fluid (1440x900): 完全中央配置、端正なHALレンズと均整の取れたカード
  - [x] Mobile Landscape (844x390): 縦スクロールなしで全要素（レンズ、タイトル、入力、ボタン2種、戻る）が無理なく収束
  - [x] Tablet Portrait (768x1024): 画面中央に収まりのよいプロポーション
  - [x] Tablet Landscape (1024x768): 堂々たるシネマティックなHALコンソール
  - [x] Mobile Portrait (390x844): スマートフォン画面で片手操作に最適なタッチターゲットと配置を維持
---

# Task: 静止画（plate）の上ズレ解消およびスクロールバック時の中央整列・動画巻き戻し

- [x] 1. `scene.js` の wheel / touchmove における垂直パン（`platePanY`）ロジックの完全撤廃
  - [x] 横長時 (`boxRatio >= 1.05`): `platePanX = 0.5; platePanY = 0.5` を常時固定。上スクロール時に画像が天井方向へズレ上がるバグを根本排除
  - [x] 縦長時 (`boxRatio < 1.05`): 左右スワイプで切れている左右領域のみをパン（`platePanX` 0.0〜1.0）し、垂直位置は `platePanY = 0.5` に物理固定
  - [x] スクロールバック時: 上方向スクロール（`deltaY < -15` / `dy < -20`）で `--pos` を即座に `50.0% 50.0%` へ整列させ、余計なズレなしで即時動画ループ巻き戻しへ移行
  - [x] 1F（ABOUT）からのスクロールバック時: `goHero({ fromLobby: true })` を呼び出し、HERO（タイトル）への滑らかな回帰を保証
- [x] 2. `other.html`（OTHERページ）の最終演出・文字配置の根本修正
  - [x] 1. `BREAK THROUGH` の表示アニメーションと連動し、遠くから背景（フォグ・通路）を徐々に白く明るくフェードさせ、中央表示完了時に背景が完全な純白（`#ffffff`）になるよう制御
  - [x] 2. 画像の上に文字を被せる誤ったDOMオーバーレイを完全撤廃。Three.js 空間内の最深部（全画像の背後・最背面）に 3D テキストプレーン（`depthWrite: false, depthTest: true`）として配置し、画像の手前通過・カメラ前停止の自然な奥行き演出を実証
- [x] 3. 5状態レスポンシブ実機検証（Chrome DevTools MCP）
  - [x] PC Fluid (1440x900) - PASS: デスク・人形が完全中央（`50.0% 50.0%`）、OTHER最終カードで全画像が文字の手前を通過し、背景純白化を完全実証
  - [x] Mobile Portrait (390x844) - PASS: 左右パン（71.4% 50.0%）および上スクロールでの中央再整列
  - [x] Mobile Landscape (844x390) - PASS: 水平・垂直ともに完全中央固定
  - [x] Tablet Portrait (768x1024) - PASS: 静止画・フロア遷移ともにブレなし
  - [x] Tablet Landscape (1024x768) - PASS: アスペクト比に依存しない均整な表示---

# Task: 外部AI指摘精査・完全リポジトリクリーンアップ & 動作検証

- [x] 1. 重複開始画像（5枚・6.2MB）の集約
  - [x] `assets/scenes/floor_start.webp`（1枚・1.2MB）へ集約
  - [x] 重複していた `presentation_start.webp`, `lp_start.webp`, `web_start.webp`, `direction_start.webp`, `other_start.webp`, `lobby_start.webp` を `/usr/bin/trash` で完全削除
  - [x] `scene.js` の `PATH.plate` を `floor_start.webp` 参照へ更新
- [x] 2. 未使用ライブラリおよびコード残骸の安全削除
  - [x] 未使用のローカルThree.js（`assets/vendor/three/` 2.3MB）を `/usr/bin/trash` で完全削除（`other.html` はCDN r128から読込）
  - [x] `scene.js` 内の未使用死にコード（`seqLoop`, `seqNudge`, `startSeqLoop`, 未使用定数等）を安全に整理
  - [x] `start-3002.command` を `serve.py 3002`（Rangeヘッダー対応サーバー）経由に変更
- [x] 3. ドキュメント（`README.md`, `ASSET_CREDITS.md`）の現行仕様完全同期
  - [x] 削除済み旧資産（`exterior.js`, `architecture`, `lobby_seq`）の記述を完全一新
  - [x] シネマティック映像＋ディスカバリー号3D回廊の現行構成および納品ZIP作成手順を正確に記述
- [x] 4. Gitコミット整理と納品ZIP検証
  - [x] 248件の未コミット削除状態をすべてコミット（`7d6d37d`）し、Working Tree を完全クリーン化
  - [x] 納品用ZIP（`.git`, `__MACOSX`, `.DS_Store` 除外）の生成検証を実施し、439MBから130MBへの軽量化（▲309MB削減）を実証
- [x] 5. 5状態レスポンシブ実機検証および構文・コンソールエラー検証
  - [x] `node -c scene.js` 構文エラー 0 件
  - [x] Chrome DevTools MCP 実機検証: コンソールエラー 0 件
  - [x] 5画面状態（PC Fluid, Mobile Portrait, Mobile Landscape, Tablet Portrait, Tablet Landscape）での表示崩れ・レイアウト破綻ゼロを実証
  - [x] `other.html`（ディスカバリー号3D回廊・白フェード）の完全動作を実証
---

# Task: #about 直接アクセス、フロア遷移、動画再生失敗時静止画フォールバック検証

- [x] 1. #about 直接URLアクセスの実機検証
  - [x] `http://localhost:3002/#about` 直接ナビゲーションで即座に `data-state="floor"` / `data-floor="0"` 描画を確認
  - [x] レールボタン `1F ABOUT` アクティブ、OPEN PAGEボタン、芳名帳・プロフィール写真・QRコード正常表示
  - [x] コンソールエラー 0 件
- [x] 2. 全フロア遷移（1F〜5F, B1F）の実機検証
  - [x] 1F -> 2F (PRESENTATION) -> 3F (LP) -> 4F (WEB) -> 5F (DIRECTION) -> 1F (ABOUT) 連続切り替えを実証
  - [x] 各フロアでディップ暗転・扉前静止画表示・SCROLLキュー表示・ハッシュ変更・レール更新が完全動作
  - [x] B???F (OTHER) クリック時にHAL 9000暗号モーダルが正常起動し、BACKボタンで復帰できることを実証
  - [x] コンソールエラー 0 件
- [x] 3. 動画再生失敗時の静止画フォールバック実装 & 実機検証
  - [x] `heroVideo` / `dolly` の `error` イベントリスナー実装（`is-video-fallback` / `is-hero-fallback` 自動付与）
  - [x] `scene.css` に静止画フォールバック制御を追加（ビデオ非表示化、`plate` 表示化、クロスフェード制御）
  - [x] `?novideo=1` パラメータによる静止画モード動作検証（`dolly` 除去、`floor_start.webp` -> `${f.key}_end.webp` への安定表示）
  - [x] ビデオ `error` イベント強制発火テスト: 即座に静止画フォールバックへ切り替わり、スクロールで `OPEN PAGE` / ポータルへ到達可能であることを完全実証
  - [x] コンソールエラー 0 件


