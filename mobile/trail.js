const images = [
  '../image/手ラフ中面 5.webp',
  '../image/2410_JA_owari_B3_ 10.webp',
  '../image/BRICH 5.webp',
  '../image/2411_brich_B4_ge_ol 9.webp',
  '../image/アクビィ3 5.webp',
  '../image/2411_acteng_A4_ge_ol 9.webp',
  '../image/スーパーナース手ラフ 5.webp',
  '../image/2412_Bee-NS_A4-1.webp',
  '../image/Harikisama 5.webp',
  '../image/241122_c21hariki_B5_ 5.webp',
  '../image/HALLO 5.webp',
  '../image/2411_hallo_A4_ge_ol 9.webp',
  '../image/安心相続カフェ打合せ用資料0703 5.webp',
  '../image/a4 2 5.webp',
  '../image/手ラフ 4 5.webp',
  '../image/初校 9.webp',
  '../image/B3rough-ページ1.webp',
  '../image/堀田商事_B3_ 9.webp'
];

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
