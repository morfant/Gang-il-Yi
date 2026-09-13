#!/bin/sh
# 사이트에 올리기: CV PDF 재생성 → 커밋 → 푸시.  사용법: ./publish.sh "메시지"
set -e
cd "$(dirname "$0")"
./_cv/build.sh
git add -A
if git diff --cached --quiet; then echo "변경 사항이 없습니다."; exit 0; fi
git commit -q -m "${1:-Update site}"
git push -q origin master
echo "→ 푸시 완료. 1~3분 뒤 https://gangilyi.xyz 에 반영됩니다."
