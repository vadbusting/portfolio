const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const curNum = document.getElementById('currentSlideNum');
const totalNum = document.getElementById('totalSlideNum');
let idx = 0;
const total = slides.length;
if (totalNum) totalNum.textContent = total;

/* ── THREE-D SLIDE TRANSITION (WebGL-like Dynamic CSS 3D Transition) ── */
function go(n) {
  const targetIdx = Math.max(0, Math.min(n, total - 1));
  if (targetIdx === idx) return;
  const direction = targetIdx > idx ? 1 : -1;

  const currentSlide = slides[idx];
  const nextSlide = slides[targetIdx];

  // 1. Animate outgoing slide away to the back-left or back-right
  currentSlide.classList.remove('active');
  currentSlide.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
  currentSlide.style.transform = `translate3d(${direction * -100}%, 0, -500px) rotateY(${direction * -45}deg)`;
  currentSlide.style.opacity = '0';
  currentSlide.style.pointerEvents = 'none';

  // 2. Set incoming slide initial state (3D far-right or far-left) instantly
  idx = targetIdx;

  nextSlide.style.transition = 'none';
  nextSlide.style.transform = `translate3d(${direction * 100}%, 0, -500px) rotateY(${direction * 45}deg)`;
  nextSlide.style.opacity = '0';

  // Force a reflow
  void nextSlide.offsetHeight;

  // 3. Animate incoming slide to standard position
  nextSlide.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
  nextSlide.style.transform = 'translate3d(0, 0, 0) rotateY(0deg)';
  nextSlide.style.opacity = '1';
  nextSlide.style.pointerEvents = 'auto';
  nextSlide.classList.add('active');

  // Update state
  if (curNum) curNum.textContent = idx + 1;
  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === total - 1;
}

if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); go(idx - 1); });
if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); go(idx + 1); });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(idx + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
});

// Touch swipe navigation for Mobile & Tablet
let touchStartX = null;
let touchStartY = null;
document.addEventListener('touchstart', e => {
  if (!e.touches || e.touches.length !== 1) return;
  if (e.target.closest('.control-bar, .presentation-back-btn')) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (touchStartX === null || touchStartY === null || !e.changedTouches || !e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    if (dx < 0) go(idx + 1);
    else go(idx - 1);
  }
}, { passive: true });

let escherResize = null;

function scale() {
  const deck = document.getElementById('slideDeck');
  if (!deck) return;
  const w = window.innerWidth || document.documentElement.clientWidth || 1280;
  const h = window.innerHeight || document.documentElement.clientHeight || 720;
  const aspect = w / Math.max(1, h);
  const baseAspect = 1280 / 720;

  // In ultra-wide / mobile landscape viewports (aspect > 16:9), expand deck width to eliminate left/right black bars
  if (aspect > baseAspect) {
    const dynamicW = Math.ceil(720 * aspect);
    deck.style.width = `${dynamicW}px`;
    deck.style.height = '720px';
    const s = h / 720;
    deck.style.transform = `scale(${s})`;
  } else {
    deck.style.width = '1280px';
    deck.style.height = '720px';
    const s = Math.max(0.28, Math.min(w / 1280, h / 720, 1));
    deck.style.transform = `scale(${s})`;
  }
  if (typeof escherResize === 'function') escherResize();
}

// ── ESCHER CONFORMAL SPIRAL GRID (DROSTE EFFECT) ON 2D CANVAS ──
function initEscherConformalGrid() {
  if (typeof window.initEscherConformalGrid === 'function') {
    const instance = window.initEscherConformalGrid({
      canvasId: 'escherCanvas',
      useWindowSize: false,
      triggerSelector: '.cover-top'
    });
    if (instance) escherResize = instance.resize;
  }
}

window.addEventListener('resize', scale);
window.addEventListener('orientationchange', () => {
  [0, 80, 200, 400].forEach(d => setTimeout(scale, d));
});
window.addEventListener('load', () => {
  scale();
  initEscherConformalGrid();
});
scale();
setTimeout(scale, 150);
if (prevBtn) prevBtn.disabled = true;

const presBack = document.getElementById('presBackBtn');
if (presBack) {
  presBack.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.history.length > 1 && document.referrer && document.referrer.includes(location.host)) {
      window.history.back();
    } else {
      window.location.href = 'index.html#presentation';
    }
  });
}
