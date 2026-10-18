(() => {
// THREE is loaded globally via a separate script tag in HTML

THREE.Cache.enabled = true;

const stage = document.querySelector('.floating-stage');
const canvas = document.getElementById('floating-canvas');
const lightbox = document.getElementById('floating-lightbox');
const lightboxImage = lightbox?.querySelector('.floating-lightbox__image');
const lightboxCloseControls = lightbox?.querySelectorAll('[data-lightbox-close]');
const loaderOverlay = document.getElementById('floating-loader');
const lastPointerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const layoutMetrics = { maxExtent: 0 };
let initialScrollHandled = false;
const ENDING_CARD_THRESHOLD = 0.94;
const CANVAS_FADE_END = 1.0;
const STAGE_SCROLL_LENGTH_SCALE = 4;
let initialRenderPending = false;
let resolveInitialRender;

const normalizeAssetPath = (value) =>
  (typeof value === 'string' && typeof value.normalize === 'function'
    ? value.normalize('NFC')
    : value);

const detectIPad = () => {
  const ua = navigator.userAgent || '';
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const isIPadUA = /ipad/i.test(ua);
  const isTouchMac = /macintosh/i.test(ua) && hasTouch;
  return isIPadUA || isTouchMac;
};

const isIPad = detectIPad();

const applyIPadThinning = (list) => list;

window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
let loaderRevealed = false;
let loaderFallback;

if (!stage || !canvas) {
  console.warn('Floating world stage not found; skipping three.js setup.');
  if (loaderOverlay) {
    loaderOverlay.classList.add('is-hidden');
    loaderOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('is-loading');
} else {
  const loadingManager = new THREE.LoadingManager();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: isIPad ? 'low-power' : 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 10, 36);

  const camera = new THREE.PerspectiveCamera(
    32,
    stage.clientWidth / window.innerHeight,
    0.1,
    1200
  );
  camera.position.set(0, 0, 8);

  // Canvas roundRect fallback polyfill
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
      let r = 8;
      if (typeof radii === 'number') r = radii;
      else if (Array.isArray(radii)) r = radii[0] || 8;
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // 1パネル描画関数（劇中実物拡大写真準拠）
  const drawAccuratePanel = (ctx, x, y, w, h) => {
    const COL_BASE = '#f2efe6';
    const COL_FACE = '#ece7dc';
    const COL_SHADOW = '#c5bfad';
    const COL_LIGHT = '#ffffff';

    // 下地
    ctx.fillStyle = COL_BASE;
    ctx.fillRect(x, y, w, h);

    // 外周の成型段差（角丸プレストレイ）
    const padX = w * 0.04;
    const padY = h * 0.03;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    ctx.fillStyle = COL_SHADOW;
    ctx.beginPath();
    ctx.roundRect(x + padX, y + padY, innerW, innerH, 16);
    ctx.fill();

    ctx.fillStyle = COL_LIGHT;
    ctx.beginPath();
    ctx.roundRect(x + padX + 3, y + padY + 3, innerW - 6, innerH - 6, 14);
    ctx.fill();

    ctx.fillStyle = COL_FACE;
    ctx.beginPath();
    ctx.roundRect(x + padX + 6, y + padY + 6, innerW - 12, innerH - 12, 12);
    ctx.fill();

    // 上下端（八角形の角との境界）の固定ラッチ金具
    const drawLatch = (lx, ly) => {
      ctx.fillStyle = '#8a8473';
      ctx.beginPath();
      ctx.roundRect(lx - 20, ly - 6, 40, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#e6e2d6';
      ctx.fillRect(lx - 14, ly - 4, 28, 5);
      ctx.fillStyle = '#545044';
      ctx.beginPath();
      ctx.arc(lx - 12, ly, 2.5, 0, Math.PI * 2);
      ctx.arc(lx + 12, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawLatch(x + w * 0.28, y + padY + 18);
    drawLatch(x + w * 0.72, y + padY + 18);
    drawLatch(x + w * 0.28, y + h - padY - 18);
    drawLatch(x + w * 0.72, y + h - padY - 18);

    // 上部・下部中央のピン突起
    ctx.fillStyle = '#736d5e';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.11, 5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.5, y + h * 0.89, 5, 0, Math.PI * 2);
    ctx.fill();

    // 四隅の点検ポート
    const drawSquarePort = (px, py) => {
      ctx.fillStyle = COL_SHADOW;
      ctx.fillRect(px - 14, py - 16, 28, 32);
      ctx.fillStyle = COL_LIGHT;
      ctx.fillRect(px - 11, py - 13, 22, 26);
      ctx.fillStyle = '#d5cfbf';
      ctx.fillRect(px - 8, py - 10, 16, 20);
    };
    drawSquarePort(x + w * 0.18, y + h * 0.18);
    drawSquarePort(x + w * 0.82, y + h * 0.18);
    drawSquarePort(x + w * 0.18, y + h * 0.82);
    drawSquarePort(x + w * 0.82, y + h * 0.82);

    // 中央の黒い横長ルーバー窓
    const winW = w * 0.84;
    const winH = h * 0.24;
    const wx = x + (w - winW) / 2;
    const wy = y + (h - winH) / 2 + 10;

    // 縦長の注意書きネームプレート
    const plateW = 44;
    const plateH = 58;
    const plateX = x + w * 0.5 - plateW / 2;
    const plateY = wy - plateH - 28;

    ctx.fillStyle = '#8f8978';
    ctx.fillRect(plateX - 2, plateY - 2, plateW + 4, plateH + 4);
    ctx.fillStyle = '#f9f7f2';
    ctx.fillRect(plateX, plateY, plateW, plateH);
    ctx.fillStyle = '#4c4940';
    ctx.fillRect(plateX + 6, plateY + 10, plateW - 12, 2.5);
    ctx.fillRect(plateX + 10, plateY + 22, plateW - 20, 2.5);
    ctx.fillRect(plateX + 8, plateY + 34, plateW - 16, 2.5);
    ctx.fillRect(plateX + 12, plateY + 44, plateW - 24, 2);

    // 上下の菱形エンボスライン
    const drawRib = (p1, p2, p3) => {
      ctx.strokeStyle = COL_SHADOW;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.stroke();

      ctx.strokeStyle = COL_LIGHT;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p1[0] - 1, p1[1] - 1);
      ctx.lineTo(p2[0], p2[1] - 1.5);
      ctx.lineTo(p3[0] + 1, p3[1] - 1);
      ctx.stroke();
    };

    drawRib([wx - 2, wy - 6], [x + w * 0.5, wy - plateH - 10], [wx + winW + 2, wy - 6]);
    drawRib([wx - 2, wy + winH + 6], [x + w * 0.5, y + h * 0.83], [wx + winW + 2, wy + winH + 6]);

    // 黒窓外枠ベゼル
    ctx.fillStyle = '#a6a090';
    ctx.fillRect(wx - 5, wy - 5, winW + 10, winH + 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 2, wy - 2, winW + 4, winH + 4);

    // 黒窓内部
    ctx.fillStyle = '#060709';
    ctx.fillRect(wx, wy, winW, winH);

    // ルーバーフィン
    ctx.fillStyle = '#1c1e22';
    for (let ly = wy + 7; ly < wy + winH - 4; ly += 8) {
      ctx.fillRect(wx + 3, ly, winW - 6, 2.5);
    }
  };

  // 3D Infinite Discovery One Octagonal Corridor (Film-Accurate Architecture)
  const createInfiniteCorridor = () => {
    const corridorGroup = new THREE.Group();
    scene.add(corridorGroup);
    window.__corridorGroup = corridorGroup;

    // 1024x1024 Film-Accurate Facet Canvas Texture
    const facetCanvas = document.createElement('canvas');
    facetCanvas.width = 1024;
    facetCanvas.height = 1024;
    const sctx = facetCanvas.getContext('2d');
    drawAccuratePanel(sctx, 0, 0, 1024, 1024);

    const facetTexture = new THREE.CanvasTexture(facetCanvas);
    facetTexture.colorSpace = THREE.SRGBColorSpace;
    facetTexture.anisotropy = 4;

    const INRADIUS = 4.8;
    const SIDE_WIDTH = 2 * INRADIUS * Math.tan(Math.PI / 8); // ≈ 3.97
    const PANEL_DEPTH = SIDE_WIDTH * 0.98; // 正方形比率（1:1）
    const SEGMENT_PITCH = PANEL_DEPTH + 0.35; // パネル間のスリット間隔
    const SEGMENT_COUNT = 28;
    const TOTAL_SPAN = SEGMENT_COUNT * SEGMENT_PITCH;
    const Z_START = 8;
    const Z_END = Z_START - TOTAL_SPAN;

    const panelMaterial = new THREE.MeshBasicMaterial({
      map: facetTexture,
      side: THREE.FrontSide,
      fog: true
    });

    const whiteCasingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      fog: true
    });

    const whiteNeonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false
    });

    // 1パネルのジオメトリ
    const planeGeo = new THREE.PlaneGeometry(PANEL_DEPTH, SIDE_WIDTH * 0.98);
    planeGeo.rotateZ(-Math.PI / 2);

    // パネル境界で光る八角形リングの直線蛍光灯
    const slitLightGeo = new THREE.BoxGeometry(SIDE_WIDTH * 0.96, 0.10, 0.14);

    // 外側のホワイトケーシング
    const outerRadius = INRADIUS / Math.cos(Math.PI / 8) + 0.35;
    const outerCylGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, SEGMENT_PITCH, 8, 1, true);
    outerCylGeo.rotateX(Math.PI / 2);
    outerCylGeo.rotateZ(Math.PI / 8);

    const createSegment = () => {
      const seg = new THREE.Group();
      const outerHousing = new THREE.Mesh(outerCylGeo, whiteCasingMaterial);
      seg.add(outerHousing);

      for (let j = 0; j < 8; j++) {
        const angle = j * (Math.PI / 4);
        const facetHolder = new THREE.Group();
        facetHolder.rotation.z = angle;

        // パネル
        const panelMesh = new THREE.Mesh(planeGeo, panelMaterial);
        panelMesh.position.set(0, -INRADIUS, 0);
        panelMesh.rotation.x = -Math.PI / 2;
        facetHolder.add(panelMesh);

        // 輪切り境界の直線蛍光灯
        const lightBar = new THREE.Mesh(slitLightGeo, whiteNeonMaterial);
        lightBar.position.set(0, -(INRADIUS - 0.02), SEGMENT_PITCH / 2);
        facetHolder.add(lightBar);

        seg.add(facetHolder);
      }
      return seg;
    };

    const segments = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const seg = createSegment();
      seg.userData.baseZ = Z_START - i * SEGMENT_PITCH;
      seg.position.z = seg.userData.baseZ;
      corridorGroup.add(seg);
      segments.push(seg);
    }

    return {
      group: corridorGroup,
      update: (scrollOffset) => {
        // scrollOffset is negative when user scrolls down
        // Corridor moves backwards into depth ("背景は奥に")
        const speed = 0.9;
        const offset = scrollOffset * speed;
        for (let i = 0; i < SEGMENT_COUNT; i++) {
          const seg = segments[i];
          const rawZ = seg.userData.baseZ + offset;
          const wrappedZ = ((rawZ - Z_END) % TOTAL_SPAN + TOTAL_SPAN) % TOTAL_SPAN + Z_END;
          seg.position.z = wrappedZ;
        }
      }
    };
  };

  const corridor = createInfiniteCorridor();

  const stackGroup = new THREE.Group();
  scene.add(stackGroup);

  const spacing = 2.2;
  const state = { groupZ: 0, targetGroupZ: 0 };
  let totalDepth = 0;
  let stageMetrics = { top: 0, maxScroll: 1 };

  const textureLoader = new THREE.TextureLoader(loadingManager);

  const fallbackSources = applyIPadThinning([
    'image/portfolio-ページ22 2 65.webp',
    'image/portfolio-ページ22 2 66.webp',
    'image/portfolio-ページ22 2 67.webp',
    'image/portfolio-ページ22 2 68.webp',
  ].map(normalizeAssetPath));

const analysisCanvas = document.createElement('canvas');
const analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true }) || null;

const updateCameraForExtent = () => {
  camera.position.set(0, 0, 8);
  camera.far = 600;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
};

const isMonochromeImage = (image) => {
    if (!analysisCtx) return false;
    const width = Math.max(1, Math.min(image.naturalWidth || image.width || 1, 80));
    const height = Math.max(1, Math.min(image.naturalHeight || image.height || 1, 80));
    analysisCanvas.width = width;
    analysisCanvas.height = height;

    try {
      analysisCtx.clearRect(0, 0, width, height);
      analysisCtx.drawImage(image, 0, 0, width, height);
      const { data } = analysisCtx.getImageData(0, 0, width, height);

      let totalDiff = 0;
      let samples = 0;

      for (let i = 0; i < data.length; i += 24) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        totalDiff += max - min;
        samples += 1;
      }

      const avgDiff = samples > 0 ? totalDiff / samples : 0;
      return avgDiff < 14;
    } catch (error) {
    console.warn('Failed to analyse image for monochrome detection:', error);
      return false;
    }
  };

  const loadTexture = (src) =>
    new Promise((resolve, reject) => {
      // Encode URL properly (don't encode slashes)
      const encodedSrc = src.split('/').map(encodeURIComponent).join('/');
      textureLoader.load(
        encodedSrc,
        (texture) => {
          if (texture && texture.colorSpace !== undefined) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          const isMonochrome = texture.image ? isMonochromeImage(texture.image) : false;
          resolve({ texture, src, isMonochrome });
        },
        undefined,
        () => reject(new Error(`Failed to load ${src}`))
      );
    });

  const revealScene = (force = false) => {
    if (loaderRevealed && !force) return;
    loaderRevealed = true;
    if (typeof loaderFallback !== 'undefined') {
      clearTimeout(loaderFallback);
    }
    window.hidePortfolioLoader?.();
    document.body.classList.remove('is-loading');
    if (!initialScrollHandled) {
      initialScrollHandled = true;
      window.resetPortfolioScrollTop?.();
    }
  };

  

  const prepareScene = (items) => {
    const sortedItems = items
      .slice()
      .sort((a, b) => (a.isMonochrome === b.isMonochrome ? 0 : a.isMonochrome ? -1 : 1));

    let maxExtent = 0;

    sortedItems.forEach(({ texture, src }, index) => {
      const image = texture.image;
      const ratio =
        image && image.width && image.height ? image.width / image.height : 0.75;
      const planeHeight = 3.35;
      const planeWidth = planeHeight * ratio;

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const INITIAL_START_Z = -95;
      mesh.position.z = INITIAL_START_Z - index * spacing;
      const angle = index * 2.399963229728653; // golden angle in radians
      // Keep cards elegantly floating inside the octagonal corridor volume (radius 5.6)
      const radialSpread = 0.55 + Math.min(1.85, Math.pow((index % 42) + 1, 0.42) * 0.48);
      const jitterX = (Math.random() - 0.5) * 0.12;
      const jitterY = (Math.random() - 0.5) * 0.12;
      mesh.position.x = Math.cos(angle) * radialSpread + jitterX;
      mesh.position.y = Math.sin(angle) * radialSpread * 0.9 + jitterY;

      if (src.includes('sub_banner_')) {
        mesh.scale.multiplyScalar(0.55);
        const signX = mesh.position.x >= 0 ? 1 : -1;
        const signY = mesh.position.y >= 0 ? 1 : -1;
        mesh.position.x = (Math.abs(mesh.position.x) + 0.8) * signX * 1.8;
        mesh.position.y = (Math.abs(mesh.position.y) + 0.8) * signY * 1.8;
      } else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50_1') || src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50_2')) {
        mesh.scale.multiplyScalar(0.25);
      }
      else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50-1') || src.includes('9092-350501_230602_numazukanuki_300x250_320x50-2')) {
        mesh.scale.multiplyScalar(0.5);
      }

      const scaledWidth = planeWidth * mesh.scale.x;
      const scaledHeight = planeHeight * mesh.scale.y;
      const extentX = Math.abs(mesh.position.x) + scaledWidth * 0.6;
      const extentY = Math.abs(mesh.position.y) + scaledHeight * 0.6;
      maxExtent = Math.max(maxExtent, extentX, extentY);

      mesh.userData.baseX = mesh.position.x;
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.baseZ = mesh.position.z;
      mesh.userData.baseScaleX = mesh.scale.x;
      mesh.userData.baseScaleY = mesh.scale.y;
      mesh.userData.src = src;

      stackGroup.add(mesh);
    });

    layoutMetrics.xyScale = 1;
    layoutMetrics.maxExtent = Math.max(1, maxExtent);

    const INITIAL_START_Z = -95;
    totalDepth = Math.abs(INITIAL_START_Z) + spacing * Math.max(0, stackGroup.children.length - 1) + 24;
    updateCameraForExtent();

    // Natural, rhythmic scroll travel: ~130px per item
    const stageMinHeight = Math.max(
      window.innerHeight * 3,
      window.innerHeight + Math.max(stackGroup.children.length * 130, totalDepth * 32)
    );
    stage.style.minHeight = `${stageMinHeight}px`;

    const spacer = stage.querySelector('.floating-scroll-spacer');
    if (spacer) {
      spacer.style.height = `${window.innerHeight * 0.3}px`;
    }

    resizeRenderer();
    computeStageMetrics();
    onScroll();
    initialRenderPending = true;
    const initialRenderPromise = new Promise((resolve) => {
      resolveInitialRender = resolve;
    });
    animate();
    window.resetPortfolioScrollTop?.();
    requestAnimationFrame(() => window.resetPortfolioScrollTop?.());
    initialRenderPromise.then(() => {
      requestAnimationFrame(() => {
        window.updatePortfolioLoaderProgress?.(100, { force: true });
        revealScene(true);
      });
    });
  };

  const resizeRenderer = () => {
    const width = stage.clientWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateCameraForExtent();
  };

  const computeStageMetrics = () => {
    const rect = stage.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const maxScroll = Math.max(1, stage.offsetHeight - window.innerHeight);
    stageMetrics = { top, maxScroll };
  };

  const onScroll = () => {
    const scrollGuide = document.querySelector('.scroll-guide');
    if (scrollGuide && window.scrollY > 10) {
      scrollGuide.classList.add('is-hidden');
    }
    
    const progress = THREE.MathUtils.clamp(
      (window.scrollY - stageMetrics.top) / stageMetrics.maxScroll,
      0,
      1
    );
    state.targetGroupZ = progress * totalDepth;

    let endingProgress = 0;
    const endingCard = document.querySelector('.ending-card');
    if (endingCard) {
      const fadeRange = Math.max(0.0001, CANVAS_FADE_END - ENDING_CARD_THRESHOLD);
      endingProgress = THREE.MathUtils.clamp(
        (progress - ENDING_CARD_THRESHOLD) / fadeRange,
        0,
        1
      );
      const easedEndingProgress = Math.pow(endingProgress, 1.35);
      endingCard.style.setProperty('--ending-progress', easedEndingProgress.toFixed(4));
      if (endingProgress > 0) {
        endingCard.classList.add('is-visible');
      } else {
        endingCard.classList.remove('is-visible');
      }
    }

    if (canvas) {
      canvas.style.opacity = (1 - endingProgress).toFixed(4);
    }
  };

  const updatePlanes = () => {
    const isAtTop = window.scrollY < 20;
    stackGroup.children.forEach((mesh) => {
      const worldZ = mesh.userData.baseZ + state.groupZ;
      if (isAtTop || worldZ < -36 || worldZ > 7.0) {
        mesh.visible = false;
        mesh.material.opacity = 0;
      } else {
        mesh.visible = true;
        // Far depth emergence fade: smoothly fade in from white fog depth (-36 to -22)
        let opacity = 1.0;
        if (worldZ < -22) {
          opacity = THREE.MathUtils.clamp((worldZ - (-36)) / 14, 0, 1);
        } else if (worldZ > 3.0) {
          // Camera fly-by fade: smoothly fade out as it approaches viewer (3.0 to 6.5)
          opacity = THREE.MathUtils.clamp((6.5 - worldZ) / 3.5, 0, 1);
        }
        mesh.material.opacity = opacity;
        mesh.material.transparent = opacity < 0.99;
      }
      mesh.position.x = mesh.userData.baseX;
      mesh.position.y = mesh.userData.baseY;
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(mesh.userData.baseScaleX || 1, mesh.userData.baseScaleY || 1, 1);
    });
  };

  const animate = () => {
    state.groupZ += (state.targetGroupZ - state.groupZ) * 0.065;
    stackGroup.position.z = state.groupZ;
    stackGroup.rotation.set(0, 0, 0);

    if (corridor) {
      corridor.update(-state.groupZ);
    }

    updatePlanes();

    renderer.render(scene, camera);
    if (initialRenderPending) {
      initialRenderPending = false;
      resolveInitialRender?.();
      resolveInitialRender = null;
    }
    requestAnimationFrame(animate);
  };

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const updatePointerFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    lastPointerScreen.x = event.clientX;
    lastPointerScreen.y = event.clientY;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const openLightbox = (src, pointerPosition) => {
    if (!lightbox || !lightboxImage) return;
    const pointerX = pointerPosition?.x ?? lastPointerScreen.x;
    const pointerY = pointerPosition?.y ?? lastPointerScreen.y;
    const offsetX = pointerX - window.innerWidth / 2;
    const offsetY = pointerY - window.innerHeight / 2;
    lightboxImage.style.setProperty('--card-start-x', `${offsetX}px`);
    lightboxImage.style.setProperty('--card-start-y', `${offsetY}px`);

    lightboxImage.src = src;
    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    const triggerAnimation = () => {
      lightboxImage.classList.remove('is-animating');
      void lightboxImage.offsetWidth;
      lightboxImage.classList.add('is-animating');
      lightboxImage.addEventListener(
        'animationend',
        () => {
          lightboxImage.classList.remove('is-animating');
          lightboxImage.style.transform = 'none';
        },
        { once: true }
      );
    };

    if (lightboxImage.complete && lightboxImage.naturalHeight) {
      triggerAnimation();
    } else {
      lightboxImage.addEventListener('load', triggerAnimation, { once: true });
    }
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    lightboxImage.classList.remove('is-animating');
    lightboxImage.style.removeProperty('--card-start-x');
    lightboxImage.style.removeProperty('--card-start-y');
    lightboxImage.style.transform = 'none';
    document.body.classList.remove('lightbox-open');
  };

  window.addEventListener('resize', () => {
    resizeRenderer();
    computeStageMetrics();
    onScroll();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  canvas.addEventListener('pointermove', updatePointerFromEvent, { passive: true });
  canvas.addEventListener('click', (event) => {
    updatePointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster
      .intersectObjects(stackGroup.children, false)
      .filter((intersection) => intersection.object.visible);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.src) {
        openLightbox(hit.userData.src, { x: event.clientX, y: event.clientY });
      }
    }
  });

  lightboxCloseControls?.forEach((element) => {
    element.addEventListener('click', closeLightbox);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });

  (() => {
    const normalizedSources = applyIPadThinning(
      (window.PORTFOLIO_IMAGES || [])
        .map(normalizeAssetPath)
        .filter(Boolean)
    );
    const sources = normalizedSources.length > 0 ? normalizedSources : fallbackSources;

    // Hide loader immediately — no waiting
    revealScene(true);

    // Start the animation loop right away (empty scene is fine)
    resizeRenderer();
    computeStageMetrics();
    onScroll();
    animate();
    window.resetPortfolioScrollTop?.();

    // Set up scroll length for expected image count
    const INITIAL_START_Z = -95;
    const mainSourcesCount = sources.filter(s => !s.includes('sub_banner_')).length;
    totalDepth = Math.abs(INITIAL_START_Z) + spacing * Math.max(0, mainSourcesCount - 1) + 24;
    const stageMinHeight = Math.max(
      window.innerHeight * 3,
      window.innerHeight + Math.max(mainSourcesCount * 130, totalDepth * 32)
    );
    stage.style.minHeight = `${stageMinHeight}px`;
    const spacer = stage.querySelector('.floating-scroll-spacer');
    if (spacer) spacer.style.height = `${window.innerHeight * 0.3}px`;
    computeStageMetrics();

    // Load images one by one and add to scene as they arrive
    let loadedCount = 0;
    let mainImageCount = 0;
    sources.forEach((src) => {
      loadTexture(src)
        .then(({ texture, isMonochrome }) => {
          const image = texture.image;
          const ratio = image && image.width && image.height ? image.width / image.height : 0.75;
          const scaleFactor = window.innerWidth < 768 ? 0.65 : (window.innerWidth < 1024 ? 0.85 : 1.0);
          const planeHeight = 1.95 * scaleFactor;
          const planeWidth = planeHeight * ratio;
          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: true
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.visible = false;
          const isSubBanner = src.includes('sub_banner_');
          let currentZIndex;
          if (isSubBanner) {
            currentZIndex = Math.max(0, mainImageCount - Math.random() * 2.5);
          } else {
            currentZIndex = mainImageCount++;
          }
          mesh.position.z = INITIAL_START_Z - (currentZIndex * spacing);
          const angle = currentZIndex * 2.399963229728653;
          // Float along corridor bounds (radius 1.1 to 2.5, well within 5.6 corridor wall)
          const radialSpread = (1.1 + Math.min(1.4, Math.pow((currentZIndex % 36) + 1, 0.4) * 0.35)) * scaleFactor;
          mesh.position.x = Math.cos(angle) * radialSpread + (Math.random() - 0.5) * 0.1;
          mesh.position.y = Math.sin(angle) * radialSpread * 0.85 + 0.15 + (Math.random() - 0.5) * 0.1;
          if (src.includes('sub_banner_')) {
            mesh.scale.multiplyScalar(0.55);
            const signX = mesh.position.x >= 0 ? 1 : -1;
            const signY = mesh.position.y >= 0 ? 1 : -1;
            mesh.position.x = (Math.abs(mesh.position.x) + 0.8) * signX * 1.8;
            mesh.position.y = (Math.abs(mesh.position.y) + 0.8) * signY * 1.8;
          } else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50')) {
            mesh.scale.multiplyScalar(0.25);
          } else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50-')) {
            mesh.scale.multiplyScalar(0.5);
          }
          mesh.userData.baseX = mesh.position.x;
          mesh.userData.baseY = mesh.position.y;
          mesh.userData.baseZ = mesh.position.z;
          mesh.userData.baseScaleX = mesh.scale.x;
          mesh.userData.baseScaleY = mesh.scale.y;
          mesh.userData.src = src;
          stackGroup.add(mesh);
          loadedCount++;
          layoutMetrics.maxExtent = Math.max(1, layoutMetrics.maxExtent);
          updateCameraForExtent();
        })
        .catch(() => {}); // silently skip failed images
    });
  })();
}

})();
