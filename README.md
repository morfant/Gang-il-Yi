# gangilyi.xyz

이강일 (Gang il Yi) — sound artist 포트폴리오 사이트.
Jekyll + GitHub Pages. `master`에 push하면 자동으로 빌드/배포됩니다.

## 새 프로젝트 추가하는 법

1. `_projects/_template.md`를 복사해서 `_projects/프로젝트이름.md`로 저장
2. front matter(제목, 연도, 타입, 커버 이미지, 미디어 링크)를 채우기
3. 이미지를 `img/`에 넣고 본문에 `![](/img/파일명.jpg)` 형태로 추가
4. commit & push → 잠시 후 홈 그리드에 자동으로 나타남

미디어 임베드는 front matter의 `media:`에 적습니다:

```yaml
media:
  - youtube: "동영상ID"            # https://youtu.be/여기부분
  - soundcloud: "https://soundcloud.com/thisriver/트랙주소"
  - bandcamp: { album: "숫자ID" }  # Bandcamp Share/Embed에서 album=숫자 복사
```

임베드가 안 되는 링크(Google Drive 등)는 `links:`에 적으면 버튼으로 표시됩니다.

## 로컬 미리보기

최초 1회 (Homebrew Ruby 3.4 필요 — GitHub Pages와 동일한 Jekyll 버전 사용):

```sh
brew install ruby@3.4
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
bundle install
```

실행:

```sh
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
bundle exec jekyll serve --livereload
# → http://127.0.0.1:4000
```

## 구조

- `index.html` + `_layouts/home.html` — 홈: p5.js 제너러티브 헤더 + 프로젝트 그리드
- `_projects/*.md` — 프로젝트 1건당 파일 1개 (연도 내림차순 정렬, `featured: true`는 맨 앞)
- `_layouts/project.html` — 프로젝트 상세 페이지 템플릿
- `_includes/` — nav, footer, 카드, YouTube/SoundCloud/Bandcamp 임베드 조각
- `assets/css/main.css` — 전체 스타일 (다크 테마)
- `assets/js/home-sketch.js` — 홈 헤더 p5.js 스케치 (파일 안 주석 참고해서 교체 가능)
- `img/` — 모든 이미지 (프로젝트 접두어로 파일명 구분)
