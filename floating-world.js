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
const ENDING_CARD_THRESHOLD = 0.62;
const CANVAS_FADE_END = 0.96;
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
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    32,
    stage.clientWidth / window.innerHeight,
    0.1,
    1200
  );
  camera.position.set(0, 0, 8);

  const stackGroup = new THREE.Group();
  scene.add(stackGroup);

  const spacing = 1.05;
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
        transparent: false,
        depthWrite: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -index * spacing;
      const angle = index * 2.399963229728653; // golden angle in radians
      const radialSpread = 0.32 + Math.pow(index + 1, 0.5) * 0.42;
      const jitterX = (Math.random() - 0.5) * 0.1;
      const jitterY = (Math.random() - 0.5) * 0.1;
      mesh.position.x = Math.cos(angle) * radialSpread + jitterX;
      mesh.position.y = Math.sin(angle) * radialSpread * 1.05 + jitterY;

      if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50_1') || src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50_2')) {
        mesh.scale.multiplyScalar(0.25);
      }
      if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50-1') || src.includes('9092-350501_230602_numazukanuki_300x250_320x50-2')) {
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

    totalDepth = spacing * Math.max(0, stackGroup.children.length - 1) + 6;
    updateCameraForExtent();

    const baseStageMinHeight = Math.max(
      window.innerHeight * 1.2,
      Math.min(
        window.innerHeight * 1.6,
        window.innerHeight + totalDepth * 22
      )
    );
    const stageMinHeight = baseStageMinHeight * STAGE_SCROLL_LENGTH_SCALE;
    stage.style.minHeight = `${stageMinHeight}px`;

    const spacer = stage.querySelector('.floating-scroll-spacer');
    if (spacer) {
      const baseSpacerHeight = Math.max(window.innerHeight * 0.25, baseStageMinHeight * 0.2);
      spacer.style.height = `${baseSpacerHeight * STAGE_SCROLL_LENGTH_SCALE}px`;
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
    const progress = THREE.MathUtils.clamp(
      (window.scrollY - stageMetrics.top) / stageMetrics.maxScroll,
      0,
      1
    );
    state.targetGroupZ = progress * totalDepth * 1.35;

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
      canvas.style.opacity = 1;
    }
  };

  const updatePlanes = () => {
    stackGroup.children.forEach((mesh) => {
      const baseZ = mesh.userData.baseZ + state.groupZ;
      mesh.visible = baseZ < 2.8;
      mesh.position.x = mesh.userData.baseX;
      mesh.position.y = mesh.userData.baseY;
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(mesh.userData.baseScaleX || 1, mesh.userData.baseScaleY || 1, 1);
    });
  };

  const animate = () => {
    state.groupZ += (state.targetGroupZ - state.groupZ) * 0.008;
    stackGroup.position.z = state.groupZ;
    stackGroup.rotation.set(0, 0, 0);

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
    totalDepth = spacing * Math.max(0, sources.length - 1) + 6;
    const baseStageMinHeight = Math.max(
      window.innerHeight * 1.2,
      Math.min(window.innerHeight * 1.6, window.innerHeight + totalDepth * 22)
    );
    stage.style.minHeight = `${baseStageMinHeight * STAGE_SCROLL_LENGTH_SCALE}px`;
    const spacer = stage.querySelector('.floating-scroll-spacer');
    if (spacer) spacer.style.height = `${Math.max(window.innerHeight * 0.25, baseStageMinHeight * 0.2) * STAGE_SCROLL_LENGTH_SCALE}px`;
    computeStageMetrics();

    // Load images one by one and add to scene as they arrive
    let loadedCount = 0;
    sources.forEach((src) => {
      loadTexture(src)
        .then(({ texture, isMonochrome }) => {
          const image = texture.image;
          const ratio = image && image.width && image.height ? image.width / image.height : 0.75;
          const scaleFactor = window.innerWidth < 768 ? 0.65 : (window.innerWidth < 1024 ? 0.85 : 1.0);
          const planeHeight = 3.35 * scaleFactor;
          const planeWidth = planeHeight * ratio;
          const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: false, depthWrite: true });
          const mesh = new THREE.Mesh(geometry, material);
          const idx = stackGroup.children.length;
          mesh.position.z = -idx * spacing;
          const angle = idx * 2.399963229728653;
          const radialSpread = (0.32 + Math.pow(idx + 1, 0.5) * 0.42) * scaleFactor;
          mesh.position.x = Math.cos(angle) * radialSpread + (Math.random() - 0.5) * 0.1;
          mesh.position.y = Math.sin(angle) * radialSpread * 1.05 + (Math.random() - 0.5) * 0.1;
          if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50_320×50')) mesh.scale.multiplyScalar(0.25);
          else if (src.includes('9092-350501_230602_numazukanuki_300x250_320x50-')) mesh.scale.multiplyScalar(0.5);
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
