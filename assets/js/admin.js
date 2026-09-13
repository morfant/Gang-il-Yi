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

  // ── 프로젝트 폼 ─────────────────────────────────────────────────────
  const pf = $('#tab-project');
  pf.title_en.addEventListener('input', () => { if (!pf.slug.dataset.manual) pf.slug.value = slugify(pf.title_en.value); });
  pf.slug.addEventListener('input', () => { pf.slug.dataset.manual = pf.slug.value ? '1' : ''; });
  // 연도를 넣으면 기간(period)이 비어 있을 때 자동으로 채움 — 월까지 적고 싶으면 뒤에 .08 처럼 덧붙이기
  pf.year.addEventListener('input', () => { if (!pf.period.dataset.manual) pf.period.value = pf.year.value; });
  pf.period.addEventListener('input', () => { pf.period.dataset.manual = pf.period.value && pf.period.value !== pf.year.value ? '1' : ''; });

  function collectProject() {
    const v = n => pf[n].value.trim();
    const slug = v('slug');
    if (!slug) throw new Error('파일 이름(slug)을 입력하세요. 영어 제목이 없으면 직접 영문으로 적어 주세요.');
    const cover = pf.cover.files[0] || null;
    const images = [...pf.images.files];
    const files = []; // {name, file}
    let n = 0;
    if (cover) files.push({ name: `${slug}_${n++}${ext(cover)}`, file: cover, cover: true });
    images.forEach(f => files.push({ name: `${slug}_${n++}${ext(f)}`, file: f }));

    const media = $$('.row.media', pf).map(r => {
      const k = r.querySelector('[name=mkind]').value, val = r.querySelector('[name=mval]').value.trim();
      if (!val) return null;
      if (k === 'youtube') return `  - youtube: ${q(ytId(val))}`;
      if (k === 'vimeo') return `  - vimeo: ${q(vimeoId(val))}`;
      if (k === 'soundcloud') return `  - soundcloud: ${q(val)}`;
      if (k === 'bandcamp_album') return `  - bandcamp: { album: ${q(bcId(val))} }`;
      if (k === 'bandcamp_track') return `  - bandcamp: { track: ${q(bcId(val))} }`;
    }).filter(Boolean);
    const links = $$('.row.link', pf).map(r => {
      const l = r.querySelector('[name=llabel]').value.trim(), u = r.querySelector('[name=lurl]').value.trim();
      return u ? `  - label: ${q(l || u)}\n    url: ${q(u)}` : null;
    }).filter(Boolean);

    const fm = [`title: ${q(v('title'))}`];
    if (v('title_en')) fm.push(`title_en: ${q(v('title_en'))}`);
    fm.push(`year: ${v('year')}`, `type: ${v('type')}`);
    const coverFile = files.find(f => f.cover);
    if (coverFile) fm.push(`cover: /img/${coverFile.name}`);
    if (pf.featured.checked) fm.push('featured: true');
    if (media.length) fm.push('media:', ...media);
    if (links.length) fm.push('links:', ...links);
    fm.push('# CV 항목 (cv: exhibition|performance|dance|workshop|research|false)', `cv: ${v('cv')}`);
    if (v('cv') !== 'false') {
      fm.push(`period: ${q(v('period'))}`);
      for (const k of ['event', 'event_en', 'venue', 'venue_en', 'role', 'role_en']) if (v(k)) fm.push(`${k}: ${q(v(k))}`);
    }
    const bodyParts = [];
    if (v('body_ko')) bodyParts.push(v('body_ko'));
    if (v('body_en')) bodyParts.push(v('body_en'));
    const bodyImgs = files.filter(f => !f.cover).map(f => `![](/img/${f.name})`).join('\n');
    if (bodyImgs) bodyParts.push(bodyImgs);
    const md = `---\n${fm.join('\n')}\n---\n\n${bodyParts.join('\n\n')}\n`;
    return { slug, md, files };
  }

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
      if (await exists('_projects', fname) && !confirm(`_projects/${fname} 가 이미 있습니다. 덮어쓸까요?`)) return;
      for (const f of files) if (await exists('img', f.name) && !confirm(`img/${f.name} 가 이미 있습니다. 덮어쓸까요?`)) return;
      st.textContent = '저장 중…';
      for (const f of files) await writeBlob('img', f.name, f.file);
      await writeText('_projects', fname, md);
      st.textContent = `저장됨: _projects/${fname}` + (files.length ? ` + 이미지 ${files.length}개` : '') + ` → 미리보기: /projects/${slug.replace(/_/g, '-')}/`;
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
})();
