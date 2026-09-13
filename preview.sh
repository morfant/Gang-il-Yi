#!/bin/sh
# 로컬 미리보기: 터미널에서 ./preview.sh 실행 후 브라우저에서 http://127.0.0.1:4000 열기
# 파일을 저장하면 브라우저가 자동으로 새로고침됩니다. 끝낼 때는 Ctrl+C
# 관리 페이지(/admin/)의 '사이트에 올리기' 버튼을 위한 도우미(127.0.0.1:4001)도 함께 켜고, 끝낼 때 같이 끕니다.
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
cd "$(dirname "$0")"
[ -d vendor/bundle ] || bundle check >/dev/null 2>&1 || bundle install
python3 ./_admin_helper.py &
HELPER=$!
trap 'kill $HELPER 2>/dev/null' EXIT INT TERM
bundle exec jekyll serve --livereload --open-url
