/**
 * Cinematic Glass Shatter Effect
 * Fractures the screen into realistic polygonal crystalline glass shards upon hovering
 * any portfolio thumbnail, leaving only the active thumbnail intact and pristine.
 */

export function createGlassShatterController(canvas) {
  if (!canvas) return { setHover() {}, update() {}, resize() {} };

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let shatterProgress = 0;
  let shatterTarget = 0;
  let isHovered = false;
  let shards = [];
  let currentQuad = null;
  let activeQuadGetter = null;
  let wasActive = false;

  function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shards = []; // Invalidate shard grid on resize
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Point in polygon test (Ray casting algorithm)
  function pointInQuad(px, py, quad) {
    if (!quad || quad.length < 4) return false;
    let inside = false;
    for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
      const xi = quad[i].x, yi = quad[i].y;
      const xj = quad[j].x, yj = quad[j].y;
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi + 1e-7) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Generate Delaunay / Voronoi style polygonal glass shards
  function generateShards(quad) {
    const newShards = [];
    const cols = 9;
    const rows = 6;
    const cellW = width / cols;
    const cellH = height / rows;

    // Grid of jittered seed points
    const grid = [];
    for (let r = 0; r <= rows; r++) {
      grid[r] = [];
      for (let c = 0; c <= cols; c++) {
        const jx = (c === 0 || c === cols) ? 0 : (Math.random() - 0.5) * cellW * 0.75;
        const jy = (r === 0 || r === rows) ? 0 : (Math.random() - 0.5) * cellH * 0.75;
        grid[r][c] = {
          x: Math.min(width, Math.max(0, c * cellW + jx)),
          y: Math.min(height, Math.max(0, r * cellH + jy))
        };
      }
    }

    // Quad center
    let qcX = width / 2;
    let qcY = height / 2;
    if (quad && quad.length === 4) {
      qcX = (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4;
      qcY = (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4;
    }

    // Split each grid quad into 2 triangular / polygonal shards
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p0 = grid[r][c];
        const p1 = grid[r][c + 1];
        const p2 = grid[r + 1][c + 1];
        const p3 = grid[r + 1][c];

        // Diagonal split
        const tri1 = [p0, p1, p2];
        const tri2 = [p0, p2, p3];

        [tri1, tri2].forEach((pts, tIdx) => {
          const cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
          const cy = (pts[0].y + pts[1].y + pts[2].y) / 3;

          const inside = pointInQuad(cx, cy, quad);

          // Vector pointing away from thumbnail center
          const dx = cx - qcX;
          const dy = cy - qcY;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          // Perpendicular tangent vector for tumble
          newShards.push({
            pts: pts.map(p => ({ x: p.x, y: p.y })),
            cx,
            cy,
            inside,
            vx: nx,
            vy: ny,
            dist,
            rotSpeed: ((Math.random() - 0.5) * 1.8) * (tIdx === 0 ? 1 : -1),
            dispFactor: 0.6 + Math.random() * 0.8,
            gravity: 0.5 + Math.random() * 0.9,
            glintAngle: Math.random() * Math.PI * 2,
            opacityOffset: Math.random() * 0.2
          });
        });
      }
    }
    return newShards;
  }

  function setHover(hover, quadGetter) {
    isHovered = Boolean(hover);
    shatterTarget = isHovered ? 1.0 : 0.0;
    if (quadGetter) activeQuadGetter = quadGetter;
    if (isHovered && activeQuadGetter) {
      currentQuad = activeQuadGetter();
      shards = generateShards(currentQuad);
    }
  }

  function update(dt) {
    const rate = shatterTarget > shatterProgress ? 12.0 : 7.0;
    shatterProgress += (shatterTarget - shatterProgress) * (1 - Math.exp(-dt * rate));

    if (shatterProgress > 0.001) {
      wasActive = true;
      render();
    } else if (wasActive) {
      ctx.clearRect(0, 0, width, height);
      wasActive = false;
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    if (!shards.length && currentQuad) {
      shards = generateShards(currentQuad);
    }
    if (!shards.length) return;

    const prog = shatterProgress;
    const easeProg = prog * prog * (3 - 2 * prog);

    ctx.save();

    // 1. Draw fractured glass shards outside the thumbnail
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.inside) continue; // Keep the thumbnail clear and pristine!

      // Physics displacement: outward explosion + gravity drop
      const disp = easeProg * 48 * s.dispFactor;
      const grav = prog * prog * 70 * s.gravity;
      const tx = s.vx * disp;
      const ty = s.vy * disp + grav;
      const rot = s.rotSpeed * easeProg * 0.45;
      const scale = 1.0 - easeProg * 0.06;

      ctx.save();
      ctx.translate(s.cx + tx, s.cy + ty);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.translate(-s.cx, -s.cy);

      // Path
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let p = 1; p < s.pts.length; p++) {
        ctx.lineTo(s.pts[p].x, s.pts[p].y);
      }
      ctx.closePath();

      // Prismatic frosted glass tint
      const glassAlpha = Math.min(0.72, 0.28 + easeProg * 0.40 + s.opacityOffset * 0.1);
      ctx.fillStyle = `rgba(16, 17, 18, ${glassAlpha})`;
      ctx.fill();

      // Specular glass glare reflection across shard face
      const grad = ctx.createLinearGradient(
        s.pts[0].x, s.pts[0].y,
        s.pts[2].x, s.pts[2].y
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.08 * prog})`);
      grad.addColorStop(0.5, `rgba(180, 220, 240, ${0.18 * prog})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${0.03 * prog})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Razor-sharp crystalline fracture crack border
      ctx.strokeStyle = `rgba(245, 250, 255, ${0.35 + easeProg * 0.55})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    // 2. High-energy crystalline fracture halo framing the intact thumbnail
    if (currentQuad && currentQuad.length === 4) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentQuad[0].x, currentQuad[0].y);
      for (let q = 1; q < 4; q++) {
        ctx.lineTo(currentQuad[q].x, currentQuad[q].y);
      }
      ctx.closePath();

      // Neon-cyan fracture energy pulse on perimeter
      ctx.shadowColor = 'rgba(0, 229, 255, 0.85)';
      ctx.shadowBlur = 22 * prog;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * prog})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Secondary stress crack lines radiating from 4 corners
      currentQuad.forEach((pt, idx) => {
        const nextPt = currentQuad[(idx + 1) % 4];
        const midX = (pt.x + nextPt.x) / 2;
        const midY = (pt.y + nextPt.y) / 2;
        const dirX = pt.x - midX;
        const dirY = pt.y - midY;

        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + dirX * 0.45 * prog, pt.y + dirY * 0.45 * prog);
        ctx.strokeStyle = `rgba(220, 245, 255, ${0.75 * prog})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });

      ctx.restore();
    }

    ctx.restore();
  }

  return {
    setHover,
    update,
    resize
  };
}
