# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The personal portfolio site of 이강일 (Gang il Yi), a sound artist — served by GitHub Pages at https://gangilyi.xyz (custom domain via `CNAME`, do not touch). Theme-less Jekyll with hand-written layouts; GitHub Pages builds and deploys automatically on push to `master`.

## Commands

Local preview requires Homebrew Ruby 3.4 (matches the GitHub Pages build via the `github-pages` gem):

```sh
export PATH="/opt/homebrew/opt/ruby@3.4/bin:$PATH"
bundle install                          # first time only
bundle exec jekyll build                # build to _site/
bundle exec jekyll serve --livereload   # http://127.0.0.1:4000
```

There are no tests or linters. Verify by building and spot-checking pages in `_site/`.

## Architecture

- **`_projects/` collection** is the heart of the site: one Markdown file per artwork/performance, output at `/projects/:name/` (underscores in filenames become hyphens in URLs). Front matter drives everything: `title` (ko), `title_en`, `year`, `type` (performance|installation|sound|research), `cover`, `media:` (list of `youtube:`/`soundcloud:`/`bandcamp:` entries rendered as embedded players), `links:` (non-embeddable externals rendered as buttons), `featured`, `draft_stub` (marks incomplete stub pages). `_projects/_template.md` documents the schema and is excluded from the build by its underscore prefix.
- **Layout chain**: `_layouts/default.html` (head, `{% seo %}`, nav/footer includes, loads p5.js only when `page.layout == 'home'`) → `home.html` (hero band `#p5-header` + project grid sorted by year desc, `featured` first) and `project.html` (title block, media embeds via `_includes/youtube|soundcloud|bandcamp.html`, body, links, back nav).
- **`assets/css/main.css`** — the single stylesheet (dark theme, CSS variables at top define the palette; accent `#64ffb4`). Plain CSS, no Sass.
- **`assets/js/home-sketch.js`** — p5.js generative header sketch in instance mode, mounted on `#p5-header`. It self-manages performance: `noLoop()` on tab-hide/scroll-out, single frame under `prefers-reduced-motion`. Keep those guards when swapping the sketch.
- **Bilingual content** (Korean/English mixed) is intentional — preserve it.

## Constraints

- GitHub Pages safe mode: only whitelisted plugins work (`jekyll-seo-tag` and `jekyll-sitemap` are in use). No arbitrary plugins.
- Body images use root-absolute `![](/img/...)` markdown only; covers live in front matter and must not be repeated in the body.
- `Gemfile` pins `github-pages ~> 232` and needs the stdlib gems (`csv`, `base64`, `bigdecimal`, `logger`) for Ruby 3.4; it does not resolve on Ruby 4.x.
