/* 홈 그리드 타입 필터: 버튼 클릭 → data-type 매칭 카드만 표시, 빈 연도 그룹은 헤딩째 숨김 */
(function () {
  var bar = document.getElementById('filter-bar');
  if (!bar) return;

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;

    bar.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });

    var f = btn.dataset.filter;

    document.querySelectorAll('.card').forEach(function (c) {
      c.classList.toggle('is-hidden', f !== 'all' && c.dataset.type !== f);
    });

    document.querySelectorAll('.year-group').forEach(function (g) {
      g.classList.toggle('is-hidden', !g.querySelector('.card:not(.is-hidden)'));
    });

    var featured = document.querySelector('.featured');
    if (featured) {
      featured.classList.toggle('is-hidden', !featured.querySelector('.card:not(.is-hidden)'));
    }
  });
})();
