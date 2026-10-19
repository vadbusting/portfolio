const rawImages = [
  '../image/te_rough_nakamen_5.webp',
  '../image/2410_JA_owari_B3_10.webp',
  '../image/BRICH_5.webp',
  '../image/2411_brich_B4_ge_ol_9.webp',
  '../image/acb_3_5.webp',
  '../image/2411_acteng_A4_ge_ol_9.webp',
  '../image/supernurse_te_rough_5.webp',
  '../image/2412_Bee-NS_A4-1.webp',
  '../image/Harikisama_5.webp',
  '../image/241122_c21hariki_B5_5.webp',
  '../image/HALLO_5.webp',
  '../image/2411_hallo_A4_ge_ol_9.webp',
  '../image/anshin_souzoku_cafe_meeting_0703_5.webp',
  '../image/a4_2_5.webp',
  '../image/te_rough_4_5.webp',
  '../image/shoko_9.webp',
  '../image/B3_rough_page_1.webp',
  '../image/hotta_shoji_B3_9.webp'
];

const normalizeAssetPath = (value) => (
  typeof value === 'string' && typeof value.normalize === 'function'
    ? value.normalize('NFC')
    : value
);

const images = rawImages.map(normalizeAssetPath);

export const initTrail = () => {
  const trailContainer = document.getElementById('image-trail-container');
  if (!trailContainer) return;

  let imageIndex = Math.floor(Math.random() * images.length);
  let moveCount = 0;

  const createTrail = (x, y) => {
    moveCount++;
    if (moveCount % 10 !== 0) return;

    const img = document.createElement('img');
    img.src = images[imageIndex];
    img.className = 'trail-image trail-image--mobile';

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    trailContainer.appendChild(img);

    const animation = img.animate([
      { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0.85, filter: 'grayscale(100%)' },
      { transform: `translate(-50%, -50%) scale(0.9) translate(${Math.random() * 24 - 12}px, ${Math.random() * 24 - 12}px)`, opacity: 0, filter: 'grayscale(0%)' }
    ], {
      duration: 1150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });

    animation.onfinish = () => img.remove();
    imageIndex = (imageIndex + 1) % images.length;
  };

  const handleMove = (event) => {
    const touch = event.touches ? event.touches[0] : null;
    const x = touch ? touch.clientX : event.clientX;
    const y = touch ? touch.clientY : event.clientY;
    if (typeof x === 'number' && typeof y === 'number') {
      createTrail(x, y);
    }
  };

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('touchmove', handleMove, { passive: true });
};
