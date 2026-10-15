import * as THREE from 'three';

/**
 * Cultural & Architectural Curated 3D Assets Module
 * Populates each floor of TESHIMA LAB with bespoke cultural, design, and audio artifacts:
 * 1. サッカースタジアム (Soccer stadium scale model)
 * 2. オリベッティのタイプライターのある書斎 (Olivetti Valentine typewriter study)
 * 3. アシックスのスニーカー (Asics sneakers in acrylic display case)
 * 4. KOSS portaproヘッドホン (KOSS Porta Pro headphones on stand)
 * 5. ロッキー（旧車）(Daihatsu Rocky 4WD classic vehicle)
 * 6. タバコとライター (Vintage cigarette pack & Zippo lighter)
 * 7. ボンダイブルーの古いimac (1998 Apple iMac G3 Bondi Blue)
 * 8. ライブ会場 (Live concert arena stage diorama)
 * 9. 映画館 (Cinema private screening zone with velvet seats & projector)
 * 10. ノースフェイスのヌプシダウンジャケット (The North Face Nuptse jacket on valet stand)
 * 11. 喫茶店 (Retro Japanese kissaten coffee counter with siphon)
 * 12. sexpistolsのボンデージパンツ (Sex Pistols Seditionaries bondage pants on mannequin)
 * 13. 鉄腕アトム (Astro Boy bronze art statue on museum plinth)
 * Along with realistic botanical plants and 1F reception desk with receptionist chair.
 */

export function initCulturalAssets({
  decor,
  rBox,
  matAluminium,
  matWalnut,
  matCharcoal,
  matBrass,
  matLeather,
  matStone,
  createEamesChair
}) {
  // Shared High-End Materials
  const matGlassPhysical = new THREE.MeshPhysicalMaterial({
    color: 0x82a89c,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.52,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 2.2
  });

  const matVelvetRed = new THREE.MeshStandardMaterial({
    color: 0x8a161f,
    roughness: 0.88,
    metalness: 0.05
  });

  const matBondiBlue = new THREE.MeshPhysicalMaterial({
    color: 0x008080,
    metalness: 0.15,
    roughness: 0.14,
    transmission: 0.65,
    transparent: true,
    opacity: 0.92,
    ior: 1.48,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.5
  });

  const matRedTypewriter = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.25,
    metalness: 0.1
  });

  const matTartanPlaid = new THREE.MeshStandardMaterial({
    color: 0xa82424,
    roughness: 0.78,
    metalness: 0.0
  });

  const matNuptseYellow = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    roughness: 0.42,
    metalness: 0.05
  });

  const matGrassTurf = new THREE.MeshStandardMaterial({
    color: 0x2e6f34,
    roughness: 0.85,
    metalness: 0.0
  });

  const matAsicsSneaker = new THREE.MeshStandardMaterial({
    color: 0xf0f2f5,
    roughness: 0.35,
    metalness: 0.1
  });

  const matSneakerBlue = new THREE.MeshStandardMaterial({
    color: 0x1a458f,
    roughness: 0.4,
    metalness: 0.1
  });

  const matAstroBronze = new THREE.MeshStandardMaterial({
    color: 0x3d352e,
    roughness: 0.32,
    metalness: 0.85,
    envMapIntensity: 2.4
  });

  const matPlantLeaf = new THREE.MeshPhysicalMaterial({
    color: 0x1f3c25,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
    transmission: 0.10,
    side: THREE.DoubleSide,
    envMapIntensity: 1.8
  });

  const matCeramicPot = new THREE.MeshStandardMaterial({
    color: 0xd8d4cb,
    roughness: 0.82,
    metalness: 0.05
  });

  // Sculpted curved botanical leaf geometry generator
  function createSculptedLeafGeo(w, len, curl) {
    const geo = new THREE.PlaneGeometry(w, len, 6, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const normY = (vy + len / 2) / len;
      const widthFactor = Math.sin(normY * Math.PI);
      pos.setX(i, vx * (0.3 + 0.7 * widthFactor));
      const zCurv = -Math.sin(normY * Math.PI * 0.8) * curl - Math.abs(vx) * 0.25;
      pos.setZ(i, zCurv);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Realistic Architectural Plant (Monstera / Ficus)
  function createRealisticArchitecturalPlant(x, y, z, scale = 1) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, y, z);
    plantGroup.scale.setScalar(scale);
    decor.add(plantGroup);

    // Fluted ceramic pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.24, 0.72, 28), matCeramicPot);
    pot.position.y = 0.36;
    plantGroup.add(pot);

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24), matCharcoal);
    soil.position.y = 0.69;
    plantGroup.add(soil);

    // Multi-layered organic drooping leaves
    const leafConfigs = [
      { ang: 0.1, stemH: 0.95, w: 0.32, len: 0.52, curl: 0.18, tilt: 0.65 },
      { ang: 0.8, stemH: 1.15, w: 0.36, len: 0.58, curl: 0.22, tilt: 0.55 },
      { ang: 1.5, stemH: 0.85, w: 0.30, len: 0.48, curl: 0.16, tilt: 0.70 },
      { ang: 2.2, stemH: 1.25, w: 0.38, len: 0.62, curl: 0.24, tilt: 0.50 },
      { ang: 2.9, stemH: 0.90, w: 0.34, len: 0.54, curl: 0.19, tilt: 0.62 },
      { ang: 3.6, stemH: 1.10, w: 0.35, len: 0.56, curl: 0.21, tilt: 0.58 },
      { ang: 4.3, stemH: 0.80, w: 0.28, len: 0.46, curl: 0.15, tilt: 0.72 },
      { ang: 5.0, stemH: 1.20, w: 0.37, len: 0.60, curl: 0.23, tilt: 0.52 },
      { ang: 5.7, stemH: 1.00, w: 0.33, len: 0.52, curl: 0.18, tilt: 0.64 }
    ];

    leafConfigs.forEach(cfg => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, cfg.stemH, 8), matPlantLeaf);
      stem.position.set(Math.cos(cfg.ang) * 0.10, 0.70 + cfg.stemH / 2, Math.sin(cfg.ang) * 0.10);
      stem.rotation.z = Math.sin(cfg.ang) * 0.28;
      stem.rotation.x = Math.cos(cfg.ang) * 0.28;
      plantGroup.add(stem);

      const leafGeo = createSculptedLeafGeo(cfg.w, cfg.len, cfg.curl);
      const leaf = new THREE.Mesh(leafGeo, matPlantLeaf);
      leaf.position.set(Math.cos(cfg.ang) * 0.26, 0.70 + cfg.stemH + cfg.len * 0.25, Math.sin(cfg.ang) * 0.26);
      leaf.rotation.y = -cfg.ang;
      leaf.rotation.x = cfg.tilt;
      plantGroup.add(leaf);
    });

    return plantGroup;
  }

  // --- 1F ASSETS ---

  // 1F Reception Counter Desk & Forward-Facing Receptionist Chair
  function create1FReceptionDesk() {
    const rGroup = new THREE.Group();
    rGroup.position.set(0, 0.65, 34.0);
    decor.add(rGroup);

    // Architectural walnut reception counter body with soft rounded edges
    const rBody = new THREE.Mesh(rBox(2.80, 0.88, 0.85, 0.045, 8), matWalnut);
    rBody.position.set(0, 0.44, 0);
    rGroup.add(rBody);

    // Honed white marble counter top with smooth rounded edge profile
    const rTop = new THREE.Mesh(rBox(2.86, 0.06, 0.90, 0.032, 8), matStone);
    rTop.position.set(0, 0.905, 0);
    rGroup.add(rTop);

    // Architectural brass plinth base
    const rPlinth = new THREE.Mesh(rBox(2.70, 0.05, 0.75, 0.025, 6), matBrass);
    rPlinth.position.set(0, 0.025, 0);
    rGroup.add(rPlinth);

    // Reception check-in tablet terminal (far left counter)
    const rTabletStand = new THREE.Mesh(rBox(0.08, 0.16, 0.06, 0.012, 6), matAluminium);
    rTabletStand.position.set(-1.05, 0.99, -0.05);
    rGroup.add(rTabletStand);

    const rTablet = new THREE.Mesh(rBox(0.32, 0.22, 0.012, 0.008, 6), matCharcoal);
    rTablet.position.set(-1.05, 1.12, -0.03);
    rTablet.rotation.x = -0.32;
    rGroup.add(rTablet);

    // Reception Desk Leather Pad with Brass Corner Protectors (ABOUT)
    const bookCover = new THREE.Mesh(rBox(0.88, 0.025, 0.67, 0.018, 6), matLeather);
    bookCover.position.set(0.15, 0.942, 0.02);
    bookCover.rotation.x = -0.06;
    rGroup.add(bookCover);

    // Brass corner protectors on the leather desk pad
    const cornerOffsets = [
      [-0.405, 0.30], [0.405, 0.30],
      [-0.405, -0.30], [0.405, -0.30]
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const corner = new THREE.Mesh(rBox(0.065, 0.028, 0.065, 0.008, 4), matBrass);
      corner.position.set(0.15 + cx, 0.945, 0.02 + cz);
      corner.rotation.x = -0.06;
      rGroup.add(corner);
    });

    // Receptionist Executive High-Back Chair behind desk, FACING FORWARD (+Z towards entering visitor!)
    // Raised to prominent executive height so walnut headrest and leather cushion rise visibly above the counter
    const chair = createEamesChair(-0.45, 0.78, 33.15, 0);
    // Add tall executive headrest extension to make the forward orientation unmistakable
    const headrestShell = new THREE.Mesh(rBox(0.48, 0.28, 0.04, 0.015), matWalnut);
    headrestShell.position.set(0, 1.26, -0.32);
    headrestShell.rotation.x = -0.16;
    chair.add(headrestShell);
    const headrestPad = new THREE.Mesh(rBox(0.44, 0.24, 0.07, 0.02), matLeather);
    headrestPad.position.set(0, 1.26, -0.28);
    headrestPad.rotation.x = -0.16;
    chair.add(headrestPad);
  }

  // Asset 5: ロッキー（旧車）(Daihatsu Rocky classic 1990s 4x4 compact vehicle)
  function createVintageRockyCar(x, y, z, ry = 0) {
    const car = new THREE.Group();
    car.position.set(x, y, z);
    car.rotation.y = ry;
    decor.add(car);

    // Terrazzo exhibition platform
    const platform = new THREE.Mesh(rBox(3.4, 0.10, 1.9, 0.03), matStone);
    platform.position.y = 0.05;
    car.add(platform);

    // Car Body - Dark metallic blue & silver two-tone
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e3650,
      metalness: 0.85,
      roughness: 0.20,
      envMapIntensity: 2.5
    });

    // Lower chassis & rocker panels
    const rocker = new THREE.Mesh(rBox(2.50, 0.22, 1.28, 0.02), matAluminium);
    rocker.position.set(0, 0.28, 0);
    car.add(rocker);

    // Main cab lower
    const mainBody = new THREE.Mesh(rBox(2.46, 0.44, 1.26, 0.03), bodyMat);
    mainBody.position.set(0, 0.58, 0);
    car.add(mainBody);

    // Greenhouse / Cab roof & pillars
    const cabin = new THREE.Mesh(rBox(1.55, 0.48, 1.18, 0.02), bodyMat);
    cabin.position.set(-0.25, 1.02, 0);
    car.add(cabin);

    // Tinted windshield & side windows
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.44), matGlassPhysical);
    windshield.position.set(0.53, 1.02, 0);
    windshield.rotation.y = Math.PI / 2;
    windshield.rotation.x = -0.32;
    car.add(windshield);

    // Front chrome bullbar & grille
    const grille = new THREE.Mesh(rBox(0.08, 0.24, 0.90, 0.01), matCharcoal);
    grille.position.set(1.26, 0.58, 0);
    car.add(grille);

    // Round classic headlights
    for (const hz of [-0.38, 0.38]) {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), matAluminium);
      hl.rotation.z = Math.PI / 2;
      hl.position.set(1.27, 0.58, hz);
      car.add(hl);
      const hlLens = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }));
      hlLens.rotation.y = Math.PI / 2;
      hlLens.position.set(1.291, 0.58, hz);
      car.add(hlLens);
    }

    // 4 Heavy-tread off-road tires
    const tireGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 20);
    const rimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.19, 16);
    const wheelPositions = [
      [0.78, 0.24, -0.62],
      [0.78, 0.24, 0.62],
      [-0.78, 0.24, -0.62],
      [-0.78, 0.24, 0.62]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const tire = new THREE.Mesh(tireGeo, matCharcoal);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(wx, wy, wz);
      car.add(tire);
      const rim = new THREE.Mesh(rimGeo, matAluminium);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      car.add(rim);
    });

    // Rear tailgate mounted spare tire
    const spare = new THREE.Mesh(tireGeo, matCharcoal);
    spare.rotation.z = Math.PI / 2;
    spare.position.set(-1.32, 0.62, 0);
    car.add(spare);

    // Roof rack rails
    for (const rz of [-0.48, 0.48]) {
      const rail = new THREE.Mesh(rBox(1.45, 0.03, 0.03, 0.005), matCharcoal);
      rail.position.set(-0.25, 1.30, rz);
      car.add(rail);
    }
    return car;
  }

  // Asset 13: 鉄腕アトム (Astro Boy bronze art statue on museum plinth)
  function createAstroBoyStatue(x, y, z, ry = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;
    decor.add(group);

    // Dark stone museum pedestal
    const plinth = new THREE.Mesh(rBox(0.85, 0.90, 0.85, 0.02), matCharcoal);
    plinth.position.y = 0.45;
    group.add(plinth);

    // Brass engraved plaque
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), matBrass);
    plaque.position.set(0, 0.58, 0.43);
    group.add(plaque);

    const astro = new THREE.Group();
    astro.position.y = 0.90;
    group.add(astro);

    // Red rocket boots
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xaa1e1e, roughness: 0.25, metalness: 0.1 });
    for (const bx of [-0.10, 0.10]) {
      const boot = new THREE.Mesh(rBox(0.11, 0.28, 0.16, 0.02), bootMat);
      boot.position.set(bx, 0.14, 0.02);
      astro.add(boot);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16), matAstroBronze);
      leg.position.set(bx, 0.38, 0);
      astro.add(leg);
    }

    // Green belt with buckle
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x228833, roughness: 0.3 });
    const belt = new THREE.Mesh(rBox(0.28, 0.07, 0.18, 0.01), beltMat);
    belt.position.set(0, 0.52, 0);
    astro.add(belt);

    // Torso / chest
    const torso = new THREE.Mesh(rBox(0.26, 0.34, 0.16, 0.02), matAstroBronze);
    torso.position.set(0, 0.70, 0);
    astro.add(torso);

    // Head with signature horns
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), matAstroBronze);
    head.position.set(0, 0.98, 0);
    astro.add(head);

    // Pointed hair horns
    for (const [hx, hz, rotZ] of [[-0.09, -0.04, 0.45], [0.10, 0.02, -0.42]]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.20, 16), matAstroBronze);
      horn.rotation.z = rotZ;
      horn.position.set(hx, 1.10, hz);
      astro.add(horn);
    }
    return group;
  }

  // Asset 11: 喫茶店 (Retro Japanese kissaten coffee counter with siphon)
  function createKissatenCorner(x, y, z, ry = 0) {
    const kGroup = new THREE.Group();
    kGroup.position.set(x, y, z);
    kGroup.rotation.y = ry;
    decor.add(kGroup);

    // Mahogany counter bar
    const bar = new THREE.Mesh(rBox(2.40, 1.00, 0.75, 0.02), matWalnut);
    bar.position.set(0, 0.50, 0);
    kGroup.add(bar);

    // Brass foot rail
    const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.30, 12), matBrass);
    footRail.rotation.z = Math.PI / 2;
    footRail.position.set(0, 0.15, 0.44);
    kGroup.add(footRail);

    // Glass Siphon Coffee Maker on counter
    const siphon = new THREE.Group();
    siphon.position.set(-0.55, 1.02, 0.05);
    kGroup.add(siphon);

    const sStand = new THREE.Mesh(rBox(0.14, 0.38, 0.14, 0.01), matBrass);
    sStand.position.set(0, 0.19, -0.05);
    siphon.add(sStand);

    const lowerBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), matGlassPhysical);
    lowerBulb.position.set(0, 0.12, 0);
    siphon.add(lowerBulb);

    const upperFunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.20, 16), matGlassPhysical);
    upperFunnel.position.set(0, 0.28, 0);
    siphon.add(upperFunnel);

    // Glowing warm amber spirit burner flame
    const burner = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff9922 }));
    burner.position.set(0, 0.025, 0);
    siphon.add(burner);

    // White ceramic coffee cup and saucer
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.012, 16), matCeramicPot);
    saucer.position.set(0.40, 1.01, 0.08);
    kGroup.add(saucer);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.065, 16), matCeramicPot);
    cup.position.set(0.40, 1.05, 0.08);
    kGroup.add(cup);

    // Swivel barstool
    const stool = new THREE.Mesh(rBox(0.38, 0.07, 0.38, 0.02), matLeather);
    stool.position.set(0, 0.72, 0.85);
    kGroup.add(stool);
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.70, 12), matBrass);
    stoolLeg.position.set(0, 0.35, 0.85);
    kGroup.add(stoolLeg);

    return kGroup;
  }

  // --- 2F ASSETS ---

  // Asset 8: ライブ会場 (Live concert arena stage diorama)
  function createConcertStageDiorama(x, y, z, ry = 0) {
    const stage = new THREE.Group();
    stage.position.set(x, y, z);
    stage.rotation.y = ry;
    decor.add(stage);

    // Plinth table
    const table = new THREE.Mesh(rBox(2.80, 0.65, 1.60, 0.02), matWalnut);
    table.position.y = 0.325;
    stage.add(table);

    // Stage deck with black tape
    const deck = new THREE.Mesh(rBox(2.60, 0.12, 1.40, 0.01), matCharcoal);
    deck.position.y = 0.71;
    stage.add(deck);

    // Four aluminium box-truss pillars
    for (const tx of [-1.15, 1.15]) {
      for (const tz of [-0.55, 0.55]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.10, 8), matAluminium);
        pillar.position.set(tx, 1.30, tz);
        stage.add(pillar);
      }
    }
    // Overhead truss beam
    const trussBeam = new THREE.Mesh(rBox(2.40, 0.08, 1.20, 0.01), matAluminium);
    trussBeam.position.set(0, 1.88, 0);
    stage.add(trussBeam);

    // Colored stage spotlights
    const spotColors = [0xff0077, 0x00e5ff, 0xffbb00, 0x8800ff];
    spotColors.forEach((col, idx) => {
      const spot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 12), new THREE.MeshBasicMaterial({ color: col }));
      spot.rotation.x = Math.PI * 0.75;
      spot.position.set(-0.75 + idx * 0.50, 1.82, 0.35);
      stage.add(spot);
    });

    // Marshall amplifier half-stacks on stage rear
    for (const ax of [-0.75, 0.75]) {
      const amp = new THREE.Mesh(rBox(0.42, 0.48, 0.26, 0.01), matCharcoal);
      amp.position.set(ax, 1.01, -0.42);
      stage.add(amp);
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.05), matBrass);
      logo.position.set(ax, 1.16, -0.285);
      stage.add(logo);
    }
    return stage;
  }

  // Asset 9: 映画館 (Cinema private screening zone with velvet seats & projector)
  function createCinemaTheaterZone(x, y, z, ry = 0) {
    const cinema = new THREE.Group();
    cinema.position.set(x, y, z);
    cinema.rotation.y = ry;
    decor.add(cinema);

    // Tiered platform with step lighting
    const platform = new THREE.Mesh(rBox(2.60, 0.18, 1.60, 0.02), matCharcoal);
    platform.position.y = 0.09;
    cinema.add(platform);

    // Two plush crimson red velvet cinema seats
    for (const sx of [-0.55, 0.55]) {
      const seat = new THREE.Group();
      seat.position.set(sx, 0.18, 0);
      cinema.add(seat);

      // Velvet cushion base
      const sBase = new THREE.Mesh(rBox(0.58, 0.18, 0.56, 0.03), matVelvetRed);
      sBase.position.set(0, 0.30, 0.05);
      seat.add(sBase);

      // Velvet backrest with headrest
      const sBack = new THREE.Mesh(rBox(0.58, 0.65, 0.14, 0.03), matVelvetRed);
      sBack.position.set(0, 0.65, -0.22);
      sBack.rotation.x = -0.12;
      seat.add(sBack);

      // Armrests with cup holders
      for (const ax of [-0.34, 0.34]) {
        const arm = new THREE.Mesh(rBox(0.10, 0.32, 0.52, 0.02), matCharcoal);
        arm.position.set(ax, 0.42, 0);
        seat.add(arm);
        const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 12), matAluminium);
        holder.position.set(ax, 0.58, 0.18);
        seat.add(holder);
      }
    }

    // Vintage 35mm film reel projector at rear
    const proj = new THREE.Group();
    proj.position.set(0, 0.18, 0.65);
    cinema.add(proj);

    const pStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.95, 12), matBrass);
    pStand.position.y = 0.475;
    proj.add(pStand);

    const pBody = new THREE.Mesh(rBox(0.35, 0.28, 0.42, 0.01), matCharcoal);
    pBody.position.y = 1.05;
    proj.add(pBody);

    // Dual spinning film reels
    for (const [rx, ryPos] of [[-0.12, 1.30], [0.12, 1.30]]) {
      const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), matAluminium);
      reel.rotation.x = Math.PI / 2;
      reel.position.set(rx, ryPos, 0);
      proj.add(reel);
    }
    return cinema;
  }

  // --- 3F ASSETS ---

  // Asset 7: ボンダイブルーの古いimac (1998 Apple iMac G3 Bondi Blue)
  function createBondiBlueIMac(x, y, z, ry = 0) {
    const imacGroup = new THREE.Group();
    imacGroup.position.set(x, y, z);
    imacGroup.rotation.y = ry;
    decor.add(imacGroup);

    // Side creative credenza
    const credenza = new THREE.Mesh(rBox(1.50, 0.65, 0.85, 0.02), matWalnut);
    credenza.position.y = 0.325;
    imacGroup.add(credenza);

    const imac = new THREE.Group();
    imac.position.set(0, 0.65, 0);
    imacGroup.add(imac);

    // Translucent Bondi Blue curved rear shell
    const rearShell = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.7), matBondiBlue);
    rearShell.rotation.x = Math.PI * 0.45;
    rearShell.position.set(0, 0.28, -0.06);
    imac.add(rearShell);

    // Ice-white front curved bezel
    const frontBezel = new THREE.Mesh(rBox(0.44, 0.38, 0.12, 0.03), matCeramicPot);
    frontBezel.position.set(0, 0.28, 0.12);
    imac.add(frontBezel);

    // CRT monitor curved screen face with faint phosphor glow
    const crtScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.27), new THREE.MeshBasicMaterial({ color: 0x88ccdd }));
    crtScreen.position.set(0, 0.28, 0.185);
    imac.add(crtScreen);

    // Circular translucent Bondi Blue "puck" mouse
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 20), matBondiBlue);
    puck.position.set(0.32, 0.015, 0.26);
    imac.add(puck);

    // Bondi Blue keyboard
    const kb = new THREE.Mesh(rBox(0.38, 0.016, 0.14, 0.005), matBondiBlue);
    kb.position.set(0, 0.01, 0.26);
    imac.add(kb);

    return imacGroup;
  }

  // Asset 4: KOSS portaproヘッドホン (KOSS Porta Pro headphones on stand)
  function createKossPortaPro(x, y, z, ry = 0) {
    const koss = new THREE.Group();
    koss.position.set(x, y, z);
    koss.rotation.y = ry;
    decor.add(koss);

    // Sculptural aluminium headphone stand
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.015, 20), matAluminium);
    standBase.position.y = 0.01;
    koss.add(standBase);

    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 16), matAluminium);
    standPole.position.y = 0.18;
    koss.add(standPole);

    const standHook = new THREE.Mesh(rBox(0.09, 0.015, 0.06, 0.005), matAluminium);
    standHook.position.set(0, 0.34, 0);
    koss.add(standHook);

    // Dual thin spring-steel headband
    for (const bz of [-0.012, 0.012]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.004, 8, 24, Math.PI), matAluminium);
      band.rotation.z = Math.PI;
      band.position.set(0, 0.26, bz);
      koss.add(band);
    }

    // Blue temporal comfort pads & circular earcups with black foam
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 });
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(rBox(0.02, 0.03, 0.04, 0.005), blueMat);
      pad.position.set(side * 0.095, 0.31, 0);
      koss.add(pad);

      const earcup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.02, 20), matCharcoal);
      earcup.rotation.z = Math.PI / 2;
      earcup.position.set(side * 0.105, 0.22, 0);
      koss.add(earcup);
    }
    return koss;
  }

  // Asset 6: タバコとライター (Vintage cigarette pack & Zippo lighter)
  function createCigaretteAndZippoLighter(x, y, z, ry = 0) {
    const cigGroup = new THREE.Group();
    cigGroup.position.set(x, y, z);
    cigGroup.rotation.y = ry;
    decor.add(cigGroup);

    // Red-and-white cigarette soft pack
    const packMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const pack = new THREE.Mesh(rBox(0.08, 0.12, 0.04, 0.004), packMat);
    pack.position.set(0, 0.02, 0);
    pack.rotation.x = -Math.PI / 2;
    cigGroup.add(pack);

    // Brushed chrome Zippo flip-top lighter (open lid)
    const zippoBody = new THREE.Mesh(rBox(0.045, 0.065, 0.018, 0.003), matAluminium);
    zippoBody.position.set(0.12, 0.032, 0);
    cigGroup.add(zippoBody);

    const zippoLid = new THREE.Mesh(rBox(0.045, 0.03, 0.018, 0.003), matAluminium);
    zippoLid.rotation.z = 0.85;
    zippoLid.position.set(0.155, 0.075, 0);
    cigGroup.add(zippoLid);

    // Crystal glass ashtray
    const ashtray = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.035, 16), matGlassPhysical);
    ashtray.position.set(-0.14, 0.018, 0);
    cigGroup.add(ashtray);

    return cigGroup;
  }

  // --- 4F ASSETS ---

  // Asset 1: サッカースタジアム (Soccer stadium architectural model)
  function createSoccerStadiumModel(x, y, z, ry = 0) {
    const stadium = new THREE.Group();
    stadium.position.set(x, y, z);
    stadium.rotation.y = ry;
    decor.add(stadium);

    // Exhibition walnut plinth
    const plinth = new THREE.Mesh(rBox(2.20, 0.70, 1.60, 0.02), matWalnut);
    plinth.position.y = 0.35;
    stadium.add(plinth);

    const modelBase = new THREE.Group();
    modelBase.position.y = 0.70;
    stadium.add(modelBase);

    // Elliptical stadium seating bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.28, 32), matAluminium);
    bowl.scale.set(1.25, 1.0, 0.95);
    bowl.position.y = 0.14;
    modelBase.add(bowl);

    // Lush green soccer pitch
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(1.20, 0.78), matGrassTurf);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.282;
    modelBase.add(pitch);

    // Goal posts
    for (const gx of [-0.52, 0.52]) {
      const goal = new THREE.Mesh(rBox(0.01, 0.05, 0.16, 0.002), matCeramicPot);
      goal.position.set(gx, 0.31, 0);
      modelBase.add(goal);
    }

    // Curved stadium tensile canopy roof
    const roof = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.09, 12, 32), matCeramicPot);
    roof.rotation.x = Math.PI / 2;
    roof.scale.set(1.25, 0.95, 1.0);
    roof.position.y = 0.34;
    modelBase.add(roof);

    // 4 Corner floodlight towers
    const lightPositions = [[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]];
    lightPositions.forEach(([lx, lz]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.42, 8), matAluminium);
      mast.position.set(lx, 0.35, lz);
      modelBase.add(mast);
      const bank = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      bank.position.set(lx, 0.57, lz);
      modelBase.add(bank);
    });

    return stadium;
  }

  // Asset 3: アシックスのスニーカー (Asics sneakers in acrylic display case)
  function createAsicsSneakersCase(x, y, z, ry = 0) {
    const sneakerGroup = new THREE.Group();
    sneakerGroup.position.set(x, y, z);
    sneakerGroup.rotation.y = ry;
    decor.add(sneakerGroup);

    // Display plinth
    const plinth = new THREE.Mesh(rBox(1.10, 0.72, 0.75, 0.02), matCharcoal);
    plinth.position.y = 0.36;
    sneakerGroup.add(plinth);

    // Acrylic display case
    const caseGlass = new THREE.Mesh(rBox(0.95, 0.52, 0.60, 0.01), matGlassPhysical);
    caseGlass.position.y = 0.98;
    sneakerGroup.add(caseGlass);

    // LED illuminated underlight base
    const ledBase = new THREE.Mesh(rBox(0.92, 0.02, 0.58, 0.005), new THREE.MeshBasicMaterial({ color: 0xddf4ff }));
    ledBase.position.y = 0.73;
    sneakerGroup.add(ledBase);

    // Asics GEL Sneaker model
    const shoe = new THREE.Group();
    shoe.position.set(0, 0.75, 0);
    sneakerGroup.add(shoe);

    // Sculpted midsole with GEL windows
    const sole = new THREE.Mesh(rBox(0.52, 0.08, 0.22, 0.015), matAsicsSneaker);
    sole.position.y = 0.04;
    shoe.add(sole);

    // Upper mesh body
    const upper = new THREE.Mesh(rBox(0.48, 0.16, 0.20, 0.03), matAsicsSneaker);
    upper.position.set(-0.02, 0.15, 0);
    shoe.add(upper);

    // Iconic crossed tiger stripes
    const stripe1 = new THREE.Mesh(rBox(0.24, 0.03, 0.21, 0.005), matSneakerBlue);
    stripe1.rotation.y = 0.18;
    stripe1.position.set(0, 0.14, 0);
    shoe.add(stripe1);
    const stripe2 = new THREE.Mesh(rBox(0.18, 0.03, 0.21, 0.005), matSneakerBlue);
    stripe2.rotation.y = -0.22;
    stripe2.position.set(0.04, 0.16, 0);
    shoe.add(stripe2);

    return sneakerGroup;
  }

  // --- 5F ASSETS ---

  // Asset 2: オリベッティのタイプライターのある書斎 (Olivetti Valentine typewriter study)
  function createOlivettiTypewriterStudy(x, y, z, ry = 0) {
    const study = new THREE.Group();
    study.position.set(x, y, z);
    study.rotation.y = ry;
    decor.add(study);

    // Tall walnut bookcase
    const bookcase = new THREE.Mesh(rBox(1.60, 2.80, 0.45, 0.02), matWalnut);
    bookcase.position.set(0, 1.40, -0.65);
    study.add(bookcase);

    // Shelf books
    const bookColors = [0x992222, 0x224488, 0x226633, 0xcc8822, 0x111111];
    for (let shelf = 0; shelf < 4; shelf++) {
      for (let b = 0; b < 10; b++) {
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[b % bookColors.length], roughness: 0.6 });
        const book = new THREE.Mesh(rBox(0.06, 0.32 + (b % 3) * 0.04, 0.28, 0.005), bMat);
        book.position.set(-0.62 + b * 0.13, 0.45 + shelf * 0.65, -0.62);
        study.add(book);
      }
    }

    // Writing desk
    const desk = new THREE.Mesh(rBox(1.50, 0.08, 0.85, 0.02), matWalnut);
    desk.position.set(0, 0.70, 0);
    study.add(desk);
    for (const dx of [-0.65, 0.65]) {
      const leg = new THREE.Mesh(rBox(0.06, 0.70, 0.70, 0.01), matCharcoal);
      leg.position.set(dx, 0.35, 0);
      study.add(leg);
    }

    // Iconic Ettore Sottsass Olivetti Valentine Typewriter (Cherry Red)
    const valentine = new THREE.Group();
    valentine.position.set(0, 0.74, 0.05);
    study.add(valentine);

    const vChassis = new THREE.Mesh(rBox(0.42, 0.11, 0.38, 0.02), matRedTypewriter);
    vChassis.position.y = 0.055;
    valentine.add(vChassis);

    // Black circular keys row
    const keys = new THREE.Mesh(rBox(0.32, 0.02, 0.14, 0.005), matCharcoal);
    keys.position.set(0, 0.09, 0.08);
    valentine.add(keys);

    // Yellow/orange ribbon spool caps
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3 });
    for (const cx of [-0.12, 0.12]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 16), capMat);
      cap.position.set(cx, 0.115, -0.06);
      valentine.add(cap);
    }

    // White paper feed roll with manuscript
    const paperRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 16), matCharcoal);
    paperRoll.rotation.z = Math.PI / 2;
    paperRoll.position.set(0, 0.13, -0.11);
    valentine.add(paperRoll);
    const paperSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.22), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    paperSheet.rotation.x = -0.35;
    paperSheet.position.set(0, 0.22, -0.14);
    valentine.add(paperSheet);

    // Brass Banker's Lamp
    const bLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 12), matBrass);
    bLamp.position.set(0.55, 0.88, -0.15);
    study.add(bLamp);
    const bShade = new THREE.Mesh(rBox(0.24, 0.09, 0.12, 0.01), new THREE.MeshStandardMaterial({ color: 0x1f5c35, roughness: 0.2 }));
    bShade.position.set(0.55, 1.05, -0.15);
    study.add(bShade);

    return study;
  }

  // Asset 12: sexpistolsのボンデージパンツ (Sex Pistols bondage pants on mannequin)
  function createSexPistolsBondagePants(x, y, z, ry = 0) {
    const punkGroup = new THREE.Group();
    punkGroup.position.set(x, y, z);
    punkGroup.rotation.y = ry;
    decor.add(punkGroup);

    // Gallery mannequin plinth
    const plinth = new THREE.Mesh(rBox(0.85, 0.15, 0.85, 0.02), matStone);
    plinth.position.y = 0.075;
    punkGroup.add(plinth);

    // Minimalist fashion mannequin stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.65, 12), matAluminium);
    stand.position.y = 0.85;
    punkGroup.add(stand);

    // Red Royal Stewart Tartan Plaid Bondage Pants
    const waist = new THREE.Mesh(rBox(0.38, 0.22, 0.24, 0.02), matTartanPlaid);
    waist.position.y = 1.05;
    punkGroup.add(waist);

    for (const lx of [-0.11, 0.11]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.72, 16), matTartanPlaid);
      leg.position.set(lx, 0.60, 0);
      punkGroup.add(leg);

      // Silver metal leg horizontal zippers
      for (const zy of [0.45, 0.65, 0.80]) {
        const zip = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.005, 8, 16), matAluminium);
        zip.rotation.x = Math.PI / 2;
        zip.position.set(lx, zy, 0);
        punkGroup.add(zip);
      }
    }

    // Black canvas bondage connecting strap with D-rings between knees
    const strap = new THREE.Mesh(rBox(0.24, 0.04, 0.015, 0.003), matCharcoal);
    strap.position.set(0, 0.55, -0.06);
    punkGroup.add(strap);

    // Detachable rear bum flap pouch
    const flap = new THREE.Mesh(rBox(0.28, 0.20, 0.02, 0.005), matTartanPlaid);
    flap.position.set(0, 0.95, -0.13);
    punkGroup.add(flap);

    return punkGroup;
  }

  // --- 6F ASSETS ---

  // Asset 10: ノースフェイスのヌプシダウンジャケット (The North Face Nuptse jacket on valet stand)
  function createNorthFaceNuptseJacket(x, y, z, ry = 0) {
    const jGroup = new THREE.Group();
    jGroup.position.set(x, y, z);
    jGroup.rotation.y = ry;
    decor.add(jGroup);

    // Valet suit stand
    const standBase = new THREE.Mesh(rBox(0.65, 0.04, 0.45, 0.01), matWalnut);
    standBase.position.y = 0.02;
    jGroup.add(standBase);

    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.45, 12), matCharcoal);
    standPole.position.y = 0.75;
    jGroup.add(standPole);

    const hanger = new THREE.Mesh(rBox(0.58, 0.03, 0.06, 0.01), matWalnut);
    hanger.position.set(0, 1.46, 0);
    jGroup.add(hanger);

    // Nuptse 1996 Puffer Down Jacket
    const jacket = new THREE.Group();
    jacket.position.set(0, 1.15, 0);
    jGroup.add(jacket);

    // Matte black shoulder yoke & stand collar
    const collar = new THREE.Mesh(rBox(0.30, 0.14, 0.22, 0.02), matCharcoal);
    collar.position.set(0, 0.35, 0);
    jacket.add(collar);
    const yoke = new THREE.Mesh(rBox(0.64, 0.18, 0.32, 0.04), matCharcoal);
    yoke.position.set(0, 0.22, 0);
    jacket.add(yoke);

    // Voluminous yellow horizontal puffer down baffles
    for (let b = 0; b < 3; b++) {
      const baffle = new THREE.Mesh(rBox(0.62 - b * 0.02, 0.13, 0.30, 0.035), matNuptseYellow);
      baffle.position.set(0, 0.07 - b * 0.12, 0);
      jacket.add(baffle);
    }

    // Puffy sleeves
    for (const sx of [-0.34, 0.34]) {
      const sleeve = new THREE.Mesh(rBox(0.16, 0.48, 0.24, 0.04), matNuptseYellow);
      sleeve.position.set(sx, 0.05, 0);
      jacket.add(sleeve);
    }

    // White embroidered logo patch on chest
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    logo.position.set(0.18, 0.24, 0.165);
    jacket.add(logo);

    return jGroup;
  }

  // --- EXECUTE POPULATION ---

  // 1F
  create1FReceptionDesk();
  // Filler cultural assets and plants removed per user instruction to evaluate clean architectural minimalism
  // createVintageRockyCar(-4.5, 0.65, 33.0, 0.28);
  // createAstroBoyStatue(4.3, 0.65, 34.6, -0.32);
  // createKissatenCorner(3.6, 0.65, 31.6, -Math.PI / 2);
  // createRealisticArchitecturalPlant(-2.4, 0.65, 34.2, 1.25);
  // createRealisticArchitecturalPlant(5.4, 0.65, 32.2, 1.30);

  // 2F
  // createConcertStageDiorama(-3.8, 5.30, -15.5, 0.22);
  // createCinemaTheaterZone(3.8, 5.30, -15.2, -0.22);
  // createRealisticArchitecturalPlant(-2.70, 5.30, -16.5, 1.25);
  // createRealisticArchitecturalPlant(2.70, 5.30, -16.5, 1.25);

  // 3F
  // createBondiBlueIMac(-2.8, 9.95, -15.5, 0.35);
  // createKossPortaPro(0.95, 10.74, -16.05, -0.15);
  // createCigaretteAndZippoLighter(1.35, 10.74, -16.25, 0.10);
  // createRealisticArchitecturalPlant(-2.20, 9.95, -16.8, 1.20);

  // 4F
  // createSoccerStadiumModel(1.6, 14.60, -14.8, -0.18);
  // createAsicsSneakersCase(-1.2, 14.60, -14.2, 0.18);
  // createRealisticArchitecturalPlant(-4.80, 14.60, -13.20, 1.25);

  // 5F
  // createOlivettiTypewriterStudy(-3.8, 19.25, -15.8, 0.38);
  // createSexPistolsBondagePants(3.6, 19.25, -15.8, -0.32);
  // createRealisticArchitecturalPlant(-2.80, 19.25, -17.5, 1.25);

  // 6F
  // createNorthFaceNuptseJacket(-3.2, 23.90, -16.8, 0.25);
  // createRealisticArchitecturalPlant(2.30, 23.90, -17.80, 1.25);

  return {
    createRealisticArchitecturalPlant
  };
}
