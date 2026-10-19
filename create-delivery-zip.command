#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

OUTPUT_NAME="TESHIMA_LAB_portfolio_delivery_$(date +%Y%m%d).zip"
DEST_PATH="$HOME/Desktop/$OUTPUT_NAME"

echo "================================================="
echo " TESHIMA LAB — 納品用クリーンZIP生成スクリプト"
echo " .git, __MACOSX, .DS_Store などの不要メタデータを除外"
echo "================================================="

# Remove existing zip if any
if [ -f "$DEST_PATH" ]; then
  /usr/bin/trash "$DEST_PATH" 2>/dev/null || true
fi

# Check that all filenames are NFC normalized (guard against macOS NFD issue)
echo "ファイル名のUnicode正規化（NFC）チェック中..."
python3 -c "
import os, sys, unicodedata
errors = []
for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['.git', 'baseline_screenshots', 'after_screenshots']):
        continue
    for name in files + dirs:
        if unicodedata.normalize('NFC', name) != name:
            errors.append(os.path.join(root, name))
if errors:
    print('【エラー】NFD（濁点分離）のファイル名が検出されました:')
    for e in errors:
        print('  -', e)
    sys.exit(1)
print('✓ 全ファイル名がNFC（またはASCII）に正規化されています。')
"

zip -r -q -X "$DEST_PATH" . -x "*.git*" -x "*__MACOSX*" -x "*.DS_Store*"

echo ""
echo "納品用ZIPが作成されました："
ls -lh "$DEST_PATH"
echo "保存場所: $DEST_PATH"
