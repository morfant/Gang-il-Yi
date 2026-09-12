#!/bin/sh
# CV PDF 만들기 — 사이트를 빌드한 뒤 /cv/ 와 /cv/en/ 을 헤드리스 크롬으로 인쇄합니다.
#   ./_cv/build.sh   →  docs/cv.pdf (한국어), docs/cv_en.pdf (영어)
# 내용을 고치려면 _projects/*.md 의 cv 항목이나 _data/cv.yml, _data/bio.yml 을 수정하세요.
set -e
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
bundle exec jekyll build --quiet
PORT=4123
python3 -m http.server $PORT --directory _site >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
  --print-to-pdf="$PWD/docs/cv.pdf"    "http://127.0.0.1:$PORT/cv/"    2>/dev/null
"$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
  --print-to-pdf="$PWD/docs/cv_en.pdf" "http://127.0.0.1:$PORT/cv/en/" 2>/dev/null
for f in docs/cv.pdf docs/cv_en.pdf; do
  echo "→ $f ($(pdfinfo "$f" 2>/dev/null | awk '/^Pages/{print $2}') pages)"
done
