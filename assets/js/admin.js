/* 관리 페이지 — 크롬 File System Access API로 사이트 폴더에 직접 파일을 씁니다. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let root = null; // DirectoryHandle

  // ── 폴더 연결 (핸들은 IndexedDB에 저장해 다음에도 재사용) ─────────────
  const DB = 'gangilyi-admin', STORE = 'handles';
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const saveHandle = async h => { const db = await idb(); const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(h, 'root'); };
  const loadHandle = async () => { const db = await idb(); return new Promise(res => { const q = db.transaction(STORE).objectStore(STORE).get('root'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); };

  async function verify(h) {
    try { await h.getDirectoryHandle('_projects'); await h.getDirectoryHandle('img'); await h.getDirectoryHandle('_data'); return true; }
    catch { return false; }
  }
  function setStatus(ok, msg) {
    $('#connect-status').textContent = msg;
    $('#connect-status').className = ok ? 'ok' : 'dim';
    $('#btn-connect').textContent = ok ? '다른 폴더 연결' : '사이트 폴더 연결';
    document.body.classList.toggle('connected', ok);
  }
  async function connect(pick) {
    if (!window.showDirectoryPicker) { setStatus(false, '이 브라우저는 폴더 접근을 지원하지 않습니다. 크롬을 사용하세요.'); return; }
    let h = pick ? null : await loadHandle();
    if (h && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      if (!pick) { setStatus(false, `이전에 연결한 폴더(${h.name})가 있습니다. 버튼을 눌러 다시 허용하세요.`); $('#btn-connect').textContent = `${h.name} 다시 연결`; return; }
    }
    if (!h) { try { h = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch { return; } }
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') { setStatus(false, '쓰기 권한이 필요합니다.'); return; }
    if (!(await verify(h))) { setStatus(false, `${h.name} 안에 _projects / img / _data 폴더가 없습니다. 사이트 폴더(Gang-il-Yi)를 선택하세요.`); return; }
    root = h; await saveHandle(h);
    setStatus(true, `연결됨: ${h.name}`);
  }
  $('#btn-connect').addEventListener('click', async () => {
    const prev = await loadHandle();
    if (prev && !root) { await connect(false); if (root) return; }
    await connect(true);
  });
  connect(false);

  // ── 파일 유틸 ─────────────────────────────────────────────────────
  async function dir(path) { let d = root; for (const p of path.split('/').filter(Boolean)) d = await d.getDirectoryHandle(p); return d; }
  async function exists(dirPath, name) { try { await (await dir(dirPath)).getFileHandle(name); return true; } catch { return false; } }
  async function writeText(dirPath, name, text) { const fh = await (await dir(dirPath)).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(text); await w.close(); }
  async function writeBlob(dirPath, name, blob) { const fh = await (await dir(dirPath)).getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(blob); await w.close(); }
  async function readText(dirPath, name) { const fh = await (await dir(dirPath)).getFileHandle(name); return (await fh.getFile()).text(); }
  const need = () => { if (!root) throw new Error('먼저 사이트 폴더를 연결하세요.'); };

  // ── 탭 ─────────────────────────────────────────────────────────────
  $$('.admin-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.admin-tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.admin-tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + b.dataset.tab));
  }));

  // ── 반복 행 (미디어 / 링크) ─────────────────────────────────────────
  const rowTpl = {
    media: () => `<select name="mkind"><option value="youtube">YouTube</option><option value="soundcloud">SoundCloud</option><option value="bandcamp_album">Bandcamp album</option><option value="bandcamp_track">Bandcamp track</option><option value="vimeo">Vimeo</option></select><input name="mval" placeholder="주소 또는 ID"><button type="button" class="x" title="삭제">×</button>`,
    link: () => `<input name="llabel" placeholder="버튼 이름 (예: 전시 정보)"><input name="lurl" placeholder="https://…"><button type="button" class="x" title="삭제">×</button>`
  };
  function addRow(kind) { const d = document.createElement('div'); d.className = 'row ' + kind; d.innerHTML = rowTpl[kind](); d.querySelector('.x').onclick = () => d.remove(); $(`#${kind}-rows`).appendChild(d); }
  $$('[data-add]').forEach(b => b.addEventListener('click', () => addRow(b.dataset.add)));

  // ── 헬퍼 ────────────────────────────────────────────────────────────
  const q = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const ext = f => (f.name.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0].toLowerCase().replace('jpeg', 'jpg');
  function ytId(v) { const m = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : v.trim(); }
  function vimeoId(v) { const m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : v.trim(); }
  function bcId(v) { const m = v.match(/(?:album|track)=(\d+)/); return m ? m[1] : v.replace(/\D/g, ''); }


  // ── 프로젝트 파일 읽기/쓰기 (front matter 부분집합) ────────────────
  const SCALARS = ['title', 'title_en', 'year', 'type', 'cover', 'medium', 'medium_en', 'featured', 'cv', 'period', 'event', 'event_en', 'venue', 'venue_en', 'role', 'role_en'];
  const unq = v => { v = v.trim(); const m = v.match(/^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/) || v.match(/^'([^']*)'\s*(?:#.*)?$/); if (m) return m[1].replace(/\\(["\\])/g, '$1'); return v.replace(/\s+#.*$/, '').trim(); };
  function parseProject(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/); if (!m) throw new Error('front matter(---)를 찾을 수 없습니다.');
    const fm = m[1].split(/\r?\n/), body = m[2].replace(/^\n+/, '');
    const out = { scalars: {}, tags: [], media: [], links: [], extra: [] };
    let mode = null, cur = null;
    for (const raw of fm) {
      if (!raw.trim() || /^\s*#/.test(raw)) continue;
      if (/^\S/.test(raw)) { // 최상위 키
        mode = null; cur = null;
        const k = raw.match(/^([\w-]+):\s*(.*)$/); if (!k) { out.extra.push(raw); continue; }
        const key = k[1], val = k[2];
        if (key === 'tags') { const l = val.match(/^\[(.*)\]/); out.tags = l ? l[1].split(',').map(x => unq(x)).filter(Boolean) : []; if (!l && val.trim() === '') mode = 'tags'; }
        else if (key === 'media') mode = 'media';
        else if (key === 'links') mode = 'links';
        else if (SCALARS.includes(key)) out.scalars[key] = unq(val);
        else out.extra.push(raw);
        continue;
      }
      const t = raw.trim();
      if (mode === 'tags' && t.startsWith('- ')) out.tags.push(unq(t.slice(2)));
      else if (mode === 'media' && t.startsWith('- ')) {
        const mm = t.slice(2).match(/^(\w+):\s*(.*)$/); if (!mm) continue;
        if (mm[1] === 'bandcamp') { const b = mm[2].match(/(album|track):\s*"?(\d+)"?/); if (b) out.media.push({ kind: 'bandcamp_' + b[1], val: b[2] }); }
        else out.media.push({ kind: mm[1], val: unq(mm[2]) });
      }
      else if (mode === 'links') {
        if (t.startsWith('- ')) { cur = {}; out.links.push(cur); const mm = t.slice(2).match(/^(\w+):\s*(.*)$/); if (mm) cur[mm[1]] = unq(mm[2]); }
        else if (cur) { const mm = t.match(/^(\w+):\s*(.*)$/); if (mm) cur[mm[1]] = unq(mm[2]); }
      }
    }
    return { ...out, body };
  }
  function mediaLine(kind, val) {
    if (kind === 'youtube') return `  - youtube: ${q(ytId(val))}`;
    if (kind === 'vimeo') return `  - vimeo: ${q(vimeoId(val))}`;
    if (kind === 'soundcloud') return `  - soundcloud: ${q(val)}`;
    if (kind === 'bandcamp_album') return `  - bandcamp: { album: ${q(bcId(val))} }`;
    if (kind === 'bandcamp_track') return `  - bandcamp: { track: ${q(bcId(val))} }`;
    return `  - ${kind}: ${q(val)}`;
  }
  function serializeProject(d) {
    const s = d.scalars, fm = [`title: ${q(s.title)}`];
    if (s.title_en) fm.push(`title_en: ${q(s.title_en)}`);
    if (s.year) fm.push(`year: ${s.year}`);
    if (s.type) fm.push(`type: ${s.type}`);
    fm.push(`tags: [${d.tags.join(', ')}]`);
    if (s.cover) fm.push(`cover: ${s.cover}`);
    if (s.medium) fm.push(`medium: ${q(s.medium)}`);
    if (s.medium_en) fm.push(`medium_en: ${q(s.medium_en)}`);
    if (s.featured === true || s.featured === 'true') fm.push('featured: true');
    if (d.media.length) fm.push('media:', ...d.media.map(m => mediaLine(m.kind, m.val)));
    if (d.links.length) fm.push('links:', ...d.links.map(l => `  - label: ${q(l.label || l.url)}\n    url: ${q(l.url)}`));
    fm.push(...d.extra);
    fm.push('# CV 항목 (cv: exhibition|performance|dance|workshop|research|false)', `cv: ${s.cv || 'false'}`);
    if (s.cv && s.cv !== 'false') { fm.push(`period: ${q(s.period || s.year)}`); for (const k of ['event', 'event_en', 'venue', 'venue_en', 'role', 'role_en']) if (s[k]) fm.push(`${k}: ${q(s[k])}`); }
    return `---\n${fm.join('\n')}\n---\n\n${d.body.replace(/\s+$/, '')}\n`;
  }
  window.__adminParse = parseProject; window.__adminSerialize = serializeProject; // 테스트용

  // ── 프로젝트 폼 ─────────────────────────────────────────────────────
  const pf = $('#tab-project');
  pf.title_en.addEventListener('input', () => { if (!pf.slug.dataset.manual && !editing) pf.slug.value = slugify(pf.title_en.value); });
  pf.slug.addEventListener('input', () => { pf.slug.dataset.manual = pf.slug.value ? '1' : ''; });
  // 연도를 넣으면 기간(period)이 비어 있을 때 자동으로 채움 — 월까지 적고 싶으면 뒤에 .08 처럼 덧붙이기
  pf.year.addEventListener('input', () => { if (!pf.period.dataset.manual) pf.period.value = pf.year.value; });
  pf.period.addEventListener('input', () => { pf.period.dataset.manual = pf.period.value && pf.period.value !== pf.year.value ? '1' : ''; });

  let editing = null; // { slug, data } 편집 중인 기존 작업

  function nextImageIndex(slug, text) { let n = -1; for (const m of text.matchAll(new RegExp(`/img/${slug}_(\\d+)\\.`, 'g'))) n = Math.max(n, +m[1]); return n + 1; }

  function collectProject() {
    const v = n => pf[n].value.trim();
    const slug = v('slug');
    if (!slug) throw new Error('파일 이름(slug)을 입력하세요. 영어 제목이 없으면 직접 영문으로 적어 주세요.');
    const d = editing ? editing.data : { scalars: {}, tags: [], media: [], links: [], extra: [], body: '' };
    const s = d.scalars;
    for (const k of ['title', 'title_en', 'year', 'type', 'medium', 'medium_en', 'cv', 'period', 'event', 'event_en', 'venue', 'venue_en', 'role', 'role_en']) s[k] = v(k);
    s.featured = pf.featured.checked;
    d.tags = v('tags').split(/[,，]/).map(t => t.trim()).filter(Boolean);
    d.media = $$('.row.media', pf).map(r => ({ kind: r.querySelector('[name=mkind]').value, val: r.querySelector('[name=mval]').value.trim() })).filter(m => m.val);
    d.links = $$('.row.link', pf).map(r => ({ label: r.querySelector('[name=llabel]').value.trim(), url: r.querySelector('[name=lurl]').value.trim() })).filter(l => l.url);

    // 본문
    let body = editing ? pf.body_raw.value : [v('body_ko'), v('body_en')].filter(Boolean).join('\n\n');
    // 이미지: 기존 번호 다음부터
    const files = []; let n = nextImageIndex(slug, (s.cover || '') + ' ' + body);
    const cover = pf.cover.files[0] || null, images = [...pf.images.files];
    if (cover) { const name = `${slug}_${n++}${ext(cover)}`; files.push({ name, file: cover }); s.cover = `/img/${name}`; }
    const added = images.map(f => { const name = `${slug}_${n++}${ext(f)}`; files.push({ name, file: f }); return `![](/img/${name})`; });
    if (added.length) body = (body.replace(/\s+$/, '') + '\n\n' + added.join('\n')).trim();
    d.body = body;
    return { slug, md: serializeProject(d), files };
  }

  // ── 기존 작업 불러오기 ────────────────────────────────────────────
  function setEditMode(on) {
    $('#body-new').hidden = on; $('#body-edit').hidden = !on; $('#btn-new').hidden = !on;
    pf.slug.readOnly = on; pf.title.required = true;
    if (!on) { editing = null; pf.reset(); $('#media-rows').innerHTML = ''; $('#link-rows').innerHTML = ''; $('#cover-current').textContent = ''; $('#edit-status').textContent = ''; $('#project-preview').hidden = true; pf.slug.dataset.manual = ''; pf.period.dataset.manual = ''; }
  }
  $('#btn-new').addEventListener('click', () => setEditMode(false));
  pf.load.addEventListener('change', async () => {
    const slug = pf.load.value; if (!slug) return;
    try {
      need();
      const text = await readText('_projects', slug + '.md');
      const d = parseProject(text);
      setEditMode(true); editing = { slug, data: d }; pf.load.value = slug;
      const s = d.scalars;
      pf.slug.value = slug; pf.slug.dataset.manual = '1';
      for (const k of ['title', 'title_en', 'year', 'type', 'medium', 'medium_en', 'cv', 'period', 'event', 'event_en', 'venue', 'venue_en', 'role', 'role_en']) if (pf[k]) pf[k].value = s[k] || '';
      if (!s.cv) pf.cv.value = 'false';
      pf.period.dataset.manual = '1';
      pf.featured.checked = s.featured === 'true';
      pf.tags.value = d.tags.join(', ');
      $('#cover-current').textContent = s.cover ? `현재: ${s.cover} (새 파일을 고르면 교체)` : '커버 없음 (글자 타일로 표시)';
      $('#media-rows').innerHTML = ''; d.media.forEach(m => { addRow('media'); const r = $('#media-rows').lastElementChild; r.querySelector('[name=mkind]').value = m.kind; r.querySelector('[name=mval]').value = m.val; });
      $('#link-rows').innerHTML = ''; d.links.forEach(l => { addRow('link'); const r = $('#link-rows').lastElementChild; r.querySelector('[name=llabel]').value = l.label || ''; r.querySelector('[name=lurl]').value = l.url || ''; });
      pf.body_raw.value = d.body;
      $('#edit-status').textContent = `편집 중: _projects/${slug}.md` + (d.extra.length ? ` (기타 항목 ${d.extra.length}개는 그대로 유지)` : '');
      $('#edit-status').className = 'ok';
    } catch (err) { $('#edit-status').textContent = '오류: ' + err.message; $('#edit-status').className = 'err'; }
  });

  $('#btn-preview').addEventListener('click', () => {
    try { const { md } = collectProject(); const pre = $('#project-preview'); pre.textContent = md; pre.hidden = false; }
    catch (e) { $('#project-status').textContent = e.message; }
  });

  pf.addEventListener('submit', async e => {
    e.preventDefault(); const st = $('#project-status');
    try {
      need();
      const { slug, md, files } = collectProject();
      const fname = slug + '.md';
      if (!editing && await exists('_projects', fname) && !confirm(`_projects/${fname} 가 이미 있습니다. 덮어쓸까요?`)) return;
      for (const f of files) if (await exists('img', f.name) && !confirm(`img/${f.name} 가 이미 있습니다. 덮어쓸까요?`)) return;
      st.textContent = '저장 중…';
      for (const f of files) await writeBlob('img', f.name, f.file);
      await writeText('_projects', fname, md);
      st.textContent = `${editing ? '수정 저장됨' : '저장됨'}: _projects/${fname}` + (files.length ? ` + 이미지 ${files.length}개` : '') + ` → 미리보기: /projects/${slug.replace(/_/g, '-')}/`;
      if (editing) editing.data = parseProject(md);
      st.className = 'ok';
    } catch (err) { st.textContent = '오류: ' + err.message; st.className = 'err'; }
  });

  // ── CV 항목 (cv.yml) ───────────────────────────────────────────────
  $('#tab-cvitem').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, st = $('#cvitem-status');
    try {
      need();
      const sec = f.section.value, v = n => f[n].value.trim();
      let yml = await readText('_data', 'cv.yml');
      const item = [`      - period: ${q(v('period'))}`, `        ko: ${q(v('ko'))}`, `        en: ${q(v('en'))}`];
      if (v('url')) item.push(`        url: ${v('url')}`);
      const block = item.join('\n') + '\n';
      // 해당 섹션 블록 찾기
      const start = yml.indexOf(`  - id: ${sec}\n`);
      if (start < 0) throw new Error(`cv.yml에 섹션 ${sec} 이 없습니다.`);
      const nextSec = yml.indexOf('\n  - id: ', start + 1);
      const end = nextSec < 0 ? yml.length : nextSec + 1;
      let section = yml.slice(start, end);
      const itemsIdx = section.indexOf('    items:\n');
      if (itemsIdx >= 0) section = section.slice(0, itemsIdx + 11) + block + section.slice(itemsIdx + 11);
      else section = section.replace(/\n*$/, '\n') + '    items:\n' + block + '\n';
      yml = yml.slice(0, start) + section + yml.slice(end);
      await writeText('_data', 'cv.yml', yml);
      st.textContent = `추가됨 (${sec}). /cv/ 에서 확인하세요.`; st.className = 'ok'; f.reset();
    } catch (err) { st.textContent = '오류: ' + err.message; st.className = 'err'; }
  });

  // ── 소개글 (bio.yml) ───────────────────────────────────────────────
  const bf = $('#tab-bio');
  function parseBio(yml) {
    const out = {};
    for (const k of ['ko', 'en']) {
      const m = yml.match(new RegExp(`^${k}: >-\\n((?:  .*\\n?)+)`, 'm'));
      out[k] = m ? m[1].split('\n').map(l => l.replace(/^  /, '')).join(' ').replace(/\s+/g, ' ').trim() : '';
    }
    return out;
  }
  const fold = s => s.trim().split(/(?<=[.!?。])\s+/).map(l => '  ' + l).join('\n');
  $('#btn-bio-load').addEventListener('click', async () => {
    const st = $('#bio-status');
    try { need(); const b = parseBio(await readText('_data', 'bio.yml')); bf.ko.value = b.ko; bf.en.value = b.en; st.textContent = '불러왔습니다.'; st.className = 'ok'; }
    catch (err) { st.textContent = '오류: ' + err.message; st.className = 'err'; }
  });
  bf.addEventListener('submit', async e => {
    e.preventDefault(); const st = $('#bio-status');
    try {
      need();
      const yml = `# 작가 소개글 — CV 페이지와 PDF 상단에 들어갑니다. 여기 한 곳만 고치면 됩니다.\nko: >-\n${fold(bf.ko.value)}\nen: >-\n${fold(bf.en.value)}\n`;
      await writeText('_data', 'bio.yml', yml);
      st.textContent = '저장됨. /cv/ 에서 확인하세요.'; st.className = 'ok';
    } catch (err) { st.textContent = '오류: ' + err.message; st.className = 'err'; }
  });

  // ── 사이트에 올리기 (로컬 도우미 127.0.0.1:4001 → ./publish.sh) ──────
  const HELPER = 'http://127.0.0.1:4001';
  const pubReady = $('#publish-ready'), pubFallback = $('#publish-fallback'), pubChanges = $('#publish-changes'), pubLog = $('#publish-log');
  async function refreshStatus() {
    try {
      const r = await fetch(HELPER + '/status', { cache: 'no-store' }); if (!r.ok) throw 0;
      const t = (await r.text()).trim(); const n = t ? t.split('\n').length : 0;
      pubReady.hidden = false; pubFallback.hidden = true;
      pubChanges.textContent = n ? `올릴 변경 사항 ${n}개 파일:` : '올릴 변경 사항이 없습니다.';
      if (n) { const ul = document.createElement('ul'); ul.className = 'dim'; t.split('\n').forEach(l => { const li = document.createElement('li'); li.textContent = l.trim(); ul.appendChild(li); }); pubChanges.appendChild(ul); }
      $('#btn-publish').disabled = !n;
      // 배포 중 PDF가 다시 생성되면 미리보기가 페이지를 새로고침하므로, 마지막 결과를 도우미에서 다시 받아 보여 줍니다
      const last = await (await fetch(HELPER + '/last', { cache: 'no-store' })).json();
      const b = $('#btn-publish');
      if (last.state === 'running') { b.disabled = true; b.textContent = '올리는 중… (PDF 생성 포함, 30초쯤)'; pubLog.hidden = false; pubLog.textContent = '진행 중입니다…'; pubLog.className = 'preview'; }
      else if (b.textContent !== '사이트에 올리기') { b.textContent = '사이트에 올리기'; }
      if (last.state !== 'running' && last.output && Date.now() / 1000 - last.ts < 600) { pubLog.hidden = false; pubLog.textContent = last.output; pubLog.className = 'preview ' + (last.state === 'ok' ? 'ok' : 'err'); }
    } catch { pubReady.hidden = true; pubFallback.hidden = false; }
  }
  refreshStatus(); setInterval(refreshStatus, 4000);
  $('#btn-publish').addEventListener('click', async () => {
    const b = $('#btn-publish'); b.disabled = true; b.textContent = '올리는 중… (PDF 생성 포함, 30초쯤)';
    pubLog.hidden = false; pubLog.textContent = '';
    try {
      const r = await fetch(HELPER + '/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: $('#publish-message').value }) });
      pubLog.textContent = await r.text(); pubLog.className = 'preview ' + (r.ok ? 'ok' : 'err');
      if (r.ok) $('#publish-message').value = '';
    } catch (e) { pubLog.textContent = '도우미 서버에 연결할 수 없습니다: ' + e.message; pubLog.className = 'preview err'; }
    b.textContent = '사이트에 올리기'; refreshStatus();
  });
})();
