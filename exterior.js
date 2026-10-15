import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { initCulturalAssets } from './assets/js/cultural-assets.js?v=18';

window.THREE = THREE;

const $ = id => document.getElementById(id);
const canvas = $('labCanvas');
const loader = $('loader');
const loaderText = $('loaderText');
const loaderBar = $('loaderBar');
const assetError = null;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');

const routes = [
  { name: 'EXTERIOR', href: null },
  { name: 'ABOUT', href: 'about.html' },
  { name: 'PRESENTATION', href: 'presentation.html?v=5' },
  { name: 'LP', href: 'lp.html?v=5' },
  { name: 'WEB', href: 'https://www.originalsoccerball.com/', external: true },
  { name: 'DIRECTION', href: 'https://new.express.adobe.com/webpage/XRy2MzIpmkxug', external: true },
  { name: 'OTHER', href: 'other.html' }
];

const FLOOR_HEIGHT = 4.65;
const ASSETS = ['city.glb', 'dome.glb'];
const LOCAL_PBR = './assets/pbr/';
const HDRI_PATH = './assets/pbr/interior_1k.hdr';
const PREVIEW_FILES = ['about', 'presentation', 'lp', 'web', 'direction', 'other'];

let model = null;
let scrollProgress = 0;
let currentStage = 0;
let scrollScheduled = false;
let initAttempt = 0;

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoother = v => {
  const x = clamp(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// Pacing: 30% stationary hold -> 40% physical travel -> 30% stationary hold
const journey = v => {
  const r = clamp(v) * 6;
  if (r >= 6) return 1;
  const s = Math.floor(r);
  const q = r - s;
  return (s + smoother((q - 0.30) / 0.40)) / 6;
};

async function boot() {
  const attempt = ++initAttempt;
  if (assetError) assetError.hidden = true;
  if (loader) loader.classList.remove('is-done');
  if (loaderText) loaderText.textContent = 'INITIALIZING 3D ENVIRONMENT';
  if (loaderBar) loaderBar.style.transform = 'scaleX(0.05)';

  try {
    model = await createWorld(attempt);
    if (attempt !== initAttempt) {
      model.dispose();
      return;
    }
    model.setProgress(window.__extU || 0);
    if (loaderBar) loaderBar.style.transform = 'scaleX(1)';
    if (loaderText) loaderText.textContent = 'READY';
    setTimeout(() => {
      if (loader) loader.classList.add('is-done');
    }, 450);
    window.dispatchEvent(new CustomEvent('exterior-ready'));
  } catch (e) {
    console.error('Exterior 3D initialization error:', e);
    if (loader) loader.classList.add('is-done');
    window.dispatchEvent(new CustomEvent('exterior-fail', { detail: String(e && e.message || e) }));
  }
}

async function createWorld(attempt) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: devicePixelRatio < 1.75,
    powerPreference: 'high-performance',
    alpha: false,
    preserveDrawingBuffer: false
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080f);
  scene.fog = new THREE.FogExp2(0x070b14, 0.00052);

  // Night sky: deep indigo, faint city glow on the horizon, stars, thin milky band, moon with halo
  const skyGeo = new THREE.SphereGeometry(1800, 64, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vWorldPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      float hash13(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main() {
        vec3 dir = normalize(vWorldPosition);
        float y = dir.y;
        vec3 zenith = vec3(0.004, 0.009, 0.026);
        vec3 mid = vec3(0.012, 0.026, 0.060);
        vec3 low = vec3(0.040, 0.058, 0.105);
        vec3 col = mix(low, mid, smoothstep(0.0, 0.28, y));
        col = mix(col, zenith, smoothstep(0.28, 0.9, y));
        // sodium/LED city glow hugging the horizon
        float glow = pow(1.0 - clamp(abs(y), 0.0, 1.0), 9.0);
        col += vec3(0.20, 0.115, 0.075) * glow * 0.55;
        col += vec3(0.05, 0.07, 0.12) * pow(1.0 - clamp(abs(y), 0.0, 1.0), 3.0) * 0.18;
        // stars (fainter near the horizon)
        vec3 sp = dir * 260.0; vec3 id = floor(sp); vec3 f = fract(sp) - 0.5;
        float h1 = hash13(id); float st = step(0.9972, h1) * smoothstep(0.5, 0.0, length(f));
        float tw = 0.55 + 0.45 * hash13(id + 7.3);
        col += vec3(0.85, 0.9, 1.0) * st * tw * smoothstep(0.06, 0.4, y) * 1.4;
        vec3 sp2 = dir * 90.0; vec3 id2 = floor(sp2); vec3 f2 = fract(sp2) - 0.5;
        col += vec3(0.7, 0.8, 1.0) * step(0.9988, hash13(id2 + 3.1)) * smoothstep(0.35, 0.0, length(f2)) * smoothstep(0.1, 0.5, y) * 1.1;
        // faint milky band
        float band = exp(-pow(dot(dir, normalize(vec3(0.35, 0.8, -0.5))) * 4.0, 2.0));
        col += vec3(0.020, 0.028, 0.050) * band * smoothstep(0.1, 0.6, y);
        // moon
        vec3 md = normalize(vec3(-0.45, 0.45, -0.6)); float d = dot(dir, md);
        col += vec3(0.95, 0.97, 1.0) * smoothstep(0.99962, 0.99985, d) * 1.6;
        col += vec3(0.45, 0.58, 0.85) * (pow(max(d, 0.0), 260.0) * 0.35 + pow(max(d, 0.0), 24.0) * 0.07);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // Nighttime ambient and architectural key lighting
  const hemi = new THREE.HemisphereLight(0x2c3f66, 0x0a0c11, 0.30);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0x8fa9dc, 0.55);   // moonlight
  sun.position.set(-80, 160, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0001;
  sun.shadow.normalBias = 0.015;
  scene.add(sun);

  // Exterior architectural night uplights highlighting geodesic dome structure
  const domeUplight1 = new THREE.PointLight(0x9bbbe0, 11.0, 50, 1.8);
  domeUplight1.position.set(-14, 1.5, 52);
  scene.add(domeUplight1);
  const domeUplight2 = new THREE.PointLight(0x9bbbe0, 11.0, 50, 1.8);
  domeUplight2.position.set(14, 1.5, 52);
  scene.add(domeUplight2);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(43, 1, 0.08, 2200);
  window.__DEBUG_CAM__ = camera;
  window.__DEBUG_SCENE__ = scene;

  // Loading tracking
  let totalTasks = 1 + ASSETS.length + 8 + PREVIEW_FILES.length;
  let completedTasks = 0;
  const updateProgress = (label) => {
    completedTasks++;
    const pct = Math.min(0.96, completedTasks / totalTasks);
    if (loaderBar) loaderBar.style.transform = `scaleX(${pct})`;
    if (loaderText) loaderText.textContent = `${label} (${Math.round(pct * 100)}%)`;
  };

  // 1. Load 2K City Rooftop HDRI for true physical reflection & specular bounce
  const hdrLoader = new HDRLoader();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let envMapTexture = null;

  try {
    const hdrTexture = await hdrLoader.loadAsync(HDRI_PATH);
    const envMap = pmrem.fromEquirectangular(hdrTexture);
    hdrTexture.dispose();
    envMapTexture = envMap.texture;
    scene.environment = envMapTexture;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.82;
    updateProgress('ENVIRONMENT HDRI LOADED');
  } catch (err) {
    console.warn('Local HDRI loading fallback:', err);
    // Procedural warm reflection room fallback
    const envRoom = new THREE.Scene();
    envRoom.background = new THREE.Color(0xf3efe7);
    [[-8, 2, 0, 8, 8, 0xffebcc], [8, 3, 0, 8, 8, 0xdcd0b8], [0, 9, 0, 16, 16, 0xffdfaa], [0, 2, -8, 14, 8, 0x827662]].forEach(([x, y, z, w, h, col]) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      pl.position.set(x, y, z);
      pl.lookAt(0, 0, 0);
      envRoom.add(pl);
    });
    const fallbackEnv = pmrem.fromScene(envRoom, 0.08);
    envMapTexture = fallbackEnv.texture;
    scene.environment = envMapTexture;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.82;
    updateProgress('ENVIRONMENT RIG LOADED');
  }

  // 2. Load 8 sets of local PBR textures
  const texLoader = new THREE.TextureLoader();
  const pbrSets = {};
  const loadPBRSet = async (name) => {
    try {
      const [diff, nor, rough] = await Promise.all([
        texLoader.loadAsync(`${LOCAL_PBR}${name}_base.jpg?v=2`),
        texLoader.loadAsync(`${LOCAL_PBR}${name}_normal.jpg?v=2`),
        texLoader.loadAsync(`${LOCAL_PBR}${name}_roughness.jpg?v=2`)
      ]);
      diff.colorSpace = THREE.SRGBColorSpace;
      [diff, nor, rough].forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      });
      pbrSets[name] = { diff, nor, rough };
      updateProgress(`PBR ${name.toUpperCase()} READY`);
    } catch (e) {
      console.warn(`Local PBR ${name} failed to load:`, e);
      pbrSets[name] = null;
      updateProgress(`PBR ${name.toUpperCase()} SKIPPED`);
    }
  };

  await Promise.all([
    'walnut', 'leather', 'aluminum', 'facade', 'asphalt', 'charcoal', 'stone', 'plaster'
  ].map(loadPBRSet));

  // 1960s Modern High-End PBR Material Palette with Clearcoat & Physical Specular Sheen
  const matWalnut = new THREE.MeshPhysicalMaterial({
    color: 0x422f20,
    roughness: 0.18,
    metalness: 0.03,
    clearcoat: 0.95,
    clearcoatRoughness: 0.12,
    reflectivity: 0.85,
    map: pbrSets.walnut?.diff,
    normalMap: pbrSets.walnut?.nor,
    roughnessMap: pbrSets.walnut?.rough,
    envMapIntensity: 2.5
  });
  if (pbrSets.walnut?.nor) matWalnut.normalScale.set(0.10, 0.10);

  const matLeather = new THREE.MeshPhysicalMaterial({
    color: 0x161514,
    roughness: 0.38,
    metalness: 0.05,
    clearcoat: 0.45,
    clearcoatRoughness: 0.28,
    map: pbrSets.leather?.diff,
    normalMap: pbrSets.leather?.nor,
    roughnessMap: pbrSets.leather?.rough,
    envMapIntensity: 1.2
  });
  if (pbrSets.leather?.nor) matLeather.normalScale.set(0.08, 0.08);

  const matFacadeTimber = new THREE.MeshStandardMaterial({
    color: 0x24201e,
    roughness: 0.50,
    metalness: 0.20,
    envMapIntensity: 1.5
  });

  const matAluminium = new THREE.MeshStandardMaterial({
    color: 0xe2e4e8,
    roughness: 0.14,
    metalness: 0.94,
    map: pbrSets.aluminum?.diff,
    normalMap: pbrSets.aluminum?.nor,
    roughnessMap: pbrSets.aluminum?.rough,
    envMapIntensity: 2.6
  });

  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xdfb76c,
    roughness: 0.20,
    metalness: 0.90,
    envMapIntensity: 2.6
  });

  const matCharcoal = new THREE.MeshStandardMaterial({
    color: 0x1a1918,
    roughness: 0.28,
    metalness: 0.55,
    map: pbrSets.charcoal?.diff,
    normalMap: pbrSets.charcoal?.nor,
    roughnessMap: pbrSets.charcoal?.rough,
    envMapIntensity: 1.8
  });

  const matStone = new THREE.MeshPhysicalMaterial({
    color: 0x202428,
    roughness: 0.14,
    metalness: 0.08,
    clearcoat: 0.96,
    clearcoatRoughness: 0.08,
    reflectivity: 0.90,
    map: pbrSets.stone?.diff,
    normalMap: pbrSets.stone?.nor,
    roughnessMap: pbrSets.stone?.rough,
    envMapIntensity: 2.8
  });

  const matPlaster = new THREE.MeshStandardMaterial({
    color: 0xf4f1eb,
    roughness: 0.82,
    metalness: 0.0,
    map: pbrSets.plaster?.diff,
    normalMap: pbrSets.plaster?.nor,
    roughnessMap: pbrSets.plaster?.rough
  });

  const matGlassArchitectural = new THREE.MeshPhysicalMaterial({
    color: 0xdde0dd,
    metalness: 0.02,
    roughness: 0.035,
    transmission: 0.90,
    ior: 1.52,
    thickness: 0.06,
    clearcoat: 0.95,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: 0.82,
    depthWrite: true,
    side: THREE.DoubleSide,
    envMapIntensity: 2.2
  });

  const matGlassDome = new THREE.MeshPhysicalMaterial({
    color: 0xc8ccc8,
    metalness: 0.04,
    roughness: 0.055,
    transmission: 0.35,
    ior: 1.52,
    thickness: 0.12,
    clearcoat: 0.92,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.85,
    depthWrite: true,
    side: THREE.DoubleSide,
    envMapIntensity: 2.4
  });

  // 3. Load 4 Architectural GLB Models
  const gltfLoader = new GLTFLoader();
  const models = [];
  const outerDomeShell = [];
  const innerFacade = [];

  for (let i = 0; i < ASSETS.length; i++) {
    const name = ASSETS[i];
    try {
      const gltf = await gltfLoader.loadAsync(`./assets/architecture/${name}`);
      const obj = gltf.scene;
      obj.name = name;
      scene.add(obj);
      models.push(obj);
      updateProgress(`MODEL ${name} LOADED`);
    } catch (e) {
      console.warn(`Local model ${name} load issue:`, e);
      updateProgress(`MODEL ${name} FAILED`);
    }
  }

  // Refine materials on loaded architecture models
  models.forEach(modelObj => {
    modelObj.traverse(node => {
      if (!node.isMesh) return;
      if (node.geometry && !node.geometry.attributes.normal) {
        node.geometry.computeVertexNormals();
      }
      node.frustumCulled = true;
      const mat = node.material;
      const n = (mat?.name || node.name || '').toLowerCase();

      if (mat && 'envMapIntensity' in mat) {
        mat.envMapIntensity = 1.45;
      }

      if (n === 'glass3' && modelObj.name === 'dome.glb') {
        node.material = matGlassDome;
        outerDomeShell.push(matGlassDome);
      } else if (n === 'glass2' && modelObj.name === 'dome.glb') {
        node.material = matGlassArchitectural;
        innerFacade.push(matGlassArchitectural);
      } else if ((n === 'windows' || n === 'glass' || n === 'glass2') && modelObj.name === 'city.glb') {
        node.material = new THREE.MeshPhysicalMaterial({
          color: n === 'windows' ? 0x282928 : 0x8a8f8d,
          metalness: 0.35,
          roughness: 0.12,
          transmission: 0.18,
          ior: 1.50,
          thickness: 0.04,
          clearcoat: 0.85,
          transparent: true,
          opacity: 0.72,
          depthWrite: true,
          side: THREE.DoubleSide,
          envMapIntensity: 2.0
        });
      } else if (n === 'water' && modelObj.name === 'city.glb') {
        node.material = new THREE.MeshPhysicalMaterial({
          color: 0x5a5f5d,
          metalness: 0.08,
          roughness: 0.08,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          envMapIntensity: 2.1
        });
      }
      if (['leaf', 'leaf2'].includes(n) || n === 'stone' || (['wood', 'steel', 'screen', 'aluminium', 'timber', 'frame'].includes(n) && modelObj.name === 'rooms.glb') || (n === 'wood' && modelObj.name === 'city.glb') || (n === 'gold' && modelObj.name === 'dome.glb') || modelObj.name === 'interactions.glb') {
        node.visible = false;
        return;
      }

      // High-End PBR Architecture Framing (rooms.glb floors, walls, structures & glass)
      if (modelObj.name === 'rooms.glb') {
        if (n === 'warmconcrete') {
          // Deep dark architectural terrazzo floor absorbing ambient light with tactile micro-grain
          node.material = new THREE.MeshStandardMaterial({
            color: 0x1e1d1a,
            roughness: 0.65,
            metalness: 0.15,
            normalMap: pbrSets.stone?.nor || null,
            envMapIntensity: 0.45
          });
          if (pbrSets.stone?.nor) node.material.normalScale.set(0.04, 0.04);
        } else if (n === 'wall') {
          // Dark charcoal acoustic plaster wall, shrouded in shadow
          node.material = new THREE.MeshStandardMaterial({
            color: 0x141412,
            roughness: 0.85,
            metalness: 0.04,
            map: null,
            normalMap: pbrSets.plaster?.nor || null,
            envMapIntensity: 0.12
          });
          if (pbrSets.plaster?.nor) node.material.normalScale.set(0.04, 0.04);
        } else if (n === 'white') {
          // Dark matte perimeter columns & ceiling structure
          node.material = new THREE.MeshStandardMaterial({
            color: 0x161514,
            roughness: 0.80,
            metalness: 0.05,
            envMapIntensity: 0.12
          });
        } else if (n === 'plaza') {
          // Entrance plaza stone pavers
          node.material = new THREE.MeshStandardMaterial({
            color: 0xd2d0ca,
            roughness: 0.58,
            metalness: 0.04,
            map: node.material?.map || null,
            normalMap: pbrSets.stone?.nor || null,
            envMapIntensity: 1.2
          });
        } else if (n === 'glass2') {
          // Physical transparent glass facade with transmission
          node.material = matGlassArchitectural;
        }
      }

      if (['steel', 'frame'].includes(n) && modelObj.name === 'dome.glb') {
        node.material = new THREE.MeshStandardMaterial({
          color: 0xc8cbc8,
          roughness: 0.16,
          metalness: 0.94,
          envMapIntensity: 2.8
        });
      } else if (n === 'gold' && modelObj.name === 'dome.glb') {
        node.material = matCharcoal;
      } else if (['wood', 'timber', 'darkwood'].includes(n)) {
        if (matWalnut) node.material = matWalnut;
      } else if (n === 'leather') {
        if (matLeather) node.material = matLeather;
      } else if (['gold', 'brass'].includes(n)) {
        node.material = matBrass;
      } else if (['steel', 'frame', 'aluminium'].includes(n)) {
        if (matAluminium) node.material = matAluminium;
      } else if (['blackmetal', 'keycap', 'rubber'].includes(n)) {
        if (matCharcoal) node.material = matCharcoal;
      }

      node.castShadow = renderer.shadowMap.enabled && modelObj.name !== 'city.glb' && !n.startsWith('glass');
      node.receiveShadow = modelObj.name !== 'city.glb';
    });
  });

  // 4. Photoreal Entrance Vestibule & Smooth Automatic Sliding Doors
  const entrance = new THREE.Group();
  entrance.name = 'dome-entrance';
  const GROUND_Y = 0.97;                       // plaza/concrete top around the dome (measured)
  entrance.position.y = GROUND_Y - 0.16;       // threshold top flush with the ground (was buried)
  scene.add(entrance);

  const eBox = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = renderer.shadowMap.enabled;
    m.receiveShadow = true;
    entrance.add(m);
    return m;
  };

  // Entrance canopy roof and threshold floor (compact doorway portal, soaring lobby atrium)
  eBox(6.8, 0.22, 2.6, 0, 3.82, 41.2, matCharcoal);
  eBox(6.8, 0.16, 2.6, 0, 0.08, 41.2, matStone);
  // Vestibule: slim black steel posts + clear glass walls (matches the lobby photo: black-framed glass entrance)
  const matFrame = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.7, roughness: 0.36 });
  const matDarkMarble = new THREE.MeshStandardMaterial({ color: 0x15120f, metalness: 0.15, roughness: 0.2 });
  entrance.children.forEach(m => { if (m.position.y < 0.2) m.material = matDarkMarble; });   // threshold floor → dark marble
  [-3.25, 3.25].forEach(x => {
    eBox(0.05, 3.58, 2.4, x, 1.95, 41.2, matGlassArchitectural);
    eBox(0.10, 3.64, 0.12, x, 1.95, 40.02, matFrame);
    eBox(0.10, 3.64, 0.12, x, 1.95, 42.38, matFrame);
  });
  // Outer frame & side fixed glass panels (doorway centre is open)
  eBox(1.5, 3.42, 0.05, -2.45, 1.95, 41.45, matGlassArchitectural);
  eBox(1.5, 3.42, 0.05, 2.45, 1.95, 41.45, matGlassArchitectural);
  eBox(0.07, 3.52, 0.12, -1.70, 1.95, 41.42, matFrame);
  eBox(0.07, 3.52, 0.12, 1.70, 1.95, 41.42, matFrame);
  eBox(3.48, 0.16, 0.18, 0, 3.45, 41.40, matFrame);
  eBox(1.5, 0.07, 0.12, -2.45, 0.30, 41.45, matFrame);
  eBox(1.5, 0.07, 0.12, 2.45, 0.30, 41.45, matFrame);

  // Twin automatic sliding glass doors (sliding left and right)
  const doorWidth = 1.15;
  const doorHeight = 3.12;
  const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.06), matGlassArchitectural);
  doorLeft.position.set(-0.58, 1.72, 41.36);
  doorLeft.castShadow = false;
  entrance.add(doorLeft);

  const doorRight = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.06), matGlassArchitectural);
  doorRight.position.set(0.58, 1.72, 41.36);
  doorRight.castShadow = false;
  entrance.add(doorRight);

  [doorLeft, doorRight].forEach(d => {
    const fr = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), matFrame); m.position.set(x, y, 0); d.add(m); };
    fr(doorWidth, 0.05, 0, doorHeight / 2 - 0.025);          // top rail
    fr(doorWidth, 0.14, 0, -doorHeight / 2 + 0.07);          // bottom rail
    fr(0.05, doorHeight, -doorWidth / 2 + 0.025, 0);         // stiles
    fr(0.05, doorHeight, doorWidth / 2 - 0.025, 0);
  });

  // Handles and trim on sliding doors
  const handleMat = matAluminium;
  const hLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 16), handleMat);
  hLeft.position.set(0.48, 0, 0.05);
  doorLeft.add(hLeft);
  const hRight = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 16), handleMat);
  hRight.position.set(-0.48, 0, 0.05);
  doorRight.add(hRight);

  // ---- Night lights: soft glow sprites, street lamps, warm dome interior, entrance spill ----
  const nightLamps = [];
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,238,205,1)'); r.addColorStop(0.16, 'rgba(255,216,152,.55)'); r.addColorStop(0.5, 'rgba(255,182,104,.14)'); r.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = (x, y, z, size, op, color) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color || 0xffffff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(x, y, z); sp.scale.set(size, size, 1); scene.add(sp); return sp;
  };
  const matLamp = new THREE.MeshStandardMaterial({ color: 0x101216, metalness: 0.7, roughness: 0.4 });
  const addLamp = (x, z, real) => {
    const dir = -Math.sign(x);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.2, 10), matLamp); pole.position.set(x, 2.6, z); scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.07), matLamp); arm.position.set(x + dir * 0.4, 5.15, z); scene.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0xfff0d8 })); head.position.set(x + dir * 0.85, 5.1, z); scene.add(head);
    glow(head.position.x, 5.05, z, 4.2, 0.85);
    if (real) { const l = new THREE.PointLight(0xffd7a0, 0, 24, 1.7); l.position.set(head.position.x, 4.9, z); l.userData.base = 38; l.userData.ph = z; scene.add(l); nightLamps.push(l); }
  };
  [[-8.5, 52, true], [8.5, 52, true], [-8.5, 63, true], [8.5, 63, true], [-8.5, 75, false], [8.5, 75, false], [-8.5, 88, false], [8.5, 88, false]].forEach(a => addLamp(a[0], a[1], a[2]));
  // warm interior glow seen through the dome glass from the very first frames, and spill on the threshold
  [[0, 6.5, 22, 60, 70], [0, 3.2, 33, 26, 30], [-6, 4, 30, 18, 16], [6, 4, 30, 18, 16]].forEach(a => { const l = new THREE.PointLight(0xffc27d, a[3], a[4], 1.6); l.position.set(a[0], a[1], a[2]); scene.add(l); });
  const spill = new THREE.PointLight(0xffd9a8, 9, 14, 1.7); spill.position.set(0, 3.4, 44.5); scene.add(spill);
  glow(0, 2.8, 40.9, 5.5, 0.32, 0xffd7a0);

  // ---- Lobby photo as a matte inside the 3D scene: when the camera reaches the doors it frames this still exactly,
  //      so the hand-off to the DOM lobby sequence (frame 0 = this still) is invisible. Dark slabs hide the atrium around it.
  const matteTex = new THREE.TextureLoader().load('./assets/scenes/lobby_start.webp', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; matteMesh.userData.aspect = t.image.width / t.image.height; });
  const matteMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: matteTex, toneMapped: false, fog: false }));
  matteMesh.userData.aspect = 2576 / 1438; matteMesh.position.set(0, 2.52, 35.2); scene.add(matteMesh); window.__lobbyMatte = matteMesh;
  const matteDark = new THREE.MeshBasicMaterial({ color: 0x080605, fog: false });
  const dBox = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matteDark); m.position.set(x, y, z); scene.add(m); };
  dBox(6.5, 0.06, 4.9, 0, GROUND_Y - 0.02, 37.65);
  dBox(6.5, 0.08, 5.2, 0, 4.12, 37.6);
  dBox(0.08, 3.2, 5.0, -3.25, 2.55, 37.7);
  dBox(0.08, 3.2, 5.0, 3.25, 2.55, 37.7);

  // Lobby kept in moody darkness, illuminated exclusively by dedicated gallery spotlight

  function updateEntrance(u) {
    // Automatic sliding glass doors open smoothly as camera approaches (raw between 0.32 and 0.58)
    const raw = clamp(u) * 6;
    const openProgress = smoother(clamp((raw - 0.32) / 0.24));
    doorLeft.position.x = -0.58 - openProgress * 1.15;
    doorRight.position.x = 0.58 + openProgress * 1.15;
  }

  // 4b. Dense Metropolitan Skyscraper Canyon & Plaza Promenade
  // Surrounds the dome on all sides with soaring modernist architectural high-rises
  const cityCanyon = new THREE.Group();
  cityCanyon.name = 'metropolitan-canyon';
  scene.add(cityCanyon);

  // Procedural architectural office window night texture
  function createSkyscraperWindowTexture() {
    // Night office tower: dark reflective glass + sparse, clustered lit windows (separate emissive map so dark panes stay dark)
    const W = 512, H = 1024, cols = 14, rows = 44;
    const alb = document.createElement('canvas'); alb.width = W; alb.height = H;
    const emi = document.createElement('canvas'); emi.width = W; emi.height = H;
    const a = alb.getContext('2d'), e = emi.getContext('2d');
    a.fillStyle = '#0c1018'; a.fillRect(0, 0, W, H);
    e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    const cw = W / cols, ch = H / rows;
    let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < rows; r++) {
      a.fillStyle = '#1a202b'; a.fillRect(0, r * ch, W, ch * 0.16);                 // slab edge
      const rowBias = Math.pow(rnd(), 1.6) * 0.65;                                    // some floors busier than others
      const warm = rnd() > 0.45;
      for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.10, y = r * ch + ch * 0.22, w = cw * 0.80, h = ch * 0.70;
        const g = 14 + Math.floor(rnd() * 12);
        a.fillStyle = `rgb(${g},${g + 5},${g + 14})`; a.fillRect(x, y, w, h);         // glass pane with slight variation
        if (rnd() < rowBias * 0.55) {
          const k = 0.55 + rnd() * 0.45;
          const col = warm ? [255 * k, 214 * k, 160 * k] : [205 * k, 222 * k, 245 * k];
          e.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; e.fillRect(x, y, w, h);
          a.fillStyle = e.fillStyle; a.globalAlpha = 0.35; a.fillRect(x, y, w, h); a.globalAlpha = 1;
        }
      }
    }
    const mk = cv => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tex = mk(alb); tex.userData.emissive = mk(emi);
    return tex;
  }

  const skyscraperWindowTex = createSkyscraperWindowTexture();

  const matSkyscraperGlass = new THREE.MeshStandardMaterial({
    color: 0xb8c4d6,
    map: skyscraperWindowTex,
    emissive: 0xffffff,
    emissiveMap: skyscraperWindowTex.userData.emissive,
    emissiveIntensity: 1.0,
    metalness: 0.65,
    roughness: 0.22,
    envMapIntensity: 2.6
  });

  const matSkyscraperBronze = new THREE.MeshStandardMaterial({
    color: 0x483a30,
    map: skyscraperWindowTex,
    emissive: 0xffd29d,
    emissiveMap: skyscraperWindowTex.userData.emissive,
    emissiveIntensity: 0.9,
    metalness: 0.75,
    roughness: 0.26,
    envMapIntensity: 2.2
  });

  const matSkyscraperCharcoal = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    metalness: 0.60,
    roughness: 0.32,
    envMapIntensity: 1.8
  });

  const matSkyscraperFacade = new THREE.MeshStandardMaterial({
    color: 0xb5bec6,
    metalness: 0.35,
    roughness: 0.30,
    map: pbrSets.facade?.diff,
    normalMap: pbrSets.facade?.nor,
    roughnessMap: pbrSets.facade?.rough,
    envMapIntensity: 2.5
  });
  if (pbrSets.facade?.diff) {
    pbrSets.facade.diff.repeat.set(4, 16);
    if (pbrSets.facade?.nor) pbrSets.facade.nor.repeat.set(4, 16);
    if (pbrSets.facade?.rough) pbrSets.facade.rough.repeat.set(4, 16);
  }

  const matWindowWarmGlow = new THREE.MeshStandardMaterial({
    color: 0xffeed8,
    emissive: 0xffd8a8,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.1
  });

  const matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xff3333 });

  function createModernistSkyscraper(cfg) {
    const { x, z, w, d, h, style = 'CURTAIN', ry = 0 } = cfg;
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);
    tower.rotation.y = ry;
    cityCanyon.add(tower);

    // 1. Street-level Podium Base
    const podH = Math.min(18, h * 0.12);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, podH, d * 1.08), matSkyscraperCharcoal);
    podium.position.y = podH / 2;
    podium.receiveShadow = true;
    tower.add(podium);

    // Podium entrance glass lobby band
    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 1.09, podH * 0.55, d * 1.09), matWindowWarmGlow);
    lobbyGlass.position.y = podH * 0.35;
    tower.add(lobbyGlass);

    // 2. Main Tower Shaft
    const shaftH = h - podH;
    let mainMat = matSkyscraperGlass;
    if (style === 'BRONZE') mainMat = matSkyscraperBronze;
    else if (style === 'FACADE') mainMat = matSkyscraperFacade;

    const shaft = new THREE.Mesh(new THREE.BoxGeometry(w, shaftH, d), mainMat);
    shaft.position.y = podH + shaftH / 2;
    shaft.receiveShadow = true;
    tower.add(shaft);

    // Horizontal architectural floor-bands (every 14 meters)
    const bandCount = Math.floor(shaftH / 14);
    for (let b = 1; b <= bandCount; b++) {
      const spandrel = new THREE.Mesh(new THREE.BoxGeometry(w * 1.015, 0.45, d * 1.015), matAluminium);
      spandrel.position.y = podH + b * 14;
      tower.add(spandrel);
    }

    // Vertical structural mullions on wider faces
    for (const side of [-1, 1]) {
      const mulZ = new THREE.Mesh(new THREE.BoxGeometry(0.35, shaftH, 0.45), matCharcoal);
      mulZ.position.set(0, podH + shaftH / 2, side * (d / 2 + 0.15));
      tower.add(mulZ);
      const mulX = new THREE.Mesh(new THREE.BoxGeometry(0.45, shaftH, 0.35), matCharcoal);
      mulX.position.set(side * (w / 2 + 0.15), podH + shaftH / 2, 0);
      tower.add(mulX);
    }

    // 3. Mechanical Penthouse Crown
    const crownH = Math.min(22, h * 0.14);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, crownH, d * 0.78), matCharcoal);
    crown.position.y = h + crownH / 2;
    tower.add(crown);

    // Illuminated crown top band
    const crownGlow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.79, 1.2, d * 0.79), matWindowWarmGlow);
    crownGlow.position.y = h + crownH * 0.85;
    tower.add(crownGlow);

    // 4. Rooftop Communications Spire & Aviation Beacon
    if (h > 150) {
      const spireH = Math.min(38, h * 0.18);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.85, spireH, 12), matAluminium);
      spire.position.y = h + crownH + spireH / 2;
      tower.add(spire);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), matBeaconRed);
      beacon.position.y = h + crownH + spireH + 0.3;
      tower.add(beacon);
    }

    return tower;
  }

  const SKYSCRAPER_LIST = [
    // --- WEST FLANK (Towering on the left of the plaza walkway) ---
    { x: -58, z: 46, w: 26, d: 30, h: 140, style: 'CURTAIN' },
    { x: -92, z: 75, w: 34, d: 38, h: 195, style: 'FACADE' },
    { x: -140, z: 25, w: 42, d: 46, h: 245, style: 'CURTAIN' },
    { x: -74, z: -20, w: 30, d: 34, h: 165, style: 'BRONZE' },
    { x: -115, z: -70, w: 38, d: 42, h: 215, style: 'CURTAIN' },
    { x: -180, z: -30, w: 46, d: 50, h: 260, style: 'FACADE' },
    { x: -85, z: 125, w: 32, d: 36, h: 170, style: 'BRONZE' },

    // --- EAST FLANK (Towering on the right of the plaza walkway) ---
    { x: 58, z: 46, w: 28, d: 32, h: 148, style: 'FACADE' },
    { x: 92, z: 75, w: 36, d: 40, h: 205, style: 'CURTAIN' },
    { x: 145, z: 25, w: 44, d: 48, h: 255, style: 'BRONZE' },
    { x: 76, z: -20, w: 32, d: 36, h: 175, style: 'CURTAIN' },
    { x: 120, z: -70, w: 40, d: 44, h: 225, style: 'FACADE' },
    { x: 185, z: -30, w: 48, d: 52, h: 270, style: 'CURTAIN' },
    { x: 88, z: 125, w: 34, d: 38, h: 180, style: 'BRONZE' },

    // --- NORTH HORIZON (Towering deep skyline directly behind the geodesic dome) ---
    { x: 0, z: -118, w: 50, d: 50, h: 290, style: 'CURTAIN' },
    { x: -62, z: -115, w: 40, d: 42, h: 230, style: 'BRONZE' },
    { x: 62, z: -115, w: 42, d: 42, h: 240, style: 'FACADE' },
    { x: -110, z: -155, w: 45, d: 48, h: 200, style: 'CURTAIN' },
    { x: 110, z: -155, w: 46, d: 48, h: 210, style: 'CURTAIN' },
    { x: 0, z: -195, w: 56, d: 56, h: 260, style: 'FACADE' },

    // --- SOUTH / PLAZA ENTRANCE CANYON ---
    { x: -65, z: 175, w: 36, d: 40, h: 175, style: 'CURTAIN' },
    { x: 65, z: 175, w: 38, d: 40, h: 185, style: 'FACADE' },

    // --- FAR FLANKS (Seamless edge coverage for ultra-wide displays) ---
    { x: -220, z: 60, w: 50, d: 50, h: 280, style: 'CURTAIN' },
    { x: -250, z: -80, w: 55, d: 55, h: 310, style: 'FACADE' },
    { x: -160, z: 160, w: 45, d: 45, h: 220, style: 'BRONZE' },
    { x: 225, z: 60, w: 52, d: 52, h: 285, style: 'FACADE' },
    { x: 260, z: -80, w: 58, d: 58, h: 320, style: 'CURTAIN' },
    { x: 165, z: 160, w: 46, d: 46, h: 225, style: 'BRONZE' }
  ];

  SKYSCRAPER_LIST.forEach(createModernistSkyscraper);

  // Grand Entrance Boulevard Promenade (Paved granite central approach)
  const boulevard = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.18, 76.0), matStone);
  boulevard.position.set(0, 0.09, 78.0);
  boulevard.receiveShadow = true;
  cityCanyon.add(boulevard);

  for (const bx of [-4.95, 4.95]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 76.0), matCharcoal);
    curb.position.set(bx, 0.14, 78.0);
    cityCanyon.add(curb);
  }

  for (let bz = 48; bz <= 112; bz += 16) {
    for (const px of [-5.6, 5.6]) {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 3.2), matCharcoal);
      planter.position.set(px, 0.325, bz);
      cityCanyon.add(planter);
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 3.0), matCharcoal);
      hedge.position.set(px, 0.70, bz);
      cityCanyon.add(hedge);
      const bl = new THREE.PointLight(0xffdfb8, 2.5, 6, 1.8);
      bl.position.set(px * 0.85, 0.5, bz);
      cityCanyon.add(bl);
    }
  }

  // 5. Executive 1960s Mid-Century Furniture & Decor
  const decor = new THREE.Group();
  decor.name = 'executive-decor';
  scene.add(decor);

  // Procedural Textures for Photoreal Equipment & Documents
  function createKeyboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18191c';
    ctx.fillRect(0, 0, 1024, 512);

    // Recessed well
    ctx.fillStyle = '#101114';
    ctx.beginPath();
    ctx.roundRect(70, 32, 884, 296, 10);
    ctx.fill();

    // Trackpad
    ctx.fillStyle = '#202124';
    ctx.strokeStyle = '#2e3036';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(330, 355, 364, 135, 12);
    ctx.fill();
    ctx.stroke();

    // Individual chiclet key rows
    const rowY = [44, 92, 140, 188, 236, 282];
    const rowCounts = [14, 14, 14, 13, 12, 8];
    for (let r = 0; r < rowY.length; r++) {
      const y = rowY[r];
      const count = rowCounts[r];
      const keyH = (r === 0 || r === 5) ? 30 : 36;
      const totalW = 860;
      const keyW = (totalW / count) - 6;
      for (let c = 0; c < count; c++) {
        let kw = keyW;
        let kx = 82 + c * (keyW + 6);
        if (r === 5 && c === 3) kw = keyW * 3.2; // Spacebar
        ctx.fillStyle = '#0a0b0d';
        ctx.strokeStyle = '#26282d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(kx, y, kw, keyH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(230, 235, 245, 0.45)';
        ctx.font = '10px monospace';
        ctx.fillText('•', kx + kw / 2 - 2, y + keyH / 2 + 3);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }

  const matKeyboard = new THREE.MeshStandardMaterial({
    map: createKeyboardTexture(),
    roughness: 0.35,
    metalness: 0.25
  });

  function createAcousticSlatTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    // Dark acoustic felt backing
    ctx.fillStyle = '#141518';
    ctx.fillRect(0, 0, 1024, 1024);

    // Architectural vertical walnut slats
    const slatWidth = 22;
    const gap = 10;
    const period = slatWidth + gap;
    for (let x = 2; x < 1024; x += period) {
      // Slat shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x - 2, 0, slatWidth + 4, 1024);
      // Slat wood gradient
      const grad = ctx.createLinearGradient(x, 0, x + slatWidth, 0);
      grad.addColorStop(0, '#382518');
      grad.addColorStop(0.25, '#523724');
      grad.addColorStop(0.75, '#5c3e29');
      grad.addColorStop(1, '#2f1e13');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, slatWidth, 1024);
      // Subtle wood grain streaks
      ctx.fillStyle = 'rgba(20, 10, 5, 0.18)';
      ctx.fillRect(x + 4, 0, 2, 1024);
      ctx.fillRect(x + 13, 0, 1.5, 1024);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);
    tex.anisotropy = 8;
    return tex;
  }

  const matAcousticSlat = new THREE.MeshStandardMaterial({
    map: createAcousticSlatTexture(),
    roughness: 0.62,
    metalness: 0.08
  });

  function createPaperDocumentTexture(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 724;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3eee4';
    ctx.fillRect(0, 0, 512, 724);

    ctx.strokeStyle = '#dfd6c6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 456, 668);

    ctx.fillStyle = '#1c1b18';
    ctx.font = 'bold 22px serif';
    ctx.fillText('TESHIMA LAB', 48, 76);

    ctx.fillStyle = '#7a7364';
    ctx.font = '11px sans-serif';
    ctx.fillText(title || 'CONFERENCE AGENDA & DIRECTION', 48, 100);

    ctx.strokeStyle = '#c6beae';
    ctx.beginPath();
    ctx.moveTo(48, 116);
    ctx.lineTo(464, 116);
    ctx.stroke();

    for (let y = 140; y < 650; y += 18) {
      const isHeader = (y % 80 === 0);
      ctx.fillStyle = isHeader ? '#3e3b34' : '#8c8577';
      const w = isHeader ? 280 : (y % 110 === 0 ? 370 : 416);
      ctx.fillRect(48, y, w, isHeader ? 4 : 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }

  // RoundedBoxGeometry helper with smooth subdivisions for soft, organic luxury furniture bevels
  const rBox = (w, h, d, r = 0.030, seg = 6) => {
    const maxR = Math.min(w, h, d) * 0.45;
    const safeR = Math.max(0.002, Math.min(r, maxR));
    return new RoundedBoxGeometry(w, h, d, seg, safeR);
  };

  // 1. Eames Executive Conference Chair (Molded walnut shell, polished aluminum 5-point star base, tufted leather)
  function createEamesChair(x, y, z, ry = 0) {
    const chair = new THREE.Group();
    chair.position.set(x, y, z);
    chair.rotation.y = ry;
    decor.add(chair);

    // Polished aluminum 5-point star caster base
    const starCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), matAluminium);
    starCenter.position.y = 0.08;
    chair.add(starCenter);

    for (let a = 0; a < 5; a++) {
      const ang = (a * Math.PI * 2) / 5;
      const leg = new THREE.Mesh(rBox(0.32, 0.03, 0.04, 0.008), matAluminium);
      leg.position.set(Math.cos(ang) * 0.18, 0.06, Math.sin(ang) * 0.18);
      leg.rotation.y = -ang;
      chair.add(leg);
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), matCharcoal);
      caster.position.set(Math.cos(ang) * 0.32, 0.025, Math.sin(ang) * 0.32);
      chair.add(caster);
    }

    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.38, 16), matAluminium);
    piston.position.y = 0.25;
    chair.add(piston);

    // Molded Walnut Shell (Seat) with soft organic curvature
    const seatShell = new THREE.Mesh(rBox(0.66, 0.04, 0.62, 0.025, 6), matWalnut);
    seatShell.position.set(0, 0.44, 0);
    chair.add(seatShell);

    const seatCushion = new THREE.Mesh(rBox(0.62, 0.09, 0.58, 0.045, 8), matLeather);
    seatCushion.position.set(0, 0.49, 0.01);
    chair.add(seatCushion);

    // Molded Walnut Shell (Backrest) with soft rounded edges
    const backShell = new THREE.Mesh(rBox(0.64, 0.68, 0.04, 0.025, 6), matWalnut);
    backShell.position.set(0, 0.88, -0.26);
    backShell.rotation.x = -0.16;
    chair.add(backShell);

    const backCushion = new THREE.Mesh(rBox(0.58, 0.64, 0.08, 0.045, 8), matLeather);
    backCushion.position.set(0, 0.88, -0.22);
    backCushion.rotation.x = -0.16;
    chair.add(backCushion);

    // Polished Aluminum Armrests with Leather Pads
    for (const sx of [-0.34, 0.34]) {
      const armSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 12), matAluminium);
      armSupport.position.set(sx, 0.58, -0.06);
      chair.add(armSupport);
      const armPad = new THREE.Mesh(rBox(0.09, 0.04, 0.40, 0.012), matLeather);
      armPad.position.set(sx, 0.70, -0.04);
      chair.add(armPad);
    }
    return chair;
  }

  // 2. Architectural Indoor Potted Greenery (Monstera / Ficus)
  const matCeramicPot = new THREE.MeshStandardMaterial({
    color: 0xd8d4cb,
    roughness: 0.82,
    metalness: 0.05
  });

  const plantLeafMat = new THREE.MeshStandardMaterial({
    color: 0x1f3822,
    roughness: 0.35,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  function createPottedPlant(x, y, z, scale = 1) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, y, z);
    plantGroup.scale.setScalar(scale);
    decor.add(plantGroup);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.65, 24), matCeramicPot);
    pot.position.y = 0.325;
    plantGroup.add(pot);

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 20), matCharcoal);
    soil.position.y = 0.62;
    plantGroup.add(soil);

    const leafAngles = [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9, 5.6];
    leafAngles.forEach((ang, idx) => {
      const stemH = 0.6 + (idx % 3) * 0.25;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, stemH, 8), plantLeafMat);
      stem.position.set(Math.cos(ang) * 0.08, 0.65 + stemH / 2, Math.sin(ang) * 0.08);
      stem.rotation.z = Math.sin(ang) * 0.25;
      stem.rotation.x = Math.cos(ang) * 0.25;
      plantGroup.add(stem);

      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.42), plantLeafMat);
      leaf.position.set(Math.cos(ang) * 0.22, 0.65 + stemH + 0.12, Math.sin(ang) * 0.22);
      leaf.rotation.y = -ang;
      leaf.rotation.x = 0.55;
      plantGroup.add(leaf);
    });
    return plantGroup;
  }

  // 3. Mid-Century Reception Lounge Sofa (Tufted black leather, walnut frame, brass legs)
  function createLoungeSofa(x, y, z, ry = 0) {
    const sofa = new THREE.Group();
    sofa.position.set(x, y, z);
    sofa.rotation.y = ry;
    decor.add(sofa);

    const frame = new THREE.Mesh(rBox(2.4, 0.10, 0.95, 0.02), matWalnut);
    frame.position.set(0, 0.22, 0);
    sofa.add(frame);

    for (const lx of [-1.05, 1.05]) {
      for (const lz of [-0.38, 0.38]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.20, 12), matBrass);
        leg.position.set(lx, 0.10, lz);
        sofa.add(leg);
      }
    }

    const seat = new THREE.Mesh(rBox(2.32, 0.22, 0.90, 0.04), matLeather);
    seat.position.set(0, 0.38, 0);
    sofa.add(seat);

    const back = new THREE.Mesh(rBox(2.32, 0.45, 0.20, 0.04), matLeather);
    back.position.set(0, 0.65, -0.36);
    sofa.add(back);

    for (const sx of [-1.15, 1.15]) {
      const arm = new THREE.Mesh(rBox(0.14, 0.36, 0.90, 0.03), matLeather);
      arm.position.set(sx, 0.52, 0);
      sofa.add(arm);
    }

    // Low walnut coffee table with magazines
    const table = new THREE.Mesh(rBox(1.4, 0.06, 0.70, 0.015), matWalnut);
    table.position.set(0, 0.26, 1.10);
    sofa.add(table);

    for (const tx of [-0.60, 0.60]) {
      for (const tz of [-0.25, 0.25]) {
        const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.01, 0.24, 12), matBrass);
        tLeg.position.set(tx, 0.12, 1.10 + tz);
        sofa.add(tLeg);
      }
    }
    return sofa;
  }

  // 4. Dieter Rams / Braun Vintage Audio Unit
  function createBraunMasteringUnit(x, y, z) {
    const unit = new THREE.Group();
    unit.position.set(x, y, z);
    decor.add(unit);

    const chassis = new THREE.Mesh(rBox(0.72, 0.16, 0.38, 0.015), matAluminium);
    chassis.position.y = 0.08;
    unit.add(chassis);

    for (const wx of [-0.37, 0.37]) {
      const side = new THREE.Mesh(rBox(0.025, 0.17, 0.39, 0.008), matWalnut);
      side.position.set(wx, 0.08, 0);
      unit.add(side);
    }

    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0x222222,
      transmission: 0.88,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05
    });
    const lid = new THREE.Mesh(rBox(0.72, 0.015, 0.38, 0.005), lidMat);
    lid.rotation.x = -0.45;
    lid.position.set(0, 0.25, -0.06);
    unit.add(lid);

    for (let k = 0; k < 6; k++) {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 16), matAluminium);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(-0.25 + k * 0.10, 0.08, 0.195);
      unit.add(knob);
    }

    const vuMeter = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.06), new THREE.MeshBasicMaterial({ color: 0xffdfaa }));
    vuMeter.position.set(0.18, 0.08, 0.192);
    unit.add(vuMeter);

    return unit;
  }

  // --- CURATED CULTURAL & ARCHITECTURAL ASSETS (1F to 6F) ---
  initCulturalAssets({
    decor,
    rBox,
    matAluminium,
    matWalnut,
    matCharcoal,
    matBrass,
    matLeather,
    matStone,
    createEamesChair
  });

  // --- 2F PRESENTATION: Large Wall-Mounted Presentation Monitor & Conference Seating ---
  const presWallGroup = new THREE.Group();
  presWallGroup.position.set(0, 5.30, -17.80);
  decor.add(presWallGroup);

  // Full-Height Architectural Media Feature Wall (Walnut acoustic slat paneling behind monitor)
  const pAcousticWall = new THREE.Mesh(new THREE.BoxGeometry(8.60, 4.65, 0.12), matAcousticSlat);
  pAcousticWall.position.set(0, 2.325, -0.06);
  presWallGroup.add(pAcousticWall);

  const pMonitorFrame = new THREE.Mesh(rBox(2.30, 1.32, 0.04, 0.015), matAluminium);
  pMonitorFrame.position.set(0, 2.20, 0.01);
  presWallGroup.add(pMonitorFrame);

  // Executive presentation low credenza beneath wall monitor with soft bullnose edges
  const pCredenza = new THREE.Mesh(rBox(3.20, 0.55, 0.50, 0.045, 8), matWalnut);
  pCredenza.position.set(0, 0.275, 0.30);
  pCredenza.castShadow = true;
  presWallGroup.add(pCredenza);

  // Row of Eames conference chairs facing the wall monitor!
  createEamesChair(-1.30, 5.30, -14.8, Math.PI);
  createEamesChair(0.00, 5.30, -14.6, Math.PI);
  createEamesChair(1.30, 5.30, -14.8, Math.PI);

  // --- 3F LP: Solid Walnut Desk, MacBook with Realistic Keyboard, Brass Lamp, Speaker ---
  const lpGroup = new THREE.Group();
  lpGroup.position.set(0, 9.95, -16.20);
  decor.add(lpGroup);

  // Walnut executive desk with smooth rounded desktop edges
  const lpDeskTop = new THREE.Mesh(rBox(2.4, 0.08, 1.05, 0.038, 8), matWalnut);
  lpDeskTop.position.set(0, 0.70, 0);
  lpGroup.add(lpDeskTop);

  for (const lx of [-1.05, 1.05]) {
    const lLeg = new THREE.Mesh(rBox(0.08, 0.70, 0.90, 0.025, 6), matCharcoal);
    lLeg.position.set(lx, 0.35, 0);
    lpGroup.add(lLeg);
  }

  // MacBook Base with REAL KEYBOARD TEXTURE
  const lpMacBase = new THREE.Mesh(rBox(0.48, 0.016, 0.32, 0.008, 6), matKeyboard);
  lpMacBase.position.set(0, 0.748, 0.08);
  lpGroup.add(lpMacBase);

  // MacBook Display Lid
  const lpMacLid = new THREE.Mesh(rBox(0.48, 0.30, 0.012, 0.008, 6), matCharcoal);
  lpMacLid.rotation.x = -0.18;
  lpMacLid.position.set(0, 0.930, -0.07);
  lpGroup.add(lpMacLid);

  // Brass Mushroom Dome Lamp
  const dLamp = new THREE.Group();
  dLamp.position.set(0.95, 0.74, 0.15);
  lpGroup.add(dLamp);
  const dBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 24), matBrass);
  dBase.position.y = 0.01;
  dLamp.add(dBase);
  const dStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 16), matBrass);
  dStem.position.y = 0.17;
  dLamp.add(dStem);
  const dShade = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), matBrass);
  dShade.position.y = 0.32;
  dLamp.add(dShade);

  // Warm task lamp downlight casting soft specular glow on walnut desk & MacBook keyboard
  const dLampLight = new THREE.PointLight(0xffdfa8, 14, 3.2, 2.0);
  dLampLight.position.set(0.95, 0.98, 0.15);
  lpGroup.add(dLampLight);

  // Braun cylindrical speaker
  const spkCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 24), matCharcoal);
  spkCyl.position.set(-0.95, 0.81, 0.15);
  lpGroup.add(spkCyl);

  // Eames executive chair facing the desk!
  createEamesChair(0.65, 9.95, -15.15, Math.PI - 0.25);

  // --- 4F WEB: Desktop PC Workstation with Ultrawide Display, Keyboard & Audio Speaker ---
  const webStudioProps = new THREE.Group();
  webStudioProps.position.set(-3.0, 14.60, -12.912);
  decor.add(webStudioProps);

  // Workstation Desk Top with soft rounded edges
  const webDesk = new THREE.Mesh(rBox(2.4, 0.08, 1.05, 0.038, 8), matWalnut);
  webDesk.position.set(0, 0.70, 0);
  webStudioProps.add(webDesk);

  for (const lx of [-1.05, 1.05]) {
    const wLeg = new THREE.Mesh(rBox(0.08, 0.70, 0.90, 0.025, 6), matCharcoal);
    wLeg.position.set(lx, 0.35, 0);
    webStudioProps.add(wLeg);
  }

  // Ultrawide Display Stand & Housing
  const mStandBase = new THREE.Mesh(rBox(0.32, 0.015, 0.22, 0.010, 6), matAluminium);
  mStandBase.position.set(0, 0.75, 0.02);
  webStudioProps.add(mStandBase);
  const mStandPole = new THREE.Mesh(rBox(0.05, 0.35, 0.04, 0.010, 6), matAluminium);
  mStandPole.position.set(0, 0.92, -0.02);
  webStudioProps.add(mStandPole);

  const mHousing = new THREE.Mesh(rBox(0.92, 0.53, 0.03, 0.014, 6), matCharcoal);
  mHousing.position.set(0, 1.05, 0);
  webStudioProps.add(mHousing);

  // Standalone Slim Keyboard with real chiclet keys texture
  const wKb = new THREE.Mesh(rBox(0.44, 0.014, 0.16, 0.008, 6), matKeyboard);
  wKb.position.set(0, 0.748, 0.22);
  webStudioProps.add(wKb);

  const wMouse = new THREE.Mesh(rBox(0.065, 0.025, 0.11, 0.012, 6), matCharcoal);
  wMouse.position.set(0.32, 0.75, 0.22);
  webStudioProps.add(wMouse);

  // Studio Audio Monitor Speaker on right with soft chamfered cabinet
  const spkBody = new THREE.Mesh(rBox(0.20, 0.32, 0.22, 0.025, 6), matCharcoal);
  spkBody.position.set(0.75, 0.90, 0.04);
  webStudioProps.add(spkBody);
  const spkConeYellow = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.02, 0.015, 20), new THREE.MeshStandardMaterial({ color: 0xd4a034, roughness: 0.35 }));
  spkConeYellow.rotation.x = Math.PI / 2;
  spkConeYellow.position.set(0.75, 0.86, 0.155);
  webStudioProps.add(spkConeYellow);
  const spkTweeter = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), matCharcoal);
  spkTweeter.position.set(0.75, 0.98, 0.155);
  webStudioProps.add(spkTweeter);

  // Designer desk lamp on left
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 20), matCharcoal);
  lampBase.position.set(-0.78, 0.75, 0.06);
  webStudioProps.add(lampBase);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 12), matCharcoal);
  lampPole.position.set(-0.78, 0.96, 0.06);
  webStudioProps.add(lampPole);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 20), matCharcoal);
  lampHead.rotation.z = Math.PI * 0.25;
  lampHead.position.set(-0.72, 1.16, 0.06);
  webStudioProps.add(lampHead);

  // Task lamp downlight casting focused specular highlight on workstation desk & keyboard
  const webLampLight = new THREE.PointLight(0xffdfa8, 14, 3.0, 2.0);
  webLampLight.position.set(-0.70, 1.12, 0.08);
  webStudioProps.add(webLampLight);

  // Eames executive chair facing desk!
  createEamesChair(-2.35, 14.60, -11.85, 2.6);

  // --- 5F DIRECTION: Walnut Boardroom Table with Distributed Paper Conference Documents ---
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, 19.25, -16.60);
  decor.add(tableGroup);

  const confTable = new THREE.Mesh(rBox(4.8, 0.08, 1.40, 0.042, 8), matWalnut);
  confTable.position.set(0, 0.70, 0);
  tableGroup.add(confTable);

  for (const lx of [-1.8, 1.8]) {
    const leg = new THREE.Mesh(rBox(0.14, 0.70, 1.10, 0.030, 6), matCharcoal);
    leg.position.set(lx, 0.35, 0);
    tableGroup.add(leg);
  }

  // Main 3D open publication / catalog spread in center of table
  const bookCover = new THREE.Mesh(rBox(1.18, 0.016, 0.69, 0.006), matCharcoal);
  bookCover.position.set(0, 0.748, 0.40);
  tableGroup.add(bookCover);

  const bookPages = new THREE.Mesh(rBox(1.14, 0.008, 0.65, 0.003), matStone);
  bookPages.position.set(0, 0.748, 0.40);
  tableGroup.add(bookPages);

  // Distributed A4 paper conference documents for meeting attendees
  const matDoc = new THREE.MeshStandardMaterial({
    map: createPaperDocumentTexture('DIRECTION STRATEGY & ARCHITECTURE'),
    roughness: 0.85
  });

  const docLayouts = [
    { x: -1.45, z: 0.38, ry: 0.08 },
    { x: -0.75, z: -0.25, ry: -0.05 },
    { x: 0.75, z: -0.25, ry: 0.06 },
    { x: 1.45, z: 0.38, ry: -0.07 }
  ];
  docLayouts.forEach(dl => {
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.39), matDoc);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = dl.ry;
    paper.position.set(dl.x, 0.745, dl.z);
    tableGroup.add(paper);
  });

  // Eames conference chairs around table (ALL FACING INWARDS TOWARDS TABLE!)
  [-1.6, -0.5, 0.5, 1.6].forEach(cx => {
    createEamesChair(cx, 19.25, -17.4, 0); // North side facing +Z towards table
  });
  [-1.6, 1.6].forEach(cx => {
    createEamesChair(cx, 19.25, -15.8, Math.PI); // South side facing -Z towards table
  });
  createEamesChair(-2.65, 19.25, -16.6, Math.PI / 2); // West head of table facing +X towards table center
  createEamesChair(2.65, 19.25, -16.6, -Math.PI / 2); // East head of table facing -X towards table center

  // --- 6F OTHER: Large Wall-Mounted Studio Monitor & Dieter Rams Braun Console ---
  const studioWallGroup = new THREE.Group();
  studioWallGroup.position.set(0, 23.90, -18.50);
  decor.add(studioWallGroup);

  // Full-Height Studio Acoustic Control Room Wall behind Wall Monitor
  const sAcousticWall = new THREE.Mesh(new THREE.BoxGeometry(8.60, 4.65, 0.12), matAcousticSlat);
  sAcousticWall.position.set(0, 2.325, -0.06);
  studioWallGroup.add(sAcousticWall);

  const sMonitorFrame = new THREE.Mesh(rBox(2.30, 1.32, 0.04, 0.015), matAluminium);
  sMonitorFrame.position.set(0, 2.20, 0.01);
  studioWallGroup.add(sMonitorFrame);

  // Audio Mastering Console Desk beneath wall monitor with soft rounded edges
  const consoleDesk = new THREE.Mesh(rBox(3.4, 0.08, 1.10, 0.038, 8), matWalnut);
  consoleDesk.position.set(0, 0.70, 0.45);
  studioWallGroup.add(consoleDesk);

  for (const lx of [-1.5, 1.5]) {
    const cLeg = new THREE.Mesh(rBox(0.10, 0.70, 0.95, 0.025, 6), matCharcoal);
    cLeg.position.set(lx, 0.35, 0.45);
    studioWallGroup.add(cLeg);
  }

  // Dieter Rams / Braun Vintage Audio Unit sitting on console
  createBraunMasteringUnit(0, 24.64, -18.05);

  // Black stereo receiver on left
  const blackRec = new THREE.Mesh(rBox(0.48, 0.16, 0.36, 0.020, 6), matCharcoal);
  blackRec.position.set(-1.15, 24.72, -18.05);
  decor.add(blackRec);
  const recDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.06), new THREE.MeshBasicMaterial({ color: 0x0a141a }));
  recDisplay.position.set(-1.15, 24.72, -17.865);
  decor.add(recDisplay);

  // Studio monitor speakers on sides
  for (const spkX of [-1.55, 1.55]) {
    const sBox = new THREE.Mesh(rBox(0.22, 0.38, 0.28, 0.025, 6), matCharcoal);
    sBox.position.set(spkX, 24.83, -18.05);
    decor.add(sBox);
  }

  // Eames executive chair facing the mastering console and wall monitor!
  createEamesChair(0.70, 23.90, -16.60, Math.PI - 0.20);

  // 5b. Studio floors (2F to 6F) are kept in atmospheric darkness,
  // illuminated exclusively by the dedicated gallery spotlights aimed at each thumbnail.

  // 6. Architectural Observation Glass Elevator (1F to 6F)
  const lift = new THREE.Group();
  lift.name = 'observation-elevator';
  scene.add(lift);

  const matElevatorGlass = new THREE.MeshPhysicalMaterial({
    color: 0x7a9c94,
    metalness: 0.15,
    roughness: 0.08,
    transmission: 0.58,
    ior: 1.54,
    thickness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    envMapIntensity: 2.8
  });

  const liftMat = matAluminium;
  const liftGlass = matElevatorGlass;

  // Car floor and ceiling
  const lBox = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    lift.add(m);
    return m;
  };
  lBox(2.65, 0.12, 2.50, 0, -0.06, 0, liftMat);
  lBox(2.65, 0.10, 2.50, 0, 3.12, 0, liftMat);
  // Elevator floor threshold plate on car
  lBox(2.40, 0.04, 0.50, 0, 0.02, -1.25, matAluminium);

  const floorY = idx => 0.65 + (idx - 1) * FLOOR_HEIGHT;

  // Structural hallway floor bridge connecting platforms on each floor (1F to 6F)
  for (let f = 1; f <= 6; f++) {
    const bridgeY = floorY(f);
    const floorPlate = new THREE.Mesh(rBox(2.40, 0.06, 1.20, 0.01), matAluminium);
    floorPlate.position.set(0, bridgeY - 0.03, -1.85);
    decor.add(floorPlate);
  }

  // Four corner pillars
  for (const cx of [-1.28, 1.28]) {
    for (const cz of [-1.20, 1.20]) {
      lBox(0.09, 3.14, 0.09, cx, 1.54, cz, liftMat);
    }
  }
  // Side glass walls
  lBox(0.06, 2.95, 2.36, -1.27, 1.54, 0, liftGlass);
  lBox(0.06, 2.95, 2.36, 1.27, 1.54, 0, liftGlass);
  // Dual-door design: Front sliding doors facing room (-Z) and rear doors facing lobby (+Z)
  const doorNorth = [
    lBox(1.18, 2.85, 0.06, -0.59, 1.50, -1.22, liftGlass),
    lBox(1.18, 2.85, 0.06, 0.59, 1.50, -1.22, liftGlass)
  ];
  const doorSouth = [
    lBox(1.18, 2.85, 0.06, -0.59, 1.50, 1.22, liftGlass),
    lBox(1.18, 2.85, 0.06, 0.59, 1.50, 1.22, liftGlass)
  ];

  // Warm interior LED lighting
  const liftLight = new THREE.PointLight(0xffecd0, 32, 8, 1.8);
  liftLight.position.set(0, 2.95, 0);
  lift.add(liftLight);
  const liftCeilingPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: 0xfff6e5 }));
  liftCeilingPanel.rotation.x = Math.PI / 2;
  liftCeilingPanel.position.set(0, 3.06, 0);
  lift.add(liftCeilingPanel);

  lift.position.set(0, 0.65, 0);

  // Enable physical shadow casting and contact shadow receiving across all furniture & decor
  decor.traverse(node => {
    if (node.isMesh) {
      if (!node.material.transparent || node.material.opacity > 0.5) {
        node.castShadow = true;
      }
      node.receiveShadow = true;
    }
  });
  lift.traverse(node => {
    if (node.isMesh) {
      if (!node.material.transparent || node.material.opacity > 0.5) {
        node.castShadow = true;
      }
      node.receiveShadow = true;
    }
  });

  function updateLift(u) {
    const raw = clamp(u) * 6;
    if (raw <= 1) {
      lift.position.y = 0.65;
      doorNorth[0].position.x = -0.59;
      doorNorth[1].position.x = 0.59;
      doorSouth[0].position.x = -1.18;
      doorSouth[1].position.x = 1.18;
      return;
    }
    const i = Math.min(5, Math.floor(raw));
    const q = i === 6 ? 1 : raw - i;
    const y0 = floorY(i);
    const y1 = floorY(i + 1);

    // Vertical elevator motion between q=0.38 and q=0.64
    const liftT = smoother(clamp((q - 0.38) / 0.24));
    lift.position.y = THREE.MathUtils.lerp(y0, y1, liftT);

    // Door open/close logic
    const openBefore = 1 - clamp((q - 0.28) / 0.09);
    const openAfter = clamp((q - 0.64) / 0.10);
    const open = Math.max(openBefore, openAfter);

    doorNorth[0].position.x = -0.59 - open * 0.65;
    doorNorth[1].position.x = 0.59 + open * 0.65;
    doorSouth[0].position.x = -0.59 - open * 0.65;
    doorSouth[1].position.x = 0.59 + open * 0.65;
  }

  // 7. Portfolio Display Surfaces (All 6 Floors)
  // Precise aspect-ratio specifications matching link destinations without any cropping:
  // 1F: Guestbook on counter (1.5:1 ratio)
  // 2F: Large Wall-Mounted Presentation Monitor (16:9 ratio)
  // 3F: LP MacBook Retina Display (16:10 ratio)
  // 4F: Web Desktop Studio Display (16:9 ratio)
  // 5F: DIRECTION Table Open Publication Spread (16:9 ratio)
  // 6F: OTHER Large Wall-Mounted Mastering Studio Monitor (16:9 ratio)
  const surfaceSpec = [
    { type: 'DESK PAD', xyz: [0.15, 1.606, 34.02], wh: [0.80, 0.595], rx: -Math.PI / 2 - 0.06, name: 'ABOUT' },
    { type: 'WALL MONITOR', xyz: [0, 7.500, -17.760], wh: [2.24, 1.26], rx: 0, name: 'PRESENTATION' },
    { type: 'DESK LAPTOP', xyz: [0, 10.880, -16.255], wh: [0.44, 0.275], rx: -0.18, name: 'LP' },
    { type: 'WORK MONITOR', xyz: [-3.0, 15.650, -12.892], wh: [0.888, 0.50], rx: 0, name: 'WEB' },
    { type: 'OPEN CATALOG', xyz: [0, 20.012, -16.200], wh: [1.19, 0.63], rx: -Math.PI / 2, name: 'DIRECTION' },
    { type: 'WALL MONITOR', xyz: [0, 26.100, -18.460], wh: [2.30, 1.202], rx: 0, name: 'OTHER' }
  ];

  const surfaces = [];
  const surfaceFrames = [];

  for (let i = 0; i < 6; i++) {
    const conf = surfaceSpec[i];
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0x1f1e1c,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...conf.wh), fallbackMat);
    mesh.position.set(...conf.xyz);
    mesh.rotation.x = conf.rx;
    mesh.userData.stage = i + 1;
    mesh.name = `work-surface-${i + 1}`;
    mesh.renderOrder = 0;

    // Slim bezel frame for monitors and laptop (omit on guestbook, desk pad, wall monitors and catalog)
    if (conf.type !== 'WALL MONITOR' && conf.type !== 'GUESTBOOK' && conf.type !== 'DESK PAD' && conf.type !== 'OPEN CATALOG') {
      const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(conf.wh[0] * 1.02, conf.wh[1] * 1.02));
      const frameMat = new THREE.LineBasicMaterial({
        color: 0x282828,
        transparent: true,
        opacity: 0.65,
        depthTest: true,
        depthWrite: false
      });
      const frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.z = 0.0015;
      mesh.add(frame);
      surfaceFrames.push(frame);
    }

    scene.add(mesh);
    surfaces.push(mesh);
  }

  // 7b. Dedicated Museum Gallery Spotlights with Physically Correct Specular Bounce (NO FAKE BEAMS)
  // Overhead luminaires with physical inverse-square falloff (decay: 2.0) casting genuine specular reflection pools
  const gallerySpotlights = [];
  const spotConfigs = [
    // 1F ABOUT (Reception desk pad - overhead luminaire casting glossy specular reflection on honed marble)
    { pos: [0.15, 4.2, 34.2], targetPos: [0.15, 1.58, 34.02], color: 0xfff6ec, baseIntensity: 180, angle: Math.PI / 4.6, penumbra: 0.60, dist: 10 },
    // 2F PRESENTATION (Wall presentation monitor - high atrium fixture casting clearcoat screen reflection)
    { pos: [0.0, 11.2, -14.2], targetPos: [0.0, 7.50, -17.76], color: 0xfff7ee, baseIntensity: 190, angle: Math.PI / 4.5, penumbra: 0.60, dist: 14 },
    // 3F LP (MacBook on desk - overhead fixture bouncing warm specular sheen on dark walnut)
    { pos: [0.0, 14.8, -14.8], targetPos: [0.0, 10.88, -16.25], color: 0xfff9f0, baseIntensity: 170, angle: Math.PI / 4.6, penumbra: 0.60, dist: 10 },
    // 4F WEB (Workstation monitor & keyboard - overhead fixture highlighting studio display & desk)
    { pos: [-3.0, 19.4, -11.2], targetPos: [-3.0, 15.65, -12.89], color: 0xfff9f0, baseIntensity: 170, angle: Math.PI / 4.6, penumbra: 0.60, dist: 10 },
    // 5F DIRECTION (Conference table open catalog spread - fixture casting broad wood grain specular reflection)
    { pos: [0.0, 24.2, -14.6], targetPos: [0.0, 20.01, -16.20], color: 0xfff6ec, baseIntensity: 190, angle: Math.PI / 4.5, penumbra: 0.60, dist: 11 },
    // 6F OTHER (Wall master monitor & Braun console - fixture highlighting brushed aluminum faceplate & knobs)
    { pos: [0.0, 30.2, -14.6], targetPos: [0.0, 26.10, -18.46], color: 0xfff7ee, baseIntensity: 190, angle: Math.PI / 4.5, penumbra: 0.60, dist: 14 }
  ];

  for (let i = 0; i < 6; i++) {
    const sc = spotConfigs[i];
    const spot = new THREE.SpotLight(sc.color, 0, sc.dist, sc.angle, sc.penumbra, 2.0);
    spot.position.set(...sc.pos);
    spot.target = surfaces[i];
    spot.userData.baseIntensity = sc.baseIntensity;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0003;
    spot.shadow.normalBias = 0.02;
    spot.shadow.camera.near = 0.5;
    spot.shadow.camera.far = sc.dist * 1.2;
    scene.add(spot);
    scene.add(spot.target);
    gallerySpotlights.push(spot);
  }

  // Load preview WebP textures with realistic illumination and physical surface properties
  await Promise.all(surfaces.map(async (mesh, i) => {
    const path = `./assets/previews/${PREVIEW_FILES[i]}.webp?v=${Date.now()}`;
    try {
      const tex = await texLoader.loadAsync(path);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      mesh.material.dispose();

      if (i === 0) {
        // 01F Creator Portrait: Photographic Satin Finish with ambient backlight
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.25,
          metalness: 0.02,
          emissive: 0xffffff,
          emissiveMap: tex,
          emissiveIntensity: 0.18,
          side: THREE.FrontSide,
          depthWrite: true,
          depthTest: true
        });
      } else if (i === 4) {
        // 05F Open Publication: Fine Art Print Material
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.70,
          metalness: 0.0,
          emissive: 0xffffff,
          emissiveMap: tex,
          emissiveIntensity: 0.16,
          side: THREE.FrontSide,
          depthWrite: true,
          depthTest: true
        });
      } else {
        // 02F, 03F, 04F, 06F: Illuminated High-End OLED / Retina Screens with Backlit Glow
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: 0xffffff,
          emissiveMap: tex,
          emissiveIntensity: 0.40,
          roughness: 0.14,
          metalness: 0.05,
          side: THREE.FrontSide,
          depthWrite: true,
          depthTest: true
        });
      }
      mesh.renderOrder = 0;
      updateProgress(`PORTAL ${PREVIEW_FILES[i].toUpperCase()} LOADED`);
    } catch (e) {
      console.warn(`Preview thumbnail unavailable: ${PREVIEW_FILES[i]}`, e);
      updateProgress(`PORTAL ${PREVIEW_FILES[i].toUpperCase()} SKIPPED`);
    }
  }));

  // Preload Presentation Slide Deck textures for Floor 2 presentation monitor sequence
  const presSlidePaths = [
    './assets/previews/presentation.webp',
    './slide3_ai_dilemma.png',
    './slide6_closed_ai.png',
    './slide8_web_production.png',
    './slide10_direction_hub.png',
    './slide12_oem_print.png',
    './slide14_dev_support.png'
  ];
  const presSlideTextures = [];
  for (const sPath of presSlidePaths) {
    try {
      const sTex = await texLoader.loadAsync(sPath);
      sTex.colorSpace = THREE.SRGBColorSpace;
      sTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      presSlideTextures.push(sTex);
    } catch (_) {}
  }
  let presSlideIdx = 0;
  let lastSlideChange = performance.now();

  // 8. Cinematic Camera Choreography
  // Low-angle dramatic entrance shot looking up at the geodesic dome and towering skyscraper skyline
  const exteriorPose = { p: [0, 2.4, 66.0], t: [0, 22.0, 16.0], f: 48 };

  // Targets at each stage (Cinematic Mid-Century Studio Perspectives matching user reference board)
  const targetSpec = [
    // 01F ABOUT: Eye-level reading perspective on reception desk pad
    { p: [0.15, 2.45, 35.45], t: [0.15, 1.608, 34.02], f: 38 },
    // 02F PRESENTATION: Large Wall-Mounted Presentation Monitor, row of Eames chairs facing screen
    { p: [0, 7.15, -11.8], t: [0, 6.70, -17.78], f: 46 },
    // 03F LP: Solid walnut desk, MacBook Pro with chiclet keyboard keys, Braun speaker, brass lamp
    { p: [0.30, 11.45, -14.4], t: [0, 10.80, -16.20], f: 45 },
    // 04F WEB: Studio workstation, widescreen display, keyboard, mouse, yellow cone speaker, lamp
    { p: [-2.9, 16.15, -10.8], t: [-3.0, 15.50, -12.89], f: 46 },
    // 05F DIRECTION: Walnut boardroom table, seated perspective, distributed A4 documents + open catalog spread
    { p: [0.70, 21.40, -13.5], t: [0.0, 19.95, -16.40], f: 46 },
    // 06F OTHER: Large Wall-Mounted Studio Monitor, Dieter Rams / Braun vintage audio console unit
    { p: [0.0, 25.80, -12.6], t: [0.0, 25.40, -18.48], f: 48 }
  ];

  const interp = (a, b, t) => ({
    p: a.p.map((v, j) => THREE.MathUtils.lerp(v, b.p[j], smoother(t))),
    t: a.t.map((v, j) => THREE.MathUtils.lerp(v, b.t[j], smoother(t))),
    f: THREE.MathUtils.lerp(a.f, b.f, smoother(t))
  });

  function pathValue(keyframes, q) {
    if (q <= keyframes[0][0]) return keyframes[0][1];
    for (let j = 1; j < keyframes.length; j++) {
      const [u, b] = keyframes[j];
      const [prev, a] = keyframes[j - 1];
      if (q <= u) return interp(a, b, (q - prev) / (u - prev));
    }
    return keyframes.at(-1)[1];
  }

  const pose = (p, t, f = 44) => ({ p, t, f });

  function cameraOnPath(u) {
    const raw = clamp(u) * 6;
    if (raw <= 1) {
      // 0 -> 1: Exterior low-angle looking up -> Gaze tilts down to automatic doors -> Glide into vestibule -> 01F ABOUT Guestbook
      return pathValue([
        [0.00, exteriorPose],
        [0.22, pose([0, 2.55, 56.0], [0, 10.5, 30.0], 46)],
        [0.42, pose([0, 2.75, 46.5], [0, 3.4, 36.0], 44)],
        [0.60, pose([0, 2.52, 39.2], [0, 2.52, 30.0], 42)],
        [0.80, pose([0.10, 2.25, 36.8], [0.15, 1.68, 34.02], 38)],
        [0.92, pose([0.15, 2.45, 35.6], [0.15, 1.61, 34.02], 38)],
        [1.00, targetSpec[0]]
      ], raw);
    }

    const i = Math.min(5, Math.floor(raw));
    const q = i === 6 ? 1 : raw - i;
    const prev = targetSpec[i - 1];
    const next = targetSpec[i];
    const y0 = floorY(i);
    const y1 = floorY(i + 1);

    if (i === 1) {
      // 1F (ABOUT) -> 2F (PRESENTATION) via Glass Observation Elevator
      return pathValue([
        [0.00, prev],
        [0.14, pose([0, 2.45, 24.0], [0, 2.10, 6.0], 42)],
        [0.26, pose([0, 2.25, 9.0], [0, 2.05, -2.0], 46)],
        [0.38, pose([0, y0 + 1.80, 0.35], [0, y0 + 1.80, -10.0], 48)],
        [0.64, pose([0, y1 + 1.80, 0.35], [0, y1 + 1.80, -10.0], 48)],
        [0.74, pose([0, y1 + 2.10, -4.8], [0, y1 + 2.00, -14.0], 44)],
        [0.88, pose([0, y1 + 2.15, -11.5], next.t, 34)],
        [1.00, next]
      ], q);
    }

    // Floors 2->3, 3->4, 4->5, 5->6 via Glass Elevator
    return pathValue([
      [0.00, prev],
      [0.14, pose([prev.p[0] * 0.4, y0 + 2.25, -9.5], [0, y0 + 1.95, -15.0], 43)],
      [0.26, pose([0, y0 + 2.15, -4.5], [0, y0 + 2.00, -11.0], 46)],
      [0.38, pose([0, y0 + 1.85, -0.45], [0, y0 + 1.80, -10.0], 48)],
      [0.64, pose([0, y1 + 1.85, -0.45], [0, y1 + 1.80, -10.0], 48)],
      [0.74, pose([0, y1 + 2.15, -4.5], [0, y1 + 2.00, -13.0], 45)],
      [0.86, pose([next.p[0] * 0.5, y1 + 2.20, -10.5], next.t, 36)],
      [0.94, pose([next.p[0] * 0.85, THREE.MathUtils.lerp(y1 + 2.18, next.p[1], 0.75), THREE.MathUtils.lerp(-10.5, next.p[2], 0.72)], next.t, 30)],
      [1.00, next]
    ], q);
  }

  // 9. Interactive Raycasting & Cursor Hover
  const routeRaycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let lookTarget = { x: 0, y: 0 };
  let look = { x: 0, y: 0 };

  function onPointer(e) {
    if (e.pointerType === 'touch') return;
    lookTarget.x = (e.clientX / innerWidth - 0.5) * 2;
    lookTarget.y = (e.clientY / innerHeight - 0.5) * 2;
  }
  function pointerLeave() {
    lookTarget.x = 0;
    lookTarget.y = 0;
  }
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerleave', pointerLeave, { passive: true });

  function surfaceHit(event) {
    const floor = Math.round(journey(scrollProgress) * 6);
    if (floor <= 0 || floor > 6 || Math.abs(journey(scrollProgress) * 6 - floor) > 0.12) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    routeRaycaster.setFromCamera(pointer, camera);
    return routeRaycaster.intersectObject(surfaces[floor - 1], false)[0] || null;
  }

  function onCanvasClick(e) {
    const hit = surfaceHit(e);
    if (!hit) return;
    const floor = hit.object.userData.stage;
    const route = routes[floor];
    if (route.external) {
      window.open(route.href, '_blank', 'noopener');
    } else {
      location.href = route.href;
    }
  }

  function onCanvasHover(e) {
    const hit = surfaceHit(e);
    canvas.style.cursor = hit ? 'pointer' : 'auto';
  }

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('pointermove', onCanvasHover, { passive: true });

  function resize() {
    const w = Math.max(1, canvas.clientWidth || innerWidth);
    const h = Math.max(1, canvas.clientHeight || innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 780 ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  // 10. Render Loop & Mathematical Contain Framing
  let progressTarget = 0;
  let progressRender = 0;
  let animation = 0;
  let disposed = false;
  let lastTime = 0;

  function render(time) {
    if (disposed) return;
    animation = requestAnimationFrame(render);
    if (window.__extPaused) { lastTime = 0; return; }
    const dt = lastTime ? Math.min(0.08, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;

    const rate = prefersReduced.matches ? 15 : 4.8;
    progressRender += (progressTarget - progressRender) * (1 - Math.exp(-dt * rate));
    if (Math.abs(progressRender - progressTarget) < 0.00002) progressRender = progressTarget;

    look.x += (lookTarget.x - look.x) * (1 - Math.exp(-dt * 3.8));
    look.y += (lookTarget.y - look.y) * (1 - Math.exp(-dt * 3.8));

    const curPose = cameraOnPath(progressRender);
    const ratio = Math.max(0.35, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    const traveled = progressRender * 6;
    const at = Math.round(traveled);
    const endK = smoother(clamp((traveled - 0.46) / 0.14));
    const eK = 1 - endK;
    const stageDelta = Math.abs(traveled - at);
    const focusStrength = at >= 1 && at <= 6 ? clamp((0.18 - stageDelta) / 0.12) : 0;

    camera.position.set(...curPose.p);
    const camTarget = new THREE.Vector3(...curPose.t);

    // Dynamic Fluid Responsive Camera Framing (Mobile Portrait & Narrow Viewports)
    const aspect = camera.aspect;
    const refAspect = 1.65;
    if (aspect < refAspect) {
      const narrowFactor = 1 + (Math.min(2.5, refAspect / aspect) - 1) * eK;
      // Smoothly push camera back so the wider furniture/screens fit within narrow mobile portrait
      const distScale = 1.0 + (narrowFactor - 1.0) * 0.44;
      const fovScale = 1.0 + (narrowFactor - 1.0) * 0.14;

      const viewDir = new THREE.Vector3().subVectors(camera.position, camTarget);
      camera.position.copy(camTarget).addScaledVector(viewDir, distScale);

      const stageProgress = progressRender * 6;
      if (stageProgress < 0.4) {
        // Stage 0 (Exterior): Pull back slightly and adjust angle to see towering skyscrapers and full dome
        camera.position.z += (narrowFactor - 1.0) * 10.0;
        camera.position.y += (narrowFactor - 1.0) * 1.5;
      } else if (Math.abs(stageProgress - 1) < 0.35) {
        // Stage 1 (ABOUT Desk Pad): Slightly higher perspective for comfortable reading angle
        camera.position.y += (narrowFactor - 1.0) * 0.16;
      } else if (Math.abs(stageProgress - 3) < 0.35) {
        // Stage 3 (LP): Horizontally center MacBook on narrow screens
        camera.position.x -= (narrowFactor - 1.0) * 0.14;
        camTarget.x -= (narrowFactor - 1.0) * 0.14;
      } else if (Math.abs(stageProgress - 4) < 0.35) {
        // Stage 4 (WEB): Horizontally center studio display on narrow screens
        camera.position.x += (narrowFactor - 1.0) * 0.18;
        camTarget.x += (narrowFactor - 1.0) * 0.18;
      } else if (Math.abs(stageProgress - 5) < 0.35) {
        // Stage 5 (DIRECTION): Horizontally center catalog table spread
        camera.position.x -= (narrowFactor - 1.0) * 0.22;
        camTarget.x -= (narrowFactor - 1.0) * 0.22;
      }

      curPose.f = Math.min(62, curPose.f * fovScale);
    }

    // Subtle pointer parallax and organic handheld breathing motion
    const breathX = Math.sin(time * 0.0008) * 0.02 * eK;
    const breathY = Math.cos(time * 0.0011) * 0.012 * eK;
    camera.position.x += look.x * 0.16 * eK + breathX;
    camera.position.y -= look.y * 0.08 * eK + breathY;
    camTarget.x += look.x * 0.35 * eK + breathX * 0.5;
    camTarget.y -= look.y * 0.12 * eK + breathY * 0.5;

    camera.lookAt(camTarget);
    camera.fov = curPose.f;
    camera.updateProjectionMatrix();
    if (window.__lobbyMatte) {                       // 'cover' the frustum at the end pose (same crop rule as the DOM canvas)
      const m = window.__lobbyMatte, PA = m.userData.aspect, D = 4.0;
      const vh = 2 * D * Math.tan(THREE.MathUtils.degToRad(42) / 2), vw = vh * camera.aspect, Hp = Math.max(vh, vw / PA);
      m.scale.set(Hp * PA, Hp, 1); m.position.set(0, 2.52, 35.2);
      const onTop = endK > 0.985;                    // at the end pose nothing may stand in front of the still
      if (m.material.depthTest === onTop) { m.material.depthTest = !onTop; m.material.needsUpdate = true; }
      m.renderOrder = onTop ? 1000 : 0;
    }

    updateLift(progressRender);
    updateEntrance(progressRender);

    // Harmonious Nighttime Architectural Lighting with rich environmental specular sheen
    const insideFactor = clamp((traveled - 0.25) / 0.45);
    // Constant night grading from the first frame (no sudden change on approach)
    sun.intensity = 0.55;
    hemi.intensity = 0.30;
    renderer.toneMappingExposure = 0.92;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.20;
    nightLamps.forEach(l => { l.intensity = l.userData.base * (0.94 + 0.06 * Math.sin(time * 0.0017 + l.userData.ph)); });

    // Dedicated Gallery Spotlights with Physical Specular Highlights (NO FAKE BEAMS)
    gallerySpotlights.forEach((spot, idx) => {
      const floorIdx = idx + 1;
      const dist = Math.abs(traveled - floorIdx);
      const factor = clamp((0.55 - dist) / 0.35);
      spot.intensity = spot.userData.baseIntensity * factor;
    });

    // Outer dome shell clears smoothly when passing into the vestibule
    const delta = clamp((progressRender * 6 - 0.28) / 0.28);
    for (const m of outerDomeShell) {
      m.opacity = 0.85 * (1 - delta) + 0.04 * delta;
      m.depthWrite = delta < 0.15;
    }
    for (const m of innerFacade) {
      m.opacity = 0.82 * (1 - delta) + 0.06 * delta;
      m.depthWrite = delta < 0.15;
    }

    // Portal frames highlight on active floor
    surfaces.forEach((m, idx) => {
      m.visible = true;
      if (surfaceFrames[idx]) {
        const d = Math.abs(traveled - (idx + 1));
        surfaceFrames[idx].material.opacity = clamp((0.22 - d) / 0.12) * 0.45;
      }
    });

    // Automatic slide deck switching when viewing Floor 2 (PRESENTATION)
    if (presSlideTextures.length > 1 && at === 2 && Math.abs(traveled - 2) < 0.22) {
      if (time - lastSlideChange > 4200) {
        lastSlideChange = time;
        presSlideIdx = (presSlideIdx + 1) % presSlideTextures.length;
        const nextTex = presSlideTextures[presSlideIdx];
        if (surfaces[1]?.material) {
          surfaces[1].material.map = nextTex;
          surfaces[1].material.emissiveMap = nextTex;
          surfaces[1].material.needsUpdate = true;
        }
      }
    }

    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  animation = requestAnimationFrame(render);
  window.__dbg = { scene, camera, renderer, surfaces };
  window.Exterior = { snap: v => { window.__extU = v; progressTarget = progressRender = clamp(v); }, setProgress: v => { window.__extU = v; progressTarget = clamp(v); }, rendered: () => progressRender };

  return {
    setProgress(v) {
      progressTarget = clamp(v);
    },
    rendered() { return progressRender; },
    snap(v) { progressTarget = progressRender = clamp(v); },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(animation);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('pointermove', onCanvasHover);
      removeEventListener('pointermove', onPointer);
      removeEventListener('pointerleave', pointerLeave);
      removeEventListener('resize', resize);
      surfaces.forEach(m => {
        m.geometry.dispose();
        m.material.map?.dispose();
        m.material.dispose();
      });
      surfaceFrames.forEach(f => {
        f.geometry.dispose();
        f.material.dispose();
      });
      models.forEach(m => m.traverse(n => {
        n.geometry?.dispose();
        if (n.material) {
          (Array.isArray(n.material) ? n.material : [n.material]).forEach(mat => mat.dispose());
        }
      }));
      entrance.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      decor.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      lift.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      Object.values(pbrSets).forEach(set => {
        if (!set) return;
        set.diff?.dispose();
        set.nor?.dispose();
        set.rough?.dispose();
      });
      envMapTexture?.dispose();
      pmrem.dispose();
      renderer.dispose();
    }
  };
}

void boot();
