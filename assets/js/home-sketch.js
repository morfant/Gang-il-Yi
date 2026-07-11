/*
 * 홈 헤더 제너러티브 스케치 (p5.js instance mode)
 * ─ 교체 방법: drawWaves() 안의 내용을 원하는 스케치로 바꾸거나,
 *   OpenProcessing 스케치의 setup/draw 내용을 s.setup/s.draw로 옮기면 됩니다.
 *   캔버스는 #p5-header 크기에 맞춰 생성/리사이즈됩니다.
 * ─ 성능 장치(그대로 두세요): 탭 숨김/화면 밖 스크롤 시 정지,
 *   prefers-reduced-motion 시 정지 화면 1프레임만 렌더.
 */
(function () {
  var container = document.getElementById('p5-header');
  if (!container || typeof p5 === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sketch = function (s) {
    var t = 0;

    function drawWaves() {
      s.clear();
      var w = s.width, h = s.height;
      var lines = 28;
      s.noFill();
      for (var i = 0; i < lines; i++) {
        var yBase = (h / (lines + 1)) * (i + 1);
        var alpha = s.map(i, 0, lines - 1, 18, 90);
        var isAccent = i % 7 === 3;
        if (isAccent) s.stroke(100, 255, 180, alpha + 40);
        else s.stroke(232, 232, 234, alpha);
        s.strokeWeight(isAccent ? 1.2 : 0.7);
        s.beginShape();
        for (var x = 0; x <= w; x += 6) {
          var n = s.noise(x * 0.0018, i * 0.15, t);
          var y = yBase + (n - 0.5) * h * 0.5 * s.sin(t * 0.5 + i * 0.2);
          s.vertex(x, y);
        }
        s.endShape();
      }
      t += 0.008;
    }

    s.setup = function () {
      var c = s.createCanvas(container.offsetWidth, container.offsetHeight);
      c.parent(container);
      s.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
      s.frameRate(28);
      if (reduceMotion) {
        drawWaves();
        s.noLoop();
      }
    };

    s.draw = function () {
      if (!reduceMotion) drawWaves();
    };

    s.windowResized = function () {
      s.resizeCanvas(container.offsetWidth, container.offsetHeight);
      if (reduceMotion) drawWaves();
    };

    // 탭이 숨겨지면 정지
    document.addEventListener('visibilitychange', function () {
      if (reduceMotion) return;
      if (document.hidden) s.noLoop();
      else s.loop();
    });

    // 헤더가 화면 밖으로 스크롤되면 정지
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (reduceMotion) return;
        entries.forEach(function (e) {
          if (e.isIntersecting) s.loop();
          else s.noLoop();
        });
      }).observe(container);
    }
  };

  new p5(sketch);
})();
