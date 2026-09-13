/* 작업 그래프 뷰 — 매체(허브) · 태그 · 작업 노드를 d3-force로 그립니다.
   노드 크기: 대표 작업 + 미디어 수 + 연결 수 (+ 나중에 조회수: window.GRAPH_VIEWS[url] 이 있으면 반영) */
(function () {
  'use strict';
  const D = window.GRAPH_DATA; if (!D || !window.d3) return;
  const el = document.getElementById('graph');
  const tip = document.getElementById('graph-tip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TYPE_COLOR = { installation: '#64ffb4', performance: '#ffb464', sound: '#64c8ff', workshop: '#e08cff', research: '#ff7a9a' };
  const TAG_COLOR = '#8a8a94', LINE = '#2a2a30';

  // ── 노드/링크 구성 ──────────────────────────────────────────────
  const nodes = [], links = [], byId = new Map();
  const add = n => { byId.set(n.id, n); nodes.push(n); return n; };
  const types = [...new Set(D.works.map(w => w.type))];
  types.forEach(t => add({ id: 'type:' + t, kind: 'type', label: D.typeLabels[t] || t, type: t, deg: 0 }));
  const tagSet = new Set(D.works.flatMap(w => w.tags || []));
  tagSet.forEach(t => add({ id: 'tag:' + t, kind: 'tag', label: t, deg: 0 }));
  D.works.forEach(w => {
    const n = add({ id: w.id, kind: 'work', label: w.title, w, type: w.type, deg: 0 });
    const link = (a, b, kind) => { links.push({ source: a, target: b, kind }); byId.get(a).deg++; byId.get(b).deg++; };
    link(n.id, 'type:' + w.type, 'type');
    (w.tags || []).forEach(t => link(n.id, 'tag:' + t, 'tag'));
  });
  const views = window.GRAPH_VIEWS || null;
  const maxViews = views ? Math.max(1, ...Object.values(views)) : 1;
  const radius = n => {
    if (n.kind === 'type') return 14 + n.deg * 0.5;
    if (n.kind === 'tag') return 3.5 + Math.min(n.deg, 10) * 0.9;
    let r = 5 + Math.min(n.w.media, 4) * 1.4 + (n.w.featured ? 4 : 0) + Math.min(n.deg, 8) * 0.7;
    if (views && views[n.id]) r += 8 * Math.log1p(views[n.id]) / Math.log1p(maxViews);
    return r;
  };
  nodes.forEach(n => { n.r = radius(n); });
  const color = n => n.kind === 'tag' ? TAG_COLOR : TYPE_COLOR[n.type] || '#ccc';

  // ── SVG ─────────────────────────────────────────────────────────
  let W = el.clientWidth, H = el.clientHeight;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', '작업 연결 그래프');
  const g = svg.append('g');
  const linkSel = g.append('g').attr('class', 'links').selectAll('line').data(links).join('line')
    .attr('stroke', LINE).attr('stroke-width', d => d.kind === 'type' ? 1.2 : 0.8).attr('stroke-opacity', 0.9);
  const nodeSel = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g')
    .attr('class', d => 'node ' + d.kind).style('cursor', d => d.kind === 'work' ? 'pointer' : 'grab');
  nodeSel.append('circle').attr('r', d => d.r).attr('fill', d => d.kind === 'tag' ? '#17171b' : color(d))
    .attr('stroke', d => color(d)).attr('stroke-width', d => d.kind === 'tag' ? 1.2 : 0)
    .attr('fill-opacity', d => d.kind === 'work' ? 0.85 : 1);
  nodeSel.append('text').text(d => d.label).attr('class', d => 'lbl ' + d.kind)
    .attr('dy', d => d.kind === 'type' ? 4 : d.r + 11).attr('text-anchor', 'middle')
    .attr('fill', d => d.kind === 'type' ? '#0e0e10' : d.kind === 'tag' ? TAG_COLOR : '#e8e8ea');

  // ── 시뮬레이션 ───────────────────────────────────────────────────
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(l => l.kind === 'type' ? 110 : 70).strength(l => l.kind === 'type' ? 0.45 : 0.22))
    .force('charge', d3.forceManyBody().strength(d => d.kind === 'type' ? -600 : d.kind === 'tag' ? -160 : -110))
    .force('collide', d3.forceCollide(d => d.r + 4).iterations(2))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('x', d3.forceX(W / 2).strength(0.02)).force('y', d3.forceY(H / 2).strength(0.03));
  const tick = () => {
    linkSel.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
  };
  if (reduced) { sim.stop(); for (let i = 0; i < 300; i++) sim.tick(); tick(); }
  else sim.on('tick', tick).on('end', () => fit(true));

  // ── 확대/이동 ───────────────────────────────────────────────────
  const zoom = d3.zoom().scaleExtent([0.4, 4]).on('zoom', e => { g.attr('transform', e.transform); el.classList.toggle('zoomed', e.transform.k > 1.5); });
  svg.call(zoom);
  // 노드 전체가 화면에 들어오도록 맞춤 (시뮬레이션이 끝났을 때 한 번, 그 전에는 대략)
  let userZoomed = false;
  svg.on('wheel.flag touchstart.flag mousedown.flag', () => { userZoomed = true; });
  const fit = (animate) => {
    if (userZoomed && animate) return;
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 40;
    const k = Math.min(3, Math.max(0.3, 0.92 / Math.max((x1 - x0) / W, (y1 - y0) / H)));
    const t = d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2).scale(k);
    (animate ? svg.transition().duration(600) : svg).call(zoom.transform, t);
  };
  if (reduced) fit(false); else { for (let i = 0; i < 60; i++) sim.tick(); tick(); fit(false); }

  // ── 드래그 ──────────────────────────────────────────────────────
  nodeSel.call(d3.drag()
    .on('start', (e, d) => { if (!reduced) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; if (reduced) { sim.tick(); tick(); } })
    .on('end', (e, d) => { if (!reduced) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  // ── 하이라이트 / 툴팁 / 클릭 ─────────────────────────────────────
  const neighbors = new Map(); links.forEach(l => { (neighbors.get(l.source.id) || neighbors.set(l.source.id, new Set()).get(l.source.id)).add(l.target.id); (neighbors.get(l.target.id) || neighbors.set(l.target.id, new Set()).get(l.target.id)).add(l.source.id); });
  function focus(d) {
    if (!d) { nodeSel.classed('dim', false).classed('lit', false); linkSel.classed('dim', false).classed('lit', false); return; }
    const nb = neighbors.get(d.id) || new Set();
    nodeSel.classed('lit', n => n === d || nb.has(n.id)).classed('dim', n => !(n === d || nb.has(n.id)));
    linkSel.classed('lit', l => l.source === d || l.target === d).classed('dim', l => !(l.source === d || l.target === d));
  }
  function showTip(d, x, y) {
    if (d.kind === 'work') tip.innerHTML = `<b>${d.w.title}</b>${d.w.title_en ? ` <span class="en">${d.w.title_en}</span>` : ''}<br><span class="meta">${d.w.year || ''} · ${D.typeLabels[d.type] || d.type}${d.w.tags.length ? ' · ' + d.w.tags.join(', ') : ''}</span>`;
    else tip.innerHTML = `<b>${d.label}</b><br><span class="meta">${d.deg}개 작업</span>`;
    tip.hidden = false; const r = el.getBoundingClientRect();
    tip.style.left = Math.min(x - r.left + 14, r.width - tip.offsetWidth - 8) + 'px'; tip.style.top = (y - r.top + 14) + 'px';
  }
  let touched = null;
  nodeSel.on('mouseenter', (e, d) => { focus(d); showTip(d, e.clientX, e.clientY); })
    .on('mousemove', (e, d) => showTip(d, e.clientX, e.clientY))
    .on('mouseleave', () => { focus(null); tip.hidden = true; })
    .on('click', (e, d) => {
      if (d.kind !== 'work') { focus(d); return; }
      if (e.pointerType === 'touch' && touched !== d) { touched = d; focus(d); showTip(d, e.clientX, e.clientY); return; } // 모바일: 첫 탭은 미리보기
      location.href = d.id;
    });
  svg.on('click', e => { if (e.target === svg.node()) { focus(null); tip.hidden = true; touched = null; } });

  // ── 범례 (매체 토글) ─────────────────────────────────────────────
  const legend = document.getElementById('graph-legend'); const hidden = new Set();
  types.forEach(t => {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<i style="background:${TYPE_COLOR[t]}"></i>${D.typeLabels[t] || t}`;
    b.onclick = () => { hidden.has(t) ? hidden.delete(t) : hidden.add(t); b.classList.toggle('off', hidden.has(t)); apply(); };
    legend.appendChild(b);
  });
  function apply() {
    const off = n => n.kind === 'work' ? hidden.has(n.type) : n.kind === 'type' ? hidden.has(n.type) : ![...(neighbors.get(n.id) || [])].some(id => !hidden.has(byId.get(id).type));
    nodeSel.style('display', n => off(n) ? 'none' : null);
    linkSel.style('display', l => off(l.source) || off(l.target) ? 'none' : null);
  }

  // ── 리사이즈 ────────────────────────────────────────────────────
  addEventListener('resize', () => { W = el.clientWidth; H = el.clientHeight; svg.attr('width', W).attr('height', H); sim.force('center', d3.forceCenter(W / 2, H / 2)).force('x', d3.forceX(W / 2).strength(0.03)).force('y', d3.forceY(H / 2).strength(0.05)); if (!reduced) sim.alpha(0.3).restart(); });
})();
