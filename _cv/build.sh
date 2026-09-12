#!/bin/sh
# 영어 CV PDF 만들기: _cv/cv_en.html 을 고친 뒤 ./_cv/build.sh 실행 → docs/cv_en.pdf 갱신
cd "$(dirname "$0")/.."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="$PWD/docs/cv_en.pdf" "file://$PWD/_cv/cv_en.html" 2>/dev/null
echo "→ docs/cv_en.pdf ($(pdftotext docs/cv_en.pdf - 2>/dev/null | grep -c . ) lines)"
