/* 프로젝트 페이지 이미지 라이트박스 — 클릭하면 가운데에 크게, 좌우 키/버튼으로 다음 사진, Esc·바깥 클릭으로 닫기 */
(function () {
  'use strict';
  const imgs = [...document.querySelectorAll('.project-body img')];
  if (!imgs.length) return;
  const box = document.createElement('div');
  box.className = 'lightbox'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '이미지 크게 보기');
  box.innerHTML = '<button class="lb-close" aria-label="닫기">×</button><button class="lb-prev" aria-label="이전">‹</button><img alt=""><button class="lb-next" aria-label="다음">›</button><div class="lb-count"></div>';
  document.body.appendChild(box);
  const big = box.querySelector('img'), count = box.querySelector('.lb-count');
  let i = 0, lastFocus = null;
  const show = n => { i = (n + imgs.length) % imgs.length; big.src = imgs[i].currentSrc || imgs[i].src; big.alt = imgs[i].alt || ''; count.textContent = imgs.length > 1 ? `${i + 1} / ${imgs.length}` : ''; box.classList.toggle('single', imgs.length < 2); };
  const open = n => { lastFocus = document.activeElement; show(n); box.hidden = false; document.body.classList.add('lb-open'); box.querySelector('.lb-close').focus(); };
  const close = () => { box.hidden = true; document.body.classList.remove('lb-open'); if (lastFocus) lastFocus.focus(); };
  imgs.forEach((im, n) => { im.style.cursor = 'zoom-in'; im.tabIndex = 0; im.addEventListener('click', () => open(n)); im.addEventListener('keydown', e => { if (e.key === 'Enter') open(n); }); });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); show(i - 1); });
  box.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); show(i + 1); });
  box.addEventListener('click', e => { if (e.target === box || e.target === big) close(); });
  document.addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1); });
  // 모바일 스와이프
  let x0 = null; box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1); x0 = null; });
})();
