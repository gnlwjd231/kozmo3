import { lerp } from '../utils/lerp.js';

export function initIntroScene() {
  const scaleWrap = document.querySelector('.intro-scale-wrap');
  const layers    = document.querySelectorAll('.parallax-layer[data-speed]');
  const clip      = document.querySelector('.intro-parallax-clip');

  if (!scaleWrap || !layers.length) return;

  /* ── 1. Scroll → Scale (GSAP ScrollTrigger) ─────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(scaleWrap, {
    scale: 0.55,
    ease: 'none',
    scrollTrigger: {
      trigger: '.intro-scene',
      start: 'top top',
      end: 'bottom top',
      scrub: 2,             // 스크롤 반응 부드러움
      onUpdate: (self) => {
        // scale 진행도에 따라 border-radius 추가 (공간감 강조)
        const r = self.progress * 24;
        clip.style.borderRadius = `${r}px`;
      }
    }
  });

  /* ── 2. Mouse → Layered Parallax ────────────────────────────────── */
  // 레이어별 목표 위치 (target)
  const targets = Array.from(layers).map(() => ({ x: 0, y: 0 }));
  // 레이어별 현재 위치 (lerp 적용)
  const current = Array.from(layers).map(() => ({ x: 0, y: 0 }));

  // 마우스 중심 기준 -1 ~ +1 정규화
  let normX = 0;
  let normY = 0;

  document.addEventListener('mousemove', (e) => {
    normX = (e.clientX / window.innerWidth  - 0.5) * 2;
    normY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── 3. RAF 루프 ─────────────────────────────────────────────────── */
  const MOVE_AMOUNT = 38; // px, 레이어가 최대로 이동하는 거리 기준

  function tick() {
    layers.forEach((layer, i) => {
      const speed = parseFloat(layer.dataset.speed);

      // 각 레이어의 목표 위치
      targets[i].x = -normX * MOVE_AMOUNT * speed;
      targets[i].y = -normY * MOVE_AMOUNT * speed;

      // lerp로 부드럽게 따라가기
      current[i].x = lerp(current[i].x, targets[i].x, 0.07);
      current[i].y = lerp(current[i].y, targets[i].y, 0.07);

      layer.style.transform =
        `translate(${current[i].x}px, ${current[i].y}px)`;
    });

    requestAnimationFrame(tick);
  }

  tick();
}
