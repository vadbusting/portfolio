import * as THREE from './assets/vendor/three.module.js';

THREE.Cache.enabled = true;

const stage = document.querySelector('.floating-stage');
const canvas = document.getElementById('floating-canvas');
const lightbox = document.getElementById('floating-lightbox');
const lightboxImage = lightbox?.querySelector('.floating-lightbox__image');
const lightboxCloseControls = lightbox?.querySelectorAll('[data-lightbox-close]');
const lastPointerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const layoutMetrics = { maxExtent: 0 };
let initialScrollHandled = false;
const ENDING_CARD_THRESHOLD = 0.94;
const CANVAS_FADE_END = 1.0;
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

window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
let loaderRevealed = false;
let loaderFallback;

if (!stage || !canvas) {
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
  // Keep the WebGL canvas transparent so the ending title can sit behind
  // the flying portfolio images. The corridor itself fades independently.
  renderer.setClearColor(0xffffff, 0);

  const scene = new THREE.Scene();
  scene.background = null;
  // White distance fog is applied to corridor materials only. Portfolio images
  // explicitly keep fog disabled so they retain their original contrast.
  // Three.js units here are scene units (not guaranteed physical metres).
  const CORRIDOR_FOG_NEAR = 18;
  const CORRIDOR_FOG_FAR = 52;
  scene.fog = new THREE.Fog(0xffffff, CORRIDOR_FOG_NEAR, CORRIDOR_FOG_FAR);

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

  // -------------------------------------------------------------
  // Discovery One - Film-Accurate Pure 3D Recessed Hatch Corridor
  // -------------------------------------------------------------
  // 3Dライティング設定（白飛びさせず均一で自然な照明）
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.18);
  mainLight.position.set(0, 0, 10);
  mainLight.target.position.set(0, 0, -30);
  scene.add(mainLight);
  scene.add(mainLight.target);

  const bounceLight = new THREE.DirectionalLight(0xffffff, 0.08);
  bounceLight.position.set(0, 4, 2);
  scene.add(bounceLight);

  // 共有マテリアルの定義（極微オフホワイト・淡色エンボス設計）
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2f2ed,
    side: THREE.DoubleSide,
    fog: false
  });

  const recessFloorMaterial = new THREE.MeshBasicMaterial({
    color: 0xecece6,
    side: THREE.DoubleSide,
    fog: false
  });

  const bevelMaterial = new THREE.MeshBasicMaterial({
    color: 0xe5e5df,
    side: THREE.DoubleSide,
    fog: false
  });

  const blackHatchMaterial = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.25,
    metalness: 0.2,
    fog: false
  });

  const lightTubeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false
  });

  const slitBaseMaterial = new THREE.MeshBasicMaterial({
    color: 0xe2e2dc,
    side: THREE.DoubleSide,
    fog: false
  });

  const hingeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc9c9c3,
    side: THREE.DoubleSide,
    fog: false
  });

  // 六角形内の両翼に配置された印字スペックプレート（背景に溶け込む淡色印字）
  function createSpecPlateTexture(plateTitle, secNum) {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 384;
    const ctx = cv.getContext('2d');

    ctx.fillStyle = '#f8f8f4';
    ctx.fillRect(0, 0, 256, 384);

    ctx.strokeStyle = '#c8c8c0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 236, 364);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, 220, 348);

    ctx.fillStyle = '#dcdcd4';
    ctx.fillRect(22, 24, 212, 42);
    ctx.fillStyle = '#70706a';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(plateTitle, 128, 52);

    ctx.fillStyle = '#9c9c94';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('DISCOVERY 1', 128, 100);
    ctx.font = '13px monospace';
    ctx.fillText(`SEC-${secNum} ACCESS`, 128, 124);
    ctx.fillText('MANUAL UNLATCH', 128, 148);

    ctx.strokeStyle = '#c0c0b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 170, 184, 52);
    ctx.fillStyle = '#c8c8c0';
    ctx.fillRect(44, 178, 60, 36);
    ctx.fillStyle = '#888882';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('LEVER 90°', 160, 202);

    ctx.fillStyle = '#9c9c94';
    ctx.font = '12px monospace';
    ctx.fillText('PRESSURE SEAL OK', 128, 260);
    ctx.fillText('REF NO. 2001-C', 128, 286);
    ctx.fillText('0G LOCK VERIFIED', 128, 312);

    ctx.fillStyle = '#b0b0a8';
    [[24,24], [232,24], [24,360], [232,360]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const plateTex1 = createSpecPlateTexture('HATCH-A', '08');
  const plateTex2 = createSpecPlateTexture('PANEL-B', '04');

  const plateMaterial1 = new THREE.MeshBasicMaterial({
    map: plateTex1,
    fog: false
  });
  const plateMaterial2 = new THREE.MeshBasicMaterial({
    map: plateTex2,
    fog: false
  });

  const INRADIUS = 4.8;
  const SIDE_WIDTH = 2 * INRADIUS * Math.tan(Math.PI / 8);
  const PANEL_LENGTH = SIDE_WIDTH * 0.82;
  const RECESS_DEPTH = 0.055;
  const BEVEL_WIDTH = 0.065;
  const BAND_WIDTH = 0.28;
  const CORRIDOR_DEPTH_STRETCH = 3.3;
  const SEGMENT_PITCH = (PANEL_LENGTH + BAND_WIDTH) * CORRIDOR_DEPTH_STRETCH;
  // Keep six panels extending from Z=14 (behind camera at Z=8) so wide mobile landscape never sees past the front tunnel edge.
  const SEGMENT_COUNT = 6;
  const TOTAL_SPAN = SEGMENT_COUNT * SEGMENT_PITCH;
  const Z_START = 14;
  const Z_END = Z_START - TOTAL_SPAN;

  // 輪郭に沿って傾斜ベベル壁と一段低い底面を生成
  function createRecessedPocket(outerPts, depth, shrink, hasCenterCutout, cutoutBox) {
    const group = new THREE.Group();
    const n = outerPts.length;

    const cx = outerPts.reduce((acc, p) => acc + p[0], 0) / n;
    const cy = outerPts.reduce((acc, p) => acc + p[1], 0) / n;
    const innerPts = outerPts.map(p => {
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      const len = Math.hypot(dx, dy) || 1;
      const factor = Math.max(0.1, (len - shrink) / len);
      return [cx + dx * factor, cy + dy * factor];
    });

    const positions = [];
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const o1 = outerPts[i], o2 = outerPts[next];
      const i1 = innerPts[i], i2 = innerPts[next];

      positions.push(
        o1[0], o1[1], 0,
        i2[0], i2[1], -depth,
        o2[0], o2[1], 0,

        o1[0], o1[1], 0,
        i1[0], i1[1], -depth,
        i2[0], i2[1], -depth
      );
    }
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    wallGeo.computeVertexNormals();
    const wallMesh = new THREE.Mesh(wallGeo, bevelMaterial);
    group.add(wallMesh);

    const bottomShape = new THREE.Shape();
    bottomShape.moveTo(innerPts[0][0], innerPts[0][1]);
    for (let i = 1; i < n; i++) {
      bottomShape.lineTo(innerPts[i][0], innerPts[i][1]);
    }
    bottomShape.closePath();

    if (hasCenterCutout && cutoutBox) {
      const hole = new THREE.Path();
      hole.moveTo(-cutoutBox.w, -cutoutBox.h);
      hole.lineTo( cutoutBox.w, -cutoutBox.h);
      hole.lineTo( cutoutBox.w,  cutoutBox.h);
      hole.lineTo(-cutoutBox.w,  cutoutBox.h);
      hole.closePath();
      bottomShape.holes.push(hole);
    }

    const bottomGeo = new THREE.ShapeGeometry(bottomShape);
    const bottomMesh = new THREE.Mesh(bottomGeo, recessFloorMaterial);
    bottomMesh.position.z = -depth;
    group.add(bottomMesh);

    return group;
  }

  // 1パネルのマスターコンポーネントを構築
  function createRecessedPanelMesh() {
    const panelGroup = new THREE.Group();

    const halfX = SIDE_WIDTH * 0.5;
    const halfY = PANEL_LENGTH * 0.5;

    const hexX = halfX * 0.88;
    const hexY = halfY * 0.86;
    const flatX = halfX * 0.34;

    const hexPts = [
      [-flatX,  hexY],
      [-hexX,   0],
      [-flatX, -hexY],
      [ flatX, -hexY],
      [ hexX,   0],
      [ flatX,  hexY]
    ];

    const gap = 0.09;
    const triOuterX = halfX * 0.90;
    const triInnerX = flatX + gap * 1.4;
    const triOuterY = halfY * 0.86;
    const triInnerY = gap * 0.9;

    const tri1 = [[triInnerX, triOuterY], [triOuterX, triOuterY], [triOuterX, triInnerY]];
    const tri2 = [[-triOuterX, triOuterY], [-triInnerX, triOuterY], [-triOuterX, triInnerY]];
    const tri3 = [[-triOuterX, -triInnerY], [-triInnerX, -triOuterY], [-triOuterX, -triOuterY]];
    const tri4 = [[triOuterX, -triInnerY], [triOuterX, -triOuterY], [triInnerX, -triOuterY]];

    const mainShape = new THREE.Shape();
    mainShape.moveTo(-halfX, -halfY);
    mainShape.lineTo( halfX, -halfY);
    mainShape.lineTo( halfX,  halfY);
    mainShape.lineTo(-halfX,  halfY);
    mainShape.closePath();

    const addHole = (pts) => {
      const p = new THREE.Path();
      p.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
      p.closePath();
      mainShape.holes.push(p);
    };
    addHole(hexPts);
    addHole(tri1);
    addHole(tri2);
    addHole(tri3);
    addHole(tri4);

    const mainMesh = new THREE.Mesh(new THREE.ShapeGeometry(mainShape), panelMaterial);
    panelGroup.add(mainMesh);

    const winX = flatX * 0.52;
    const winY = hexY * 0.86;

    panelGroup.add(createRecessedPocket(hexPts, RECESS_DEPTH, BEVEL_WIDTH, true, { w: winX, h: winY }));
    panelGroup.add(createRecessedPocket(tri1, RECESS_DEPTH, BEVEL_WIDTH * 0.8, false));
    panelGroup.add(createRecessedPocket(tri2, RECESS_DEPTH, BEVEL_WIDTH * 0.8, false));
    panelGroup.add(createRecessedPocket(tri3, RECESS_DEPTH, BEVEL_WIDTH * 0.8, false));
    panelGroup.add(createRecessedPocket(tri4, RECESS_DEPTH, BEVEL_WIDTH * 0.8, false));

    const hatchDepth = RECESS_DEPTH + 0.035;
    const hatchGeo = new THREE.BoxGeometry(winX * 2, winY * 2, 0.03);
    const hatchMesh = new THREE.Mesh(hatchGeo, blackHatchMaterial);
    hatchMesh.position.z = -hatchDepth;
    panelGroup.add(hatchMesh);

    const bezelThick = 0.075;
    const bezelPosX = winX + bezelThick * 0.5;
    const bezelPosY = winY + bezelThick * 0.5;
    const bezelGeoH = new THREE.BoxGeometry(winX * 2 + bezelThick * 2, bezelThick, 0.045);
    const bezelGeoV = new THREE.BoxGeometry(bezelThick, winY * 2, 0.045);

    const topBezel = new THREE.Mesh(bezelGeoH, panelMaterial);
    topBezel.position.set(0, bezelPosY, -RECESS_DEPTH + 0.015);
    const botBezel = new THREE.Mesh(bezelGeoH, panelMaterial);
    botBezel.position.set(0, -bezelPosY, -RECESS_DEPTH + 0.015);
    const leftBezel = new THREE.Mesh(bezelGeoV, panelMaterial);
    leftBezel.position.set(-bezelPosX, 0, -RECESS_DEPTH + 0.015);
    const rightBezel = new THREE.Mesh(bezelGeoV, panelMaterial);
    rightBezel.position.set(bezelPosX, 0, -RECESS_DEPTH + 0.015);

    panelGroup.add(topBezel, botBezel, leftBezel, rightBezel);

    const plateGeo = new THREE.BoxGeometry(0.22, 0.38, 0.02);
    const plate1 = new THREE.Mesh(plateGeo, plateMaterial1);
    plate1.position.set(hexX * 0.58, 0, -RECESS_DEPTH + 0.01);
    const plate2 = new THREE.Mesh(plateGeo, plateMaterial2);
    plate2.position.set(-hexX * 0.58, 0, -RECESS_DEPTH + 0.01);
    panelGroup.add(plate1, plate2);

    return panelGroup;
  }

  const masterPanel = createRecessedPanelMesh();

  // 3D Infinite Discovery One Octagonal Corridor
  const createInfiniteCorridor = () => {
    const corridorGroup = new THREE.Group();
    scene.add(corridorGroup);
    window.__corridorGroup = corridorGroup;

    const slitTroughGeo = new THREE.BoxGeometry(SIDE_WIDTH * 0.99, 0.04, BAND_WIDTH * 0.85);
    const lightBarGeo = new THREE.BoxGeometry(SIDE_WIDTH * 0.92, 0.03, 0.11);
    const hingeGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.28, 10);
    hingeGeo.rotateX(Math.PI / 2);

    const segments = [];

    for (let s = 0; s < SEGMENT_COUNT; s++) {
      const segGroup = new THREE.Group();
      // Stretch each section along the tunnel axis while keeping exactly five sections.
      segGroup.scale.z = CORRIDOR_DEPTH_STRETCH;

      for (let i = 0; i < 8; i++) {
        const angle = i * (Math.PI / 4);
        const facetHolder = new THREE.Group();
        facetHolder.rotation.z = angle;

        const p = masterPanel.clone();
        p.position.set(0, -INRADIUS, 0);
        p.rotation.x = -Math.PI / 2;
        facetHolder.add(p);

        const zBoundary = PANEL_LENGTH * 0.5 + BAND_WIDTH * 0.5;

        const slitBase = new THREE.Mesh(slitTroughGeo, slitBaseMaterial);
        slitBase.position.set(0, -INRADIUS - 0.01, zBoundary);
        facetHolder.add(slitBase);

        const lightBar = new THREE.Mesh(lightBarGeo, lightTubeMaterial);
        lightBar.position.set(0, -INRADIUS + 0.012, zBoundary);
        facetHolder.add(lightBar);

        const cornerX = SIDE_WIDTH * 0.5;
        const cornerY = -INRADIUS + 0.02;
        const hinge1 = new THREE.Mesh(hingeGeo, hingeMaterial);
        hinge1.position.set(cornerX, cornerY, PANEL_LENGTH * 0.26);
        const hinge2 = new THREE.Mesh(hingeGeo, hingeMaterial);
        hinge2.position.set(cornerX, cornerY, -PANEL_LENGTH * 0.26);
        facetHolder.add(hinge1, hinge2);

        segGroup.add(facetHolder);
      }

      // Per-segment materials permit a soft white blend at the far loop seam.
      // This is a color blend, not fog or a panel-disappearing mask.
      const segmentMaterials = new Set();
      segGroup.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
        const clonedMaterials = sourceMaterials.map((source) => {
          const clone = source.clone();
          clone.userData.loopFadeBaseColor = source.color ? source.color.clone() : null;
          segmentMaterials.add(clone);
          return clone;
        });
        object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
      });
      segGroup.userData.segmentMaterials = [...segmentMaterials];
      segGroup.userData.baseZ = Z_START - s * SEGMENT_PITCH;
      segGroup.position.z = segGroup.userData.baseZ;
      corridorGroup.add(segGroup);
      segments.push(segGroup);
    }

    return {
      group: corridorGroup,
      update: (scrollOffset) => {
        const speed = 0.9;
        const offset = scrollOffset * speed;
        for (let i = 0; i < SEGMENT_COUNT; i++) {
          const seg = segments[i];
          const rawZ = seg.userData.baseZ + offset;
          const wrappedZ = ((rawZ - Z_END) % TOTAL_SPAN + TOTAL_SPAN) % TOTAL_SPAN + Z_END;
          seg.position.z = wrappedZ;
          // Fade the far end toward white gradually; images are separate and unaffected.
          const distanceFromCamera = Math.max(0, -wrappedZ);
          const fadeStart = TOTAL_SPAN * 0.30;
          const fadeEnd = TOTAL_SPAN * 0.88;
          const fadeLinear = THREE.MathUtils.clamp((distanceFromCamera - fadeStart) / (fadeEnd - fadeStart), 0, 1);
          // Quintic easing creates a broad, seamless white melt at the far end;
          // the octagonal panel edges should disappear into white well before the loop seam.
          const fadeT = fadeLinear * fadeLinear * fadeLinear * (fadeLinear * (fadeLinear * 6 - 15) + 10);
          for (const material of seg.userData.segmentMaterials || []) {
            // Store the far-loop fade separately so the ending animation can
            // combine with it instead of overwriting it on every frame.
            material.userData.farLoopFade = fadeT;
          }
        }
      }
    };
  };

  const corridor = createInfiniteCorridor();
  // Enable distance fog on corridor meshes only; portfolio image materials are
  // separate and keep fog:false. Mark materials for shader recompilation.
  corridor.group.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
      material.fog = true;
      material.needsUpdate = true;
    });
  });

  // Do not draw a translucent fog sprite over the scene: it was composited on top
  // of image planes and made them look washed out. Use corridor-only distance fog
  // plus the actual WebGL clear layer for the end-of-page whiteout instead.
  // During the ending, corridor materials whiten while a circular radial fog
  // only; portfolio image materials are separate and stay crisp/unchanged.
  const corridorFadeMaterials = [];
  corridor.group.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
      if (material.color && !corridorFadeMaterials.includes(material)) corridorFadeMaterials.push(material);
    });
  });
  const corridorBaseColors = corridorFadeMaterials.map((material) =>
    material.userData.loopFadeBaseColor ? material.userData.loopFadeBaseColor.clone() : material.color.clone()
  );
  const whiteColor = new THREE.Color(0xffffff);
  const setCorridorFade = (progress) => {
    // Far-loop whitening is localized to the distant corridor panels and eases
    // in smoothly. The end-of-page whitening is then layered on top of it.
    const endingT = Math.pow(THREE.MathUtils.clamp(progress, 0, 1), 1.35);
    corridorFadeMaterials.forEach((material, index) => {
      const baseColor = material.userData.loopFadeBaseColor || corridorBaseColors[index];
      const loopT = material.userData.farLoopFade || 0;
      const combinedT = 1 - (1 - loopT) * (1 - endingT);
      material.color.copy(baseColor).lerp(whiteColor, combinedT);
    });
  };

  const stackGroup = new THREE.Group();
  scene.add(stackGroup);

  const spacing = 2.2;
  const state = { groupZ: 0, targetGroupZ: 0 };
  let totalDepth = 0;
  let stageMetrics = { top: 0, maxScroll: 1 };

  const textureLoader = new THREE.TextureLoader(loadingManager);

  const fallbackSources = [
    'image/portfolio_page_22_2_65.webp',
    'image/portfolio_page_22_2_66.webp',
    'image/portfolio_page_22_2_67.webp',
    'image/portfolio_page_22_2_68.webp',
  ].map(normalizeAssetPath);

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

  const resizeRenderer = () => {
    const sceneElement = canvas.parentElement || stage;
    const rect = sceneElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(stage.clientWidth || window.innerWidth));
    // Use the actual CSS scene height so mobile Chrome's dynamic viewport is respected.
    const height = Math.max(1, Math.round(rect.height || window.visualViewport?.height || window.innerHeight));
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

    // Keep corridor whitening separate from portfolio images.
    setCorridorFade(endingProgress);

    // Increase the corridor's white distance fog smoothly near the end.
    // Three.Fog uses near/far distances rather than a density property.
    const endingFogT = THREE.MathUtils.smoothstep(progress, 0.62, 1.0);
    scene.fog.near = THREE.MathUtils.lerp(CORRIDOR_FOG_NEAR, 0.1, endingFogT);
    scene.fog.far = THREE.MathUtils.lerp(CORRIDOR_FOG_FAR, 0.2, endingFogT);

    // Keep the canvas background opaque white. The corridor's distance fog,
    // not a translucent overlay or clear-alpha fade, performs the end whiteout.
    renderer.setClearColor(0xffffff, 1);
    scene.background = new THREE.Color(0xffffff);

    // At the very end the canvas itself must remain visible, otherwise its white
    // clear color becomes transparent again and the page background shows through.
    if (progress >= 0.999) {
      renderer.setClearColor(0xffffff, 1);
      setCorridorFade(1);
      scene.fog.near = 0.1;
      scene.fog.far = 0.2;
    }
  };

  const updatePlanes = () => {
    const isAtTop = window.scrollY < 20;
    stackGroup.children.forEach((mesh) => {
      const worldZ = mesh.userData.baseZ + state.groupZ;
      if (isAtTop || worldZ < -36 || worldZ > 7.0) {
        mesh.visible = false;
      } else {
        // No depth-emergence or camera-flyby opacity fades: images stay crisp
        // and fully opaque for their entire visible travel range.
        mesh.visible = true;
        mesh.material.opacity = 1;
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
    if (!lightbox || !lightboxImage || !src) return;
    const pointerX = pointerPosition?.x ?? lastPointerScreen.x;
    const pointerY = pointerPosition?.y ?? lastPointerScreen.y;
    const offsetX = pointerX - window.innerWidth / 2;
    const offsetY = pointerY - window.innerHeight / 2;
    lightboxImage.style.setProperty('--card-start-x', `${offsetX}px`);
    lightboxImage.style.setProperty('--card-start-y', `${offsetY}px`);
    lightboxImage.style.transform = '';

    const encodedSrc = src.split('/').map(encodeURIComponent).join('/');
    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    const triggerAnimation = () => {
      lightboxImage.classList.remove('is-animating');
      lightboxImage.style.transform = '';
      void lightboxImage.offsetWidth;
      lightboxImage.classList.add('is-animating');
      lightboxImage.onanimationend = () => {
        lightboxImage.classList.remove('is-animating');
        lightboxImage.style.transform = 'none';
      };
    };

    lightboxImage.onload = triggerAnimation;
    lightboxImage.src = encodedSrc;
    if (lightboxImage.complete && lightboxImage.naturalHeight) {
      lightboxImage.onload = null;
      triggerAnimation();
    }
  };

  const closeLightbox = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.onload = null;
    lightboxImage.onanimationend = null;
    lightboxImage.removeAttribute('src');
    lightboxImage.classList.remove('is-animating');
    lightboxImage.style.removeProperty('--card-start-x');
    lightboxImage.style.removeProperty('--card-start-y');
    lightboxImage.style.transform = 'none';
    document.body.classList.remove('lightbox-open');
  };

  const handleViewportResize = () => {
    resizeRenderer();
    computeStageMetrics();
    onScroll();
  };
  window.addEventListener('resize', handleViewportResize, { passive: true });
  window.visualViewport?.addEventListener('resize', handleViewportResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(handleViewportResize);
    setTimeout(handleViewportResize, 120);
    setTimeout(handleViewportResize, 320);
  }, { passive: true });

  window.addEventListener('scroll', onScroll, { passive: true });

  const projVec = new THREE.Vector3();
  const findHitSrcAt = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    lastPointerScreen.x = clientX;
    lastPointerScreen.y = clientY;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    camera.updateMatrixWorld();
    stackGroup.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);

    const visibleMeshes = stackGroup.children.filter((mesh) => mesh.visible && mesh.userData?.src);
    const intersects = raycaster.intersectObjects(visibleMeshes, false);
    if (intersects.length > 0) {
      return intersects[0].object.userData.src;
    }

    // Touch tolerance fallback (14px pad) for thin banners or slight finger offset
    const pad = 14;
    let bestSrc = null;
    let bestWorldZ = -Infinity;
    for (const mesh of visibleMeshes) {
      const worldZ = mesh.userData.baseZ + state.groupZ;
      if (worldZ <= bestWorldZ) continue;
      const halfW = (mesh.geometry?.parameters?.width || 1) * mesh.scale.x * 0.5;
      const halfH = (mesh.geometry?.parameters?.height || 1) * mesh.scale.y * 0.5;

      projVec.set(mesh.position.x - halfW, mesh.position.y - halfH, worldZ).project(camera);
      const x1 = (projVec.x * 0.5 + 0.5) * rect.width + rect.left;
      const y1 = (-projVec.y * 0.5 + 0.5) * rect.height + rect.top;

      projVec.set(mesh.position.x + halfW, mesh.position.y + halfH, worldZ).project(camera);
      const x2 = (projVec.x * 0.5 + 0.5) * rect.width + rect.left;
      const y2 = (-projVec.y * 0.5 + 0.5) * rect.height + rect.top;

      const minX = Math.min(x1, x2) - pad;
      const maxX = Math.max(x1, x2) + pad;
      const minY = Math.min(y1, y2) - pad;
      const maxY = Math.max(y1, y2) + pad;

      if (clientX >= minX && clientX <= maxX && clientY >= minY && clientY <= maxY) {
        bestWorldZ = worldZ;
        bestSrc = mesh.userData.src;
      }
    }
    return bestSrc;
  };

  let pointerDownInfo = null;
  let lastLightboxOpenAt = 0;

  canvas.addEventListener('pointermove', updatePointerFromEvent, { passive: true });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerDownInfo = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      hitSrc: findHitSrcAt(event.clientX, event.clientY),
    };
  }, { passive: true });

  canvas.addEventListener('pointerup', (event) => {
    if (!pointerDownInfo) return;
    const dist = Math.hypot(event.clientX - pointerDownInfo.x, event.clientY - pointerDownInfo.y);
    const elapsed = performance.now() - pointerDownInfo.time;
    const downHit = pointerDownInfo.hitSrc;
    pointerDownInfo = null;

    if (dist < 18 && elapsed < 650) {
      const hitSrc = findHitSrcAt(event.clientX, event.clientY) || downHit;
      if (hitSrc) {
        lastLightboxOpenAt = performance.now();
        openLightbox(hitSrc, { x: event.clientX, y: event.clientY });
      }
    }
  }, { passive: true });

  canvas.addEventListener('click', (event) => {
    if (performance.now() - lastLightboxOpenAt < 450) return;
    const hitSrc = findHitSrcAt(event.clientX, event.clientY);
    if (hitSrc) {
      lastLightboxOpenAt = performance.now();
      openLightbox(hitSrc, { x: event.clientX, y: event.clientY });
    }
  });

  lightboxCloseControls?.forEach((element) => {
    element.addEventListener('click', closeLightbox);
    element.addEventListener('touchend', closeLightbox, { passive: false });
  });

  lightbox?.addEventListener('click', (event) => {
    if (event.target !== lightboxImage) {
      closeLightbox(event);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });

  (() => {
    const normalizedSources = (window.PORTFOLIO_IMAGES || [])
      .map(normalizeAssetPath)
      .filter(Boolean);
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

    // Pre-assign deterministic Z indices and load textures with concurrency limit (6 at a time)
    let mainImageCount = 0;
    const queuedItems = sources.map((src) => {
      const isSubBanner = src.includes('sub_banner_');
      const currentZIndex = isSubBanner
        ? Math.max(0, mainImageCount - Math.random() * 2.5)
        : mainImageCount++;
      return { src, currentZIndex };
    });

    let nextQueueIdx = 0;
    const CONCURRENCY_LIMIT = 6;

    const loadNextBatchItem = () => {
      if (nextQueueIdx >= queuedItems.length) return;
      const { src, currentZIndex } = queuedItems[nextQueueIdx++];
      loadTexture(src)
        .then(({ texture }) => {
          const image = texture.image;
          const ratio = image && image.width && image.height ? image.width / image.height : 0.75;
          const scaleFactor = window.innerWidth < 768 ? 0.58 : (window.innerWidth < 1024 ? 0.72 : 0.82);
          // Preserve v5 gallery sizing and aspect-ratio fitting exactly.
          const maxPlaneWidth = 2.65 * scaleFactor;
          const maxPlaneHeight = 1.85 * scaleFactor;
          const planeWidth = Math.min(maxPlaneWidth, maxPlaneHeight * ratio);
          const planeHeight = planeWidth / Math.max(0.1, ratio);
          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            fog: false,
            // Preserve v5's gallery draw behavior; disable depth clipping by corridor panels.
            depthWrite: false,
            depthTest: false
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.visible = false;
          mesh.position.z = INITIAL_START_Z - (currentZIndex * spacing);
          const angle = currentZIndex * 2.399963229728653;
          // Float along corridor bounds (radius 1.1 to 2.5, well within 5.6 corridor wall)
          const radialSpread = (1.1 + Math.min(1.4, Math.pow((currentZIndex % 36) + 1, 0.4) * 0.35)) * scaleFactor;
          mesh.position.x = Math.cos(angle) * radialSpread + (Math.random() - 0.5) * 0.1;
          mesh.position.y = Math.sin(angle) * radialSpread * 0.85 + 0.15 + (Math.random() - 0.5) * 0.1;
          if (src.includes('sub_banner_')) {
            mesh.scale.multiplyScalar(0.72);
            const signX = mesh.position.x >= 0 ? 1 : -1;
            const signY = mesh.position.y >= 0 ? 1 : -1;
            mesh.position.x = (Math.abs(mesh.position.x) + 0.35) * signX * 1.2;
            mesh.position.y = (Math.abs(mesh.position.y) + 0.35) * signY * 1.2;
          } else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320x50')) {
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
          layoutMetrics.maxExtent = Math.max(1, layoutMetrics.maxExtent);
          updateCameraForExtent();
        })
        .catch(() => {})
        .finally(loadNextBatchItem);
    };

    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
      loadNextBatchItem();
    }
  })();
}
