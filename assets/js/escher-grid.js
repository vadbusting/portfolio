/**
 * TESHIMA LAB Portfolio — Conformal Logarithmic Droste Spiral Grid
 * High-performance 2D canvas effect shared between LP and Presentation decks.
 */
export function initEscherConformalGrid(options = {}) {
  const canvas = document.getElementById(options.canvasId || 'escherCanvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const useWindowSize = options.useWindowSize ?? false;
  const getScrollVelocity = options.getScrollVelocity || (() => 0);

  let rotationOffset = 0;
  let targetRotation = 0;
  let scaleFactor = 1.0;
  let targetScale = 1.0;

  function resizeCanvas() {
    if (useWindowSize) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = canvas.clientWidth || 1280;
      canvas.height = canvas.clientHeight || 440;
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const coverTop = document.querySelector(options.triggerSelector || '.cover-top');
  if (coverTop) {
    coverTop.addEventListener('mousemove', (e) => {
      const rect = coverTop.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotation = x * Math.PI * 0.75;
      targetScale = 1.0 + y * 0.25;
    });

    coverTop.addEventListener('mouseleave', () => {
      targetRotation = 0;
      targetScale = 1.0;
    });
  }

  let time = 0;

  function draw() {
    time += 1.0;
    const scrollVel = getScrollVelocity();

    rotationOffset += (targetRotation + (scrollVel * 0.015) - rotationOffset) * 0.08;
    scaleFactor += (targetScale + (scrollVel * 0.01) - scaleFactor) * 0.08;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width - 150;
    const cy = 150;

    const numSpirals = 22;
    const p = 0.55;
    const q = 1.0 / p;
    const maxRadius = Math.max(canvas.width, canvas.height) * 1.5;

    ctx.lineWidth = 1.5;

    const autoSpin = time * 0.002 + (scrollVel * 0.002);
    const autoScale = 0.95 + Math.sin(time * 0.004) * 0.05 + (scrollVel * 0.005);

    for (let i = 0; i < numSpirals; i++) {
      const startAngle = (i / numSpirals) * Math.PI * 2 + rotationOffset + autoSpin;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + (1 - i / numSpirals) * 0.16})`;

      for (let theta = 0; theta < 22; theta += 0.04) {
        const r = 1.5 * Math.exp(p * theta) * scaleFactor * autoScale;
        if (r > maxRadius) break;
        const x = cx + r * Math.cos(theta + startAngle);
        const y = cy + r * Math.sin(theta + startAngle);
        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < numSpirals; i++) {
      const startAngle = (i / numSpirals) * Math.PI * 2 - rotationOffset - autoSpin;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + (1 - i / numSpirals) * 0.16})`;

      for (let theta = 0; theta < 22; theta += 0.04) {
        const r = 1.5 * Math.exp(q * theta) * scaleFactor * autoScale;
        if (r > maxRadius) break;
        const x = cx + r * Math.cos(-theta + startAngle);
        const y = cy + r * Math.sin(-theta + startAngle);
        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  draw();
  return { resize: resizeCanvas };
}

if (typeof window !== 'undefined') {
  window.initEscherConformalGrid = initEscherConformalGrid;
}
