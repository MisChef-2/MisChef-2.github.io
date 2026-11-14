#!/bin/sh
# sh build.sh
#   index.html    : 단독 실행·GitHub Pages용 완성 문서 (저장소에 함께 올린다)
#   artifact.html : claude.ai 아티팩트 게시용 (문서 껍데기 없이 본문만, 저장소에는 올리지 않는다)
cd "$(dirname "$0")"
node src/patch-core.js || exit 1
PARTS="photos.js cover.js data.js why.js about.js charts-meta.js world.js core2.js icao.js cmpart.js live.js pilot.js portal.js globe.js chart.js hub-app.js"
FILES=""
for p in $PARTS; do FILES="$FILES src/$p"; done
H=src/hub.html
{ cat $H; echo '<script>'; cat $FILES; echo '</script>'; } > artifact.html
{ echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'; sed '/^<header class="topbar">/,$d' $H | sed 's#<meta name="claude:viewport-fit-sides" content="cover">##'; echo '</head><body>'; sed -n '/^<header class="topbar">/,$p' $H; echo '<script>'; cat $FILES; echo '</script></body></html>'; } > index.html
cat $FILES > bundle.check.js && node --check bundle.check.js && rm bundle.check.js && echo "build ok: $(wc -c < index.html) bytes"
