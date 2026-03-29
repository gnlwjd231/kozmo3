
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

imagesLoaded(document.querySelector('.gallery'), () => {
  initGSAP();
});

function initGSAP() {
  gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

  /* ── 이미지 목록 ─────────────────────────── */
  let IMAGES = [
    'DSC00682.JPG','DSC00915.JPG','DSC00918.JPG','DSC00922.JPG',
    'DSC00928.JPG','DSC00929.JPG','DSC00934.JPG','DSC00935.JPG',
    'DSC00938.JPG','DSC00943.JPG','DSC00949.JPG','DSC00950.JPG',
    'DSC00952.JPG','DSC00957.JPG','DSC00958.JPG','DSC00959.JPG',
    'DSC00969.JPG','DSC00970.JPG','DSC00971.JPG','DSC00972.JPG',
    'DSC00973.JPG','DSC00994.JPG','DSC00996.JPG','DSC00997.JPG',
    'DSC00998.JPG','DSC01001.JPG','DSC01002.JPG','DSC01003.JPG',
    'DSC01005.JPG','DSC01006.JPG','DSC01018.JPG','DSC01021.JPG',
    'DSC01022.JPG','DSC01025.JPG','DSC01030.JPG'
  ];
  IMAGES = shuffle(IMAGES);

  /* ── 레이어 분배 ───────────────────────── */
  const layers = document.querySelectorAll('.layer');
  const fragments = Array.from(layers).map(() => document.createDocumentFragment());
  const allImgs = [];

  IMAGES.forEach((file, index) => {
    const layerIndex = index % layers.length;
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = `/assets/images/${file}`;
    img._widthRatio = gsap.utils.random(0.20, 0.40);
    img._xRatio     = gsap.utils.random(-1.5, 2.5);
    img._yRatio     = gsap.utils.random(-2, 2);
    fragments[layerIndex].appendChild(img);
    allImgs.push(img);
  });

  layers.forEach((layer, i) => layer.appendChild(fragments[i]));

  /* ── 초기 depth 배치 ─────────────── */
  layers.forEach((layer, i) => {
    gsap.set(layer, { z: i * 400, transformOrigin: "50% 50%" });
  });

  function applyLayout() {
    allImgs.forEach(img => {
      gsap.set(img, {
        width:    window.innerWidth * img._widthRatio,
        xPercent: -50,
        yPercent: -50,
        x: img._xRatio * window.innerWidth  * 0.5,
        y: img._yRatio * window.innerHeight * 0.5,
      });
    });
  }

  applyLayout();
  window.addEventListener('resize', () => { applyLayout(); ScrollTrigger.refresh(); });

  /* ── Morph 초기 상태 ─────────────────── */
  gsap.set("#shape", {
    attr: { d: document.querySelector("#shape-square").getAttribute("d") }
  });

  /* ── 마스터 타임라인 (갤러리 → 가로스크롤 순차) ── */
  // Phase 1(0→1): 갤러리 3D 줌아웃
  // Phase 2(1→2): 가로 이동 + morph
  // Phase 3 scroll 비율: .live가 100vh 슬라이드되는 데 필요한 타임라인 duration
  // totalScroll = innerWidth*2 + innerHeight
  // phase3 비중 = innerHeight / innerWidth
  const phase3Duration = window.innerHeight / window.innerWidth;
  const pauseDuration  = .5; // player 노출 유지 구간 (1 = innerWidth 만큼 스크롤)

  gsap.set(".live", { y: "200vh" });

  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#smooth-wrapper",
      pin: true,
      start: "top top",
      end: () => "+=" + (window.innerWidth * (2 + pauseDuration) + window.innerHeight),
      scrub: 1.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    }
  });

  /* Phase 1 : 갤러리 줌아웃 */
  masterTl.fromTo(".camera", { z: 0 }, { z: 300, duration: 1 }, 0);

  layers.forEach(layer => {
    masterTl.to(layer, { z: 2, ease: "none", duration: 1 }, 0);
  });

  layers.forEach((layer, i) => {
    const depth = i / layers.length;
    masterTl.to(layer, { scale: depth * 0.5, duration: 1 }, 0);
  });

  /* Phase 2 : 가로 이동 + morph */
  masterTl
    .to("#smooth-content", {
      x: () => -window.innerWidth,
      ease: "none",
      duration: 1,
      invalidateOnRefresh: true,
    }, 1)
    .to("#shape", {
      morphSVG: { shape: "#shape-cd", shapeIndex: 0 },
      ease: "power2.inOut",
      duration: 0.8,
      transformOrigin: "50% 50%"
    }, 1.1)
    .to(".cd-sheen-overlay", {
      opacity: 1,
      ease: "power2.inOut",
      duration: 0.5,
    }, 1.5)
    /* Phase 3: .live 슬라이드업 (pause 이후 시작) */
    .to(".live", {
      y: 0,
      ease: "power2.inOut",
      duration: phase3Duration * 0.8,
    }, 2 + pauseDuration);

  /* ── Gallery ASCII art 클릭 ─────────── */
  function renderAscii(img, outCanvas) {
    const COLS = 55;
    const W    = outCanvas.width;
    const H    = outCanvas.height;
    const ROWS = Math.round(COLS * (H / W) * 0.5); // 0.5 = monospace char 종횡비

    const sc = document.createElement('canvas');
    sc.width  = COLS;
    sc.height = ROWS;
    const sctx = sc.getContext('2d');
    sctx.drawImage(img, 0, 0, COLS, ROWS);
    const px = sctx.getImageData(0, 0, COLS, ROWS).data;

    const ctx = outCanvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const charW = W / COLS;
    const charH = H / ROWS;
    ctx.font          = `bold ${charH * 1.05}px monospace`;
    ctx.textAlign     = 'left';
    ctx.textBaseline  = 'top';

    const chars = ' .:-=+*#%@';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i  = (y * COLS + x) * 4;
        const r  = px[i], g = px[i + 1], b = px[i + 2];
        const br = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(chars[Math.floor(br * (chars.length - 1))], x * charW, y * charH);
      }
    }
  }

  allImgs.forEach(img => {
    img.addEventListener('click', e => {
      if (img._ascii) return;
      img._ascii = true;
      e.stopPropagation();

      const layer = img.closest('.layer');
      const dpr   = window.devicePixelRatio || 1;

      // img의 실제 표시 크기
      const dispW = parseFloat(img.style.width) || img.offsetWidth;
      const dispH = dispW * (img.naturalHeight / (img.naturalWidth || 1));

      const cvs = document.createElement('canvas');
      cvs.width  = Math.round(dispW * dpr);
      cvs.height = Math.round(dispH * dpr);

      // img와 완전히 동일한 위치: top/left 50% + GSAP transform 그대로 복사
      cvs.style.cssText = `position:absolute;top:50%;left:50%;`
                        + `width:${dispW}px;height:${dispH}px;`
                        + `transform:${img.style.transform};`
                        + `pointer-events:none;`;

      layer.appendChild(cvs);

      try { renderAscii(img, cvs); }
      catch(err) { console.warn('ASCII render:', err); }

      gsap.set(img, { opacity: 0 });

      gsap.timeline({
        onComplete: () => {
          cvs.remove();
          img._ascii = false;
          gsap.set(img, { opacity: 1 });
        }
      })
        .set(cvs, { opacity: 1 })
        .to(cvs, { opacity: 1, duration: 1.6 })
        .set(cvs, { opacity: 0 });
    });
  });

  /* ── 마우스 시차 ─────────────────────── */
  const camera = document.querySelector('.camera');
  let mouse = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  gsap.ticker.add(() => {
    current.x += (mouse.x - current.x) * 0.08;
    current.y += (mouse.y - current.y) * 0.08;

    gsap.set(camera, {
      rotationY: current.x * 5,
      rotationX: -current.y * 5,
      transformPerspective: 1000,
      transformOrigin: "center center",
      force3D: true
    });
  });

  layers.forEach((layer, i) => {
    const depth = i / layers.length;
    gsap.ticker.add(() => {
      gsap.set(layer, {
        x: current.x * depth * 30,
        y: current.y * depth * 30
      });
    });
  });

  /* ── CD 상시 회전 + 클릭 정지/재개 ──── */
  const spinTween = gsap.to('#cd-svg', {
    rotation: '+=360',
    duration: 2,
    ease: 'none',
    repeat: -1,
    transformOrigin: 'center center'
  });

  let cdSpinning = true;
  document.querySelector('#album-art').addEventListener('click', () => {
    if (cdSpinning) {
      // 천천히 감속 → 정지
      gsap.to(spinTween, {
        timeScale: 0,
        duration: 2,
        ease: 'power2.out',
        onComplete: () => { cdSpinning = false; }
      });
    } else {
      // 천천히 가속 → 정상 속도
      cdSpinning = true;
      gsap.to(spinTween, {
        timeScale: 1,
        duration: 1.5,
        ease: 'power2.in'
      });
    }
  });

  ScrollTrigger.refresh();
}


/* ══════════════════════════════════════════
   INTRO
══════════════════════════════════════════ */
(function initIntro() {
  const intro      = document.getElementById('intro');
  const asciiCvs   = document.getElementById('ascii-canvas');
  const glitchR    = document.getElementById('glitch-r');
  const glitchB    = document.getElementById('glitch-b');
  const introLogo  = document.getElementById('intro-logo');

  function buildAndPlay() {
    const dpr   = window.devicePixelRatio || 1;
    const dispW = Math.min(window.innerWidth * 0.65, 520);
    const dispH = dispW * (introLogo.naturalHeight / introLogo.naturalWidth);

    // same-origin 이미지 → 직접 drawImage (CORS taint 없음)
    render(introLogo);

    function render(img) {
    /* ── ASCII pre-render ────────────────── */
    const COLS = 80;
    const ROWS = Math.round(COLS * (dispH / dispW) * 0.5);

    [asciiCvs, glitchR, glitchB].forEach(c => {
      c.width        = Math.round(dispW * dpr);
      c.height       = Math.round(dispH * dpr);
      c.style.width  = dispW + 'px';
      c.style.height = dispH + 'px';
    });

    // 저해상도 샘플링
    const sc = document.createElement('canvas');
    sc.width  = COLS;
    sc.height = ROWS;
    const sctx = sc.getContext('2d');
    sctx.drawImage(img, 0, 0, COLS, ROWS);
    const px = sctx.getImageData(0, 0, COLS, ROWS).data;

    // ASCII → main canvas
    const ctx   = asciiCvs.getContext('2d');
    const charW = asciiCvs.width  / COLS;
    const charH = asciiCvs.height / ROWS;
    ctx.font         = `bold ${charH * 1.1}px monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    const chars = ' .:-=+*#%@';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i  = (y * COLS + x) * 4;
        const r  = px[i], g = px[i + 1], b = px[i + 2];
        const br = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(chars[Math.floor(br * (chars.length - 1))], x * charW, y * charH);
      }
    }

    // glitch 채널용 캔버스에 ASCII 복사
    glitchR.getContext('2d').drawImage(asciiCvs, 0, 0);
    glitchB.getContext('2d').drawImage(asciiCvs, 0, 0);

    // intro-logo 크기 맞추기
    introLogo.style.width  = dispW + 'px';
    introLogo.style.height = dispH + 'px';

    // #logo 위치를 동기적으로 계산 (getBoundingClientRect → force layout)
    const logoEl   = document.querySelector('#logo');
    const logoRect = logoEl.getBoundingClientRect();
    const cRect    = document.getElementById('intro-content').getBoundingClientRect();
    const zx = (logoRect.left + logoRect.width  / 2) - (cRect.left + cRect.width  / 2);
    const zy = (logoRect.top  + logoRect.height / 2) - (cRect.top  + cRect.height / 2);
    const zs = logoRect.width / cRect.width;

    /* ── GSAP Timeline ───────────────────── */
    gsap.set([glitchR, glitchB], { opacity: 0, x: 0 });
    gsap.set(introLogo, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { intro.style.display = 'none'; }
    });

    tl
      // ASCII 홀드
      .to({}, { duration: 0.9 })

      // ── Glitch (총 ~0.4s) ──────────────
      .to([glitchR, glitchB], { opacity: 1, duration: 0.05, ease: 'none' })
      .to(glitchR,         { x:  8,  duration: 0.06, ease: 'none' }, '<')
      .to(glitchB,         { x: -8,  duration: 0.06, ease: 'none' }, '<')
      .to('#intro-content',{ x: -5,  duration: 0.04, ease: 'none' })
      .to(asciiCvs,        { opacity: 0.15, duration: 0.04, ease: 'none' }, '<')
      .to('#intro-content',{ x:  3,  duration: 0.04, ease: 'none' })
      .to(asciiCvs,        { opacity: 1,    duration: 0.03, ease: 'none' }, '<')
      .to('#intro-content',{ x: -2,  duration: 0.03, ease: 'none' })
      .to(glitchR,         { x:  3,  duration: 0.07, ease: 'none' })
      .to(glitchB,         { x: -3,  duration: 0.07, ease: 'none' }, '<')
      .to([glitchR, glitchB], { opacity: 0, x: 0, duration: 0.08 })
      .to('#intro-content',{ x: 0,   duration: 0.06 })

      // ── Crossfade ASCII → 로고 (0.45s) ──
      .to(asciiCvs,  { opacity: 0, duration: 0.45 })
      .to(introLogo, { opacity: 1, duration: 0.45 }, '<')

      // 홀드
      .to({}, { duration: 0.3 })

      // ── Zoom out → #logo 위치로 수렴 ───
      .to('#intro-content', { x: zx, y: zy, scale: zs, duration: 0.8, ease: 'power3.inOut' })
      .to('#intro',         { opacity: 0, duration: 0.3, ease: 'power3.out' }, '<+0.55');
    } // end render
  }

  if (introLogo.complete && introLogo.naturalWidth) {
    buildAndPlay();
  } else {
    introLogo.onload = buildAndPlay;
  }
})();


document.querySelector('.live .ask p:last-child').addEventListener('click', () => {
  const img = document.createElement('img');
  img.src = '/assets/images/beavis-and-butthead-headbanging.gif';
  img.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;top:0;left:0;';
  document.body.appendChild(img);

  const run = () => {
    const iW = img.naturalWidth  || srcImg.offsetWidth  || 120;
    const iH = img.naturalHeight || srcImg.offsetHeight || 120;
    const vW = window.innerWidth;
    const vH = window.innerHeight;

    // 0=top 1=bottom 2=left 3=right
    const edge = Math.floor(Math.random() * 4);

    let fromX, fromY, toX, toY, rotation;

    const PEEK = 200;

    switch (edge) {
      case 0: // 위 – 이미지 180° (뒤집힘)
        rotation = 180;
        fromX = Math.random() * (vW - iW);
        fromY = -iH;
        toX   = fromX;
        toY   = -iH + PEEK;
        break;
      case 1: // 아래 – 정방향 0°
        rotation = 0;
        fromX = Math.random() * (vW - iW);
        fromY = vH;
        toX   = fromX;
        toY   = vH - PEEK;
        break;
      case 2: // 왼쪽 – 90° CW
        rotation = 90;
        fromX = -iW;
        fromY = Math.random() * (vH - iH);
        toX   = -iW + PEEK;
        toY   = fromY;
        break;
      case 3: // 오른쪽 – -90° CCW
        rotation = -90;
        fromX = vW;
        fromY = Math.random() * (vH - iH);
        toX   = vW - PEEK;
        toY   = fromY;
        break;
    }

    gsap.set(img, { x: fromX, y: fromY, rotation, transformOrigin: 'center center' });

    // 쑥 나왔다가 쑥 들어감
    gsap.timeline({ onComplete: () => img.remove() })
      .to(img, { x: toX, y: toY,   duration: 0.18, ease: 'power4.out' })
      .to(img, { x: toX, y: toY,   duration: 0.25             })  // 잠깐 머뭄
      .to(img, { x: fromX, y: fromY, duration: 0.22, ease: 'power3.in' });
  };

  if (img.complete && img.naturalWidth) run();
  else img.onload = run;
});

