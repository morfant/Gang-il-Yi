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

- **`_projects/` collection** is the heart of the site: one Markdown file per artwork/performance, output at `/projects/:name/` (underscores in filenames become hyphens in URLs). Front matter drives everything: `title` (ko), `title_en`, `year`, `type` (performance|installation|sound|workshop|research), `tags` (graph keywords), `cover`, `media:` (list of `youtube:`/`soundcloud:`/`bandcamp:` entries rendered as embedded players), `links:` (non-embeddable externals rendered as buttons), `featured`, `draft_stub` (marks incomplete stub pages). `_projects/_template.md` documents the schema and is excluded from the build by its underscore prefix.
- **CV is generated, not hand-written.** `cv.md` (`/cv/`, ko) and `cv-en.md` (`/cv/en/`, en) use `_layouts/cv.html` → `_includes/cv.html`, which walks `site.data.cv.sections` and, per section, merges projects whose `cv:` front matter equals the section id (`exhibition|performance|dance|workshop|research`; `cv: false` excludes) with the hand-listed `items:` in `_data/cv.yml` (workshops, releases, grants, education, work). Entries are sorted by the `period` string (must start with `YYYY[.MM]`) descending. Project CV fields: `period`, `venue`/`venue_en`, `event`/`event_en`, `role`/`role_en`. The artist bio lives once in `_data/bio.yml` (ko/en) and is read by the CV layout. `_cv/build.sh` builds the site, serves `_site` locally, and prints both CV pages to `docs/cv.pdf` / `docs/cv_en.pdf` with headless Chrome (print CSS at the bottom of `main.css`). Never edit those PDFs by hand.
- **Graph view** `graph.html` (`/graph/`) inlines every non-stub project with a `type` as JSON (`window.GRAPH_DATA`) and `assets/js/graph.js` renders a d3-force graph (d3 7 from jsDelivr): hub nodes per `type`, one node per `tags:` value, one per work; work radius = featured + media count + degree, plus an optional `window.GRAPH_VIEWS[url]` hook for view counts (not wired yet; GoatCounter was the plan). Reduced-motion runs the simulation synchronously. Tag spellings must match across projects to merge; the admin form offers a datalist of existing tags.
- **Admin page** `admin/index.html` (`/admin/`, `noindex`, `sitemap: false`) + `assets/js/admin.js`: a Chrome-only form that writes directly into the local checkout via the File System Access API (directory handle persisted in IndexedDB). Tabs: new project (writes `_projects/<slug>.md` + copies images to `img/<slug>_N.ext`, cover = `_0`), non-project CV item (text-inserts under the chosen section's `items:` in `_data/cv.yml`), bio (`_data/bio.yml`). It can also load an existing project (`parseProject`/`serializeProject` handle the front-matter subset the site uses: scalars, `tags: [..]`, `media:` list incl. `bandcamp: { album|track }`, `links:`; unknown keys are preserved verbatim, comments dropped) and overwrite it; body is edited as raw markdown in that mode. `publish.sh` = `_cv/build.sh` + commit + push; `preview.sh` = livereload serve. Keep the front-matter format the admin emits in sync with `_template.md` and the CV include.
- **Layout chain**: `_layouts/default.html` (head, `{% seo %}`, nav/footer includes, loads p5.js + filter JS only when `page.layout == 'home'`) → `home.html` (hero band `#p5-header`, then "selected works" = `featured: true` projects as large cards, then "all works" = every project grouped by year desc with divider headings and a type filter bar auto-generated from the `type` values in use) and `project.html` (title block, media embeds via `_includes/youtube|vimeo|soundcloud|bandcamp.html`, body, links, back nav). `_layouts/page.html` for plain pages (currently unused); `_layouts/cv.html` for the CV pages. There is no about page: `/about/` redirects to `/cv/` via `jekyll-redirect-from`, and the bio is shown on the CV page. `assets/js/home-filter.js` drives the type filter (hides cards by `data-type`, collapses empty year groups). Coverless projects render a `.thumb-typo` typographic tile instead of an image.
- **`assets/css/main.css`** — the single stylesheet (dark theme, CSS variables at top define the palette; accent `#64ffb4`). Plain CSS, no Sass.
- **`assets/js/home-sketch.js`** — p5.js generative header sketch in instance mode, mounted on `#p5-header`. It self-manages performance: `noLoop()` on tab-hide/scroll-out, single frame under `prefers-reduced-motion`. Keep those guards when swapping the sketch.
- **Bilingual content** (Korean/English mixed) is intentional — preserve it.

## Content state (2026-07)

48 project pages sourced from the artist's posts, portfolio Google Doc, and CV. Known loose ends: `vtouch.md` is a stub with no description/year/type; `ur_series.md` bundles four UR works (year: 2013 = series start, spans to 2016, may be split later; its Obsolete Future section is the 2016 Leeum performance, see world_citizen.md); `soundcamp2018.md` slug says 2018 but the event was 2019 (year is set to 2019); Google Drive media on majorleague/n2b should become embeds once re-hosted. The Korean maintenance guide for the artist is `사이트-관리-가이드.md` (excluded from build, keep in sync when the workflow changes).

## Constraints

- GitHub Pages safe mode: only whitelisted plugins work (`jekyll-seo-tag`, `jekyll-sitemap` and `jekyll-redirect-from` are in use). No arbitrary plugins.
- Body images use root-absolute `![](/img/...)` markdown only; covers live in front matter and must not be repeated in the body.
- `Gemfile` pins `github-pages ~> 232` and needs the stdlib gems (`csv`, `base64`, `bigdecimal`, `logger`) for Ruby 3.4; it does not resolve on Ruby 4.x.
