#!/bin/sh
# 로컬 미리보기: 터미널에서 ./preview.sh 실행 후 브라우저에서 http://127.0.0.1:4000 열기
# 파일을 저장하면 브라우저가 자동으로 새로고침됩니다. 끝낼 때는 Ctrl+C
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
cd "$(dirname "$0")"
[ -d vendor/bundle ] || bundle check >/dev/null 2>&1 || bundle install
bundle exec jekyll serve --livereload --open-url
