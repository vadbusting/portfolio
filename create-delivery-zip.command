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

zip -r -q -X "$DEST_PATH" . -x "*.git*" -x "*__MACOSX*" -x "*.DS_Store*"

echo ""
echo "納品用ZIPが作成されました："
ls -lh "$DEST_PATH"
echo "保存場所: $DEST_PATH"
