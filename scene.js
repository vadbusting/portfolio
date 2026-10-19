/* TESHIMA LAB portfolio — CENOTAPH for & Cinematic Scene Architecture
 * HERO (Continuous Entrance Video + CENOTAPH for)
 *   ↓ (Slow smooth scroll down / touch swipe down)
 * LOBBY (1F: ABOUT - Scroll-scrubbed Canvas Sequence)
 *   ↓ (Arrive at guidebook)
 * FLOOR SELECT (01 ABOUT, 02 PRESENTATION, 03 LP, 04 WEB, 05 DIRECTION, B???F OTHER [RESTRICTED])
 *   ↓ (Instant jump into real 1080p dolly video clips, landing on OPEN PAGE)
 */
(function () {
  'use strict';

  /* ---------------- Configuration ---------------- */
  const FLOORS = [
    { key: 'about',        no: '1F',    name: 'ABOUT',        href: 'about.html',            lobby: true },
    { key: 'presentation', no: '2F',    name: 'PRESENTATION', href: 'presentation.html?v=76', pos: '50% 50%' },
    { key: 'lp',           no: '3F',    name: 'LP',           href: 'lp.html?v=76',           pos: '50% 50%' },
    { key: 'web',          no: '4F',    name: 'WEB',          href: 'https://www.originalsoccerball.com/', external: true, pos: '50% 50%' },
    { key: 'direction',    no: '5F',    name: 'DIRECTION',    href: 'https://new.express.adobe.com/webpage/XRy2MzIpmkxug', external: true, pos: '50% 50%' },
    { key: 'other',        no: 'B1F',   name: 'OTHER',        href: 'other.html',            pos: '50% 50%', secret: true }
  ];

  const PATH = {
    plate: (k, s) => s === 'start' ? 'assets/scenes/floor_start.webp' : `assets/scenes/${k}_${s}.webp`,
    dolly: k => `assets/video/${k}_dolly.mp4`,
    lobbyEnd: 'assets/scenes/lobby_end.webp',
    heroVideo: 'assets/video/hero_entrance.mp4'
  };

  /* ---------------- DOM References ---------------- */
  const $ = id => document.getElementById(id);
  const stage = $('stage'), lab = $('lab'), plate = $('plate'), plateA = $('plateImg');
  const dollyLayer = $('dollyLayer'), dolly = $('dolly'), dip = $('dip');
  const portal = $('portal'), portalTitle = $('portalTitle'), portalLink = $('portalLink'), rail = $('rail');
  const contact = $('contactLayer'), heroVideo = $('heroVideo'), scrollCue = $('scrollCue');
  const cenotaph = $('cenotaph');
  const seqCv = $('seq'), seqCtx = seqCv.getContext('2d');
  const plateB = plateA.cloneNode();
  plateB.classList.add('b');
  plate.appendChild(plateB);

  if (dolly) {
    dolly.addEventListener('loadedmetadata', () => {
      if (state === 'floor' && Number.isFinite(dolly.duration) && dolly.duration > 0) {
        try { dolly.currentTime = clamp01(floorQ) * dolly.duration; } catch (e) {}
      }
    });
    dolly.addEventListener('error', () => {
      videoBroken = true;
      stage.classList.add('is-video-fallback');
      if (plate) plate.classList.remove('no-fade');
    });
  }

  if (heroVideo) {
    heroVideo.addEventListener('error', () => {
      stage.classList.add('is-hero-fallback');
    });
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const conn = navigator.connection || {};
  const params = new URLSearchParams(location.search);
  let videoBroken = false;
  const canVideo = () => !videoBroken && !mq.matches && !conn.saveData && params.get('novideo') !== '1';
  const lightNet = () => conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const clamp01 = v => Math.min(1, Math.max(0, v));

  let state = 'hero', cur = -1, token = 0, busy = false, usedKeyboard = false;
  let platePanX = 0.5, platePanY = 0.5;
  let floorArrivedTime = 0;
  let isTouchDragging = false, lastDragTime = 0;
  const alive = t => t === token;

  function resetPlatePan() {
    const boxRatio = window.innerWidth / window.innerHeight;
    const isNarrowPortrait = boxRatio < 1.25;

    if (cur === 0 && isNarrowPortrait) {
      const renderW = window.innerHeight * (2752 / 1536);
      platePanX = Math.min(1, Math.max(0, (0.7024 * renderW - window.innerWidth / 2) / (renderW - window.innerWidth)));
      platePanY = 0.5;
    } else {
      platePanX = 0.5;
      platePanY = 0.5;
    }
    const posVal = `${(platePanX * 100).toFixed(1)}% 50.0%`;
    if (plate) plate.style.setProperty('--pos', posVal);
    if (dollyLayer) dollyLayer.style.setProperty('--pos', posVal);
    updateStageHotspot();
    updateAtomDollPosition();
    if (typeof seq !== 'undefined' && cur === 0) {
      seq.dirty = true;
      if (typeof drawSeq === 'function') drawSeq();
    }
  }

  /* ---------------- State & UI Helpers ---------------- */
  function setState(s) {
    state = s;
    stage.dataset.state = s;
    stage.dataset.floor = String(cur);
    lab.dataset.stage = s === 'hero' ? '0' : (s === 'floor' ? String(cur + 1) : 'L');
    if (typeof updateAtomVisibility === 'function') updateAtomVisibility();
  }

  const setDip = on => {
    dip.classList.toggle('is-on', on);
    if (on && atomLayer) atomLayer.hidden = true;
  };

  function setRail(i) {
    const jumpTarget = i >= 0 ? String(i + 1) : null;
    rail.querySelectorAll('.rail__btn').forEach(b => {
      b.classList.toggle('is-active', jumpTarget !== null && b.getAttribute('data-stage-jump') === jumpTarget);
    });
  }

  function getFloorHref(f) {
    return (f && f.href) ? f.href : '';
  }

  const FLOOR_HOTSPOTS = {
    // 1F: 黒い本の形そのままはみ出さず (2752x1536 master coords: 1452, 263, 965, 1051)
    0: {
      x: 1452 / 2752, y: 263 / 1536, w: 965 / 2752, h: 1051 / 1536,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    },
    // 2F: 壁掛けモニタ画面 (2752x1536 master coords: 888, 334, 974, 571)
    1: {
      x: 888 / 2752, y: 334 / 1536, w: 974 / 2752, h: 571 / 1536
    },
    // 3F: ノートPC画面 (2752x1536 master coords: 1045, 670, 675, 430)
    2: {
      x: 1045 / 2752, y: 670 / 1536, w: 675 / 2752, h: 430 / 1536
    },
    // 4F: スタジオディスプレイ画面 (2752x1536 master coords: 642, 178, 1468, 826)
    3: {
      x: 642 / 2752, y: 178 / 1536, w: 1468 / 2752, h: 826 / 1536
    },
    // 5F: 開いた本＆カラフルスモーク全体 (2752x1536 master coords: 896, 590, 1464, 494)
    4: {
      x: 896 / 2752, y: 590 / 1536, w: 1464 / 2752, h: 494 / 1536,
      clipPath: 'polygon(0.0% 39.7%, 32.8% 0.0%, 55.6% 9.7%, 88.1% 29.6%, 100.0% 41.7%, 76.8% 100.0%, 33.6% 62.0%)'
    },
    // B???F: サッカーボール球体ディスプレイ (正円直径840px 2752x1536: 958, 330, 840, 840)
    5: {
      x: 958 / 2752, y: 330 / 1536, w: 840 / 2752, h: 840 / 1536,
      clipPath: 'circle(50% at 50% 50%)',
      borderRadius: '50%'
    }
  };

  function getCoverRect(imgW, imgH, vw, vh, posX = 0.5, posY = 0.5) {
    const imgRatio = imgW / imgH;
    const boxRatio = vw / vh;
    let renderW, renderH, offsetX, offsetY;
    if (boxRatio > imgRatio) {
      renderW = vw;
      renderH = vw / imgRatio;
      offsetX = 0;
      offsetY = (vh - renderH) * posY;
    } else {
      renderH = vh;
      renderW = vh * imgRatio;
      offsetX = (vw - renderW) * posX;
      offsetY = 0;
    }
    return { renderW, renderH, offsetX, offsetY };
  }

  function updateCreditBtnPosition() {
    const btn = $('headerCreditBtn');
    const rail = $('rail');
    const headerLeft = document.querySelector('.lab__header-left');
    const headerRight = document.querySelector('.lab__header-right');
    if (!btn || !rail || !headerLeft || !headerRight) return;

    // 横長の時にCREDITがフロアボタンと被る時はその時だけPORTFOLIOの横に移動
    const boxRatio = window.innerWidth / window.innerHeight;
    const isLandscape = boxRatio >= 1.05;
    const stageEl = $('stage');
    const isFloorState = state === 'floor' || (stageEl && stageEl.dataset.state === 'floor');

    let isColliding = false;
    if (isFloorState && isLandscape) {
      const railRect = rail.getBoundingClientRect();
      const headerRect = document.querySelector('.lab__header')?.getBoundingClientRect();
      const headerBottom = headerRect ? headerRect.bottom : 65;

      // レールの上端がヘッダー下端付近（50px以内）に達しているか、高さが720px以下の横長画面の場合に被り判定
      if (railRect.top <= headerBottom + 50 || window.innerHeight <= 720) {
        isColliding = true;
      }
    }

    if (isColliding) {
      if (btn.parentElement !== headerLeft) {
        headerLeft.appendChild(btn);
      }
      btn.classList.add('is-next-to-portfolio');
    } else {
      if (btn.parentElement !== headerRight) {
        headerRight.appendChild(btn);
      }
      btn.classList.remove('is-next-to-portfolio');
    }
  }

  function updateCreditBtnVisibility() {
    const btn = $('headerCreditBtn');
    if (!btn) return;
    // CREDITボタンはOTHER（B???F）の静止画終点時のみ表示、それ以外は厳格に非表示
    if (state === 'floor' && cur === 5 && plate && plate.classList.contains('is-end')) {
      btn.hidden = false;
      btn.style.display = 'inline-block';
    } else {
      btn.hidden = true;
      btn.style.display = 'none';
    }
    updateCreditBtnPosition();
  }

  function openCreditModal() {
    const modal = $('creditModal');
    if (!modal) return;
    modal.hidden = false;
  }

  function closeCreditModal() {
    const modal = $('creditModal');
    if (!modal) return;
    modal.hidden = true;
    updateCreditBtnVisibility();
  }

  function updateStageHotspot(px = platePanX, py = platePanY) {
    const hotspot = $('stageHotspot');
    const emailHotspot = $('emailHotspot');
    if (!hotspot) return;

    if (state === 'floor' && cur >= 0 && (cur === 0 || (plate && plate.classList.contains('is-end')))) {
      const f = FLOORS[cur];
      const box = FLOOR_HOTSPOTS[cur];
      if (box && f && f.href) {
        const cover = getCoverRect(2752, 1536, window.innerWidth, window.innerHeight, px, py);
        hotspot.style.left = `${cover.offsetX + box.x * cover.renderW}px`;
        hotspot.style.top = `${cover.offsetY + box.y * cover.renderH}px`;
        hotspot.style.width = `${box.w * cover.renderW}px`;
        hotspot.style.height = `${box.h * cover.renderH}px`;
        hotspot.style.clipPath = box.clipPath || '';
        hotspot.style.borderRadius = box.borderRadius || '';
        const targetHref = getFloorHref(f);
        hotspot.href = targetHref;
        if (f.external) {
          hotspot.target = '_blank';
          hotspot.rel = 'noopener noreferrer';
        } else {
          hotspot.removeAttribute('target');
          hotspot.removeAttribute('rel');
        }
        hotspot.hidden = false;
        hotspot.style.display = 'block';

        if (emailHotspot) {
          if (cur === 0) {
            // 1F vadbusting@gmail.com exact text hotspot (1783, 928, 336, 30)
            emailHotspot.style.left = `${cover.offsetX + (1783 / 2752) * cover.renderW}px`;
            emailHotspot.style.top = `${cover.offsetY + (928 / 1536) * cover.renderH}px`;
            emailHotspot.style.width = `${(336 / 2752) * cover.renderW}px`;
            emailHotspot.style.height = `${(30 / 1536) * cover.renderH}px`;
            emailHotspot.href = 'mailto:vadbusting@gmail.com';
            emailHotspot.hidden = false;
            emailHotspot.style.display = 'block';
          } else {
            emailHotspot.hidden = true;
            emailHotspot.style.display = 'none';
          }
        }
      } else {
        hotspot.hidden = true;
        hotspot.style.display = 'none';
        if (emailHotspot) { emailHotspot.hidden = true; emailHotspot.style.display = 'none'; }
      }
    } else {
      hotspot.hidden = true;
      hotspot.style.display = 'none';
      if (emailHotspot) { emailHotspot.hidden = true; emailHotspot.style.display = 'none'; }
    }
  }

  // Click on floor hotspot navigates to floor destination
  const floorHotspotEl = $('stageHotspot');
  if (floorHotspotEl) {
    floorHotspotEl.addEventListener('click', e => {
      // Disambiguate drag/swipe vs pure tap/click: cancel click if user dragged > 8px or ended drag within 350ms
      if (isTouchDragging || (performance.now() - lastDragTime < 350)) {
        e.preventDefault();
        e.stopPropagation();
        isTouchDragging = false;
        return;
      }
      e.stopPropagation();
      if (cur >= 0) {
        const f = FLOORS[cur];
        if (f && f.href) {
          const targetHref = getFloorHref(f);
          if (f.external) {
            window.open(targetHref, '_blank', 'noopener noreferrer');
          } else {
            location.href = targetHref;
          }
        }
      }
    });
  }

  const emailHotspotEl = $('emailHotspot');
  if (emailHotspotEl) {
    emailHotspotEl.addEventListener('click', e => {
      if (isTouchDragging || (performance.now() - lastDragTime < 350)) {
        e.preventDefault();
        e.stopPropagation();
        isTouchDragging = false;
        return;
      }
      e.stopPropagation();
    });
  }

  function showPortal(i) {
    const f = FLOORS[i];
    portalTitle.textContent = f.name;
    const targetHref = getFloorHref(f);
    portalLink.href = targetHref;
    if (f.external) {
      portalLink.target = '_blank';
      portalLink.rel = 'noopener';
    } else {
      portalLink.removeAttribute('target');
      portalLink.removeAttribute('rel');
    }
    portal.classList.add('is-visible');
    portal.setAttribute('aria-hidden', 'false');
    portalLink.tabIndex = 0;
    updateStageHotspot();
  }

  function hidePortal() {
    portal.classList.remove('is-visible');
    portal.setAttribute('aria-hidden', 'true');
    portalLink.tabIndex = -1;
    const hotspot = $('stageHotspot');
    if (hotspot) hotspot.hidden = true;
  }

  async function loadImg(img, src) {
    if (img.getAttribute('src') !== src) img.src = src;
    try { await img.decode(); } catch (e) { /* ignore */ }
  }

  const getFloorPos = f => f.pos || '50% 50%';
  const setPos = f => {
    if (plate) plate.style.setProperty('--pos', getFloorPos(f));
    if (dollyLayer) dollyLayer.style.setProperty('--pos', '50% 50%');
  };

  /* ---------------- 1F ABOUT Sequence (Clean Canvas / Endplate) ---------------- */
  const seq = { end: new Image(), endOk: false, q: 1, qt: 1, dirty: true };
  seq.end.onload = () => { seq.endOk = true; seq.dirty = true; drawSeq(); };
  seq.end.src = PATH.lobbyEnd;

  function seqLoad() {
    if (!seq.endOk && !seq.end.src) {
      seq.end.src = PATH.lobbyEnd;
    }
  }

  function seqSize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 780 ? 1.5 : 1.75);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (seqCv.width !== w || seqCv.height !== h) {
      seqCv.width = w;
      seqCv.height = h;
      seq.dirty = true;
    }
  }

  function getSeqPanX() {
    const boxRatio = window.innerWidth / window.innerHeight;
    if (boxRatio >= 1.25) return 0.5;
    const renderW = window.innerHeight * (2752 / 1536);
    const targetX = Math.min(1, Math.max(0, (0.7024 * renderW - window.innerWidth / 2) / (renderW - window.innerWidth)));
    if (state === 'floor' && cur === 0) return platePanX;
    return targetX;
  }

  function cover(img, a = 1) {
    const cw = seqCv.width, ch = seqCv.height, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const s = Math.max(cw / iw, ch / ih);
    const w = iw * s, h = ih * s;
    const px = getSeqPanX();
    const py = 0.5;
    const ox = (cw - w) * px;
    const oy = (ch - h) * py;
    seqCtx.globalAlpha = a;
    seqCtx.drawImage(img, ox, oy, w, h);
  }

  function drawSeq() {
    seqSize();
    if (!seq.dirty) return;
    seq.dirty = false;
    seqCtx.globalCompositeOperation = 'source-over';
    seqCtx.clearRect(0, 0, seqCv.width, seqCv.height);
    if (seq.endOk || (seq.end && seq.end.complete && seq.end.naturalWidth > 0)) {
      cover(seq.end, 1);
    }
    seqCtx.globalAlpha = 1;
  }

  function setSeq(q) {
    seq.q = clamp01(q);
    seq.dirty = true;
    drawSeq();
  }

  addEventListener('resize', () => {
    seq.dirty = true;
    if (state === 'lobby' || (state === 'floor' && cur === 0)) drawSeq();
  }, { passive: true });

  function seqLoop(now) {
    if (state !== 'lobby') { seq.raf = 0; return; }
    const dt = seq.last ? Math.min(0.08, (now - seq.last) / 1000) : 0;
    seq.last = now;
    if (seq.auto) seq.qt = clamp01(seq.qt + dt * 0.012);
    const diff = seq.qt - seq.q;
    if (Math.abs(diff) > 0.0002) {
      seq.q += diff * Math.min(1, dt * 7);
      seq.dirty = true;
      drawSeq();
    }
    if (seq.qt >= 0.999 && seq.q >= 0.994 && !busy) {
      setSeq(1);
      seq.raf = 0;
      arriveLobbyEnd();
      return;
    }
    seq.raf = requestAnimationFrame(seqLoop);
  }

  const startSeqLoop = () => {
    if (!seq.raf) {
      seq.last = 0;
      seq.raf = requestAnimationFrame(seqLoop);
    }
  };

  function seqNudge(d) {
    if (busy) return;
    seq.auto = false;
    if (seq.qt <= 0.001 && d < -0.004) {
      goHero({ fromLobby: true });
      return;
    }
    seq.qt = clamp01(seq.qt + d);
    startSeqLoop();
  }

  /* ---------------- Floor Assets Warm-up ---------------- */
  const warmed = new Set();
  function warm(i) {
    if (i < 1 || i >= FLOORS.length || warmed.has(i) || lightNet()) return;
    warmed.add(i);
    const f = FLOORS[i];
    [PATH.plate(f.key, 'start'), PATH.plate(f.key, 'end')].forEach(s => {
      const im = new Image();
      im.decoding = 'async';
      im.src = s;
    });
    if (canVideo()) {
      try { fetch(PATH.dolly(f.key), { cache: 'force-cache', priority: 'low' }).catch(() => {}); } catch (e) {}
    }
  }

  rail.addEventListener('pointerover', e => {
    const b = e.target.closest('button');
    if (b) warm(+b.dataset.stageJump - 1);
  });

  /* ---------------- Dual Scrub Engine (HERO & Floor Video Scrubbing) ---------------- */
  let heroQ = 0, heroQt = 0, heroRaf = 0, heroLast = 0;
  let floorQ = 0, floorQt = 0, floorRaf = 0, floorLast = 0;

  if (heroVideo) {
    heroVideo.addEventListener('seeked', () => {
      if (state === 'hero') {
        const dur = (Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
        const targetTime = clamp01(heroQ) * dur;
        if (Math.abs(heroVideo.currentTime - targetTime) > 0.02) {
          try { heroVideo.currentTime = targetTime; } catch (e) {}
        }
      }
    });
  }

  if (dolly) {
    dolly.addEventListener('seeked', () => {
      if (state === 'floor') {
        const dur = (Number.isFinite(dolly.duration) && dolly.duration > 0) ? dolly.duration : 10.0;
        const targetTime = clamp01(floorQ) * dur;
        if (Math.abs(dolly.currentTime - targetTime) > 0.02) {
          try { dolly.currentTime = targetTime; } catch (e) {}
        }
      }
    });
  }

  function heroLoop(now) {
    const dt = Math.min(0.08, (now - heroLast) / 1000 || 0.016);
    heroLast = now;
    const diff = heroQt - heroQ;
    if (Math.abs(diff) > 0.0004) {
      heroQ += diff * Math.min(1, dt * 14);
    } else {
      heroQ = heroQt;
    }

    const dur = (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) ? heroVideo.duration : 10.0;
    const targetTime = clamp01(heroQ) * dur;

    if (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
      if (heroVideo.hasAttribute('poster')) {
        heroVideo.removeAttribute('poster');
      }
      if (!heroVideo.seeking && Math.abs(heroVideo.currentTime - targetTime) > 0.015) {
        try { heroVideo.currentTime = targetTime; } catch (e) {}
      }
    }

    // Cinematic CENOTAPH movie title: visible as approaching gate, fades out smoothly as passing through the gate (~3.0s to 4.3s)
    if (cenotaph) {
      const t = targetTime;
      if (t < 3.0) {
        cenotaph.style.opacity = '1';
        cenotaph.style.filter = 'none';
        cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
        cenotaph.style.pointerEvents = 'auto';
      } else if (t <= 4.3) {
        const p = (t - 3.0) / 1.3;
        const alpha = Math.max(0, 1 - p);
        cenotaph.style.opacity = alpha.toFixed(4);
        cenotaph.style.filter = `blur(${(p * 8).toFixed(1)}px)`;
        cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
        cenotaph.style.pointerEvents = alpha > 0.1 ? 'auto' : 'none';
      } else {
        cenotaph.style.opacity = '0';
        cenotaph.style.pointerEvents = 'none';
        cenotaph.style.filter = 'blur(8px)';
        cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    }

    if (heroQt <= 0.01 && heroQ <= 0.02) {
      if (scrollCue) scrollCue.classList.remove('is-hidden');
    }

    // End of HERO video -> Smoothly arrive at 1F Floor Selection (ABOUT)
    if (heroQt >= 0.99 && heroQ >= 0.985 && !busy) {
      heroQ = heroQt = 1;
      cancelAnimationFrame(heroRaf);
      heroRaf = 0;
      arriveLobbyEnd();
      return;
    }

    if (Math.abs(heroQt - heroQ) > 0.0004) {
      heroRaf = requestAnimationFrame(heroLoop);
    } else {
      heroRaf = 0;
      if (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
        try { heroVideo.currentTime = targetTime; } catch (e) {}
      }
    }
  }

  function startHeroLoop() {
    if (!heroRaf) {
      heroLast = performance.now();
      heroRaf = requestAnimationFrame(heroLoop);
    }
  }

  function heroNudge(d) {
    if (busy || state !== 'hero') return;
    if (heroVideo && heroVideo.hasAttribute('poster')) {
      heroVideo.removeAttribute('poster');
    }
    seqLoad();
    heroQt = clamp01(heroQt + d);
    startHeroLoop();
  }

  function floorLoop(now) {
    const dt = Math.min(0.08, (now - floorLast) / 1000 || 0.016);
    floorLast = now;
    const diff = floorQt - floorQ;
    if (Math.abs(diff) > 0.0004) {
      floorQ += diff * Math.min(1, dt * 14);
    } else {
      floorQ = floorQt;
    }

    // Mid-scrub: keep plate hidden so video is visible, hide portal
    if (floorQ > 0.005 && floorQ < 0.985) {
      plate.classList.remove('is-end');
      hidePortal();
      updateStageHotspot();
      updateCreditBtnVisibility();
      updateAtomVisibility();
    }

    const panX = 0.5 + (platePanX - 0.5) * clamp01(floorQ);
    const loopPosVal = `${(panX * 100).toFixed(1)}% 50.0%`;
    if (dollyLayer) dollyLayer.style.setProperty('--pos', loopPosVal);
    if (plate) plate.style.setProperty('--pos', loopPosVal);

    if (!canVideo()) {
      if (plateB) plateB.style.opacity = clamp01(floorQ);
    } else if (dolly && Number.isFinite(dolly.duration) && dolly.duration > 0) {
      const targetTime = clamp01(floorQ) * dolly.duration;
      if (!dolly.seeking && Math.abs(dolly.currentTime - targetTime) > 0.015) {
        try { dolly.currentTime = targetTime; } catch (e) {}
      }
    }

    // Settle at End Frame: high-res plateB (_end.webp) + show OPEN PAGE & hotspot
    if (floorQt >= 0.99 && floorQ >= 0.985 && !busy) {
      floorQ = floorQt = 1;
      if (plateB) plateB.style.opacity = '1';
      if (dolly && Number.isFinite(dolly.duration)) {
        try { dolly.currentTime = dolly.duration; } catch (e) {}
      }
      plate.classList.remove('no-fade');
      plate.classList.add('is-end');
      if (scrollCue) scrollCue.classList.add('is-hidden');
      stage.classList.remove('is-waiting-scroll');
      updateCreditBtnVisibility();
      updateAtomVisibility();
      floorRaf = 0;
      arrive(cur, token);
      return;
    }

    // Settle back at Start Frame: video's first frame directly (currentTime = 0) + show SCROLL cue
    if (floorQt <= 0.001 && floorQ <= 0.005 && !busy) {
      floorQ = floorQt = 0;
      if (plateB) plateB.style.opacity = '0';
      platePanX = 0.5;
      platePanY = 0.5;
      if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
      if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
      if (dolly && Number.isFinite(dolly.duration)) {
        try { dolly.currentTime = 0; } catch (e) {}
      }
      plate.classList.remove('is-end');
      stage.classList.add('is-waiting-scroll');
      if (scrollCue) scrollCue.classList.remove('is-hidden');
      updateStageHotspot();
      updateCreditBtnVisibility();
      updateAtomVisibility();
      floorRaf = 0;
      return;
    }

    if (Math.abs(floorQt - floorQ) > 0.0004) {
      floorRaf = requestAnimationFrame(floorLoop);
    } else {
      floorRaf = 0;
    }
  }

  function startFloorLoop() {
    if (!floorRaf) {
      floorLast = performance.now();
      floorRaf = requestAnimationFrame(floorLoop);
    }
  }

  function floorNudge(d) {
    if (busy || state !== 'floor' || cur < 1) return;
    floorQt = clamp01(floorQt + d);
    startFloorLoop();
  }

  /* ---------------- Navigation Transitions ---------------- */

  // Return to HERO (entrance video + CENOTAPH for)
  async function goHero(opts) {
    opts = opts || {};
    token++;
    if (floorRaf) { cancelAnimationFrame(floorRaf); floorRaf = 0; }
    if (heroRaf) { cancelAnimationFrame(heroRaf); heroRaf = 0; }
    if (seq.raf) { cancelAnimationFrame(seq.raf); seq.raf = 0; }
    if (dolly) dolly.pause();
    busy = false;

    if (!opts.fromLobby) {
      setDip(true);
      await wait(220);
    }
    hidePortal();
    setRail(-1);
    cur = -1;
    dollyLayer.classList.remove('is-on');
    plate.classList.remove('is-end');
    stage.classList.remove('is-waiting-scroll');
    seq.last = 0;
    seq.auto = false;
    seq.q = 0;
    seq.qt = 0;
    seq.dirty = true;
    setState('hero');

    if (opts.fromLobby) {
      heroQ = heroQt = 0.98;
      if (heroVideo && Number.isFinite(heroVideo.duration) && heroVideo.duration > 0) {
        if (heroVideo.hasAttribute('poster')) heroVideo.removeAttribute('poster');
        try { heroVideo.currentTime = heroVideo.duration * 0.98; } catch (e) {}
      }
      if (cenotaph) {
        cenotaph.style.opacity = '0';
        cenotaph.style.pointerEvents = 'none';
      }
      if (scrollCue) scrollCue.classList.add('is-hidden');
      startHeroLoop();
    } else {
      heroQ = heroQt = 0;
      if (heroVideo) {
        heroVideo.pause();
        try { heroVideo.currentTime = 0; } catch (e) {}
      }
      if (cenotaph) {
        cenotaph.style.opacity = '1';
        cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
        cenotaph.style.filter = 'none';
        cenotaph.style.pointerEvents = 'auto';
      }
      if (scrollCue) scrollCue.classList.remove('is-hidden');
    }
    document.documentElement.removeAttribute('data-page-floor');
    history.replaceState(null, '', location.pathname + location.search);
    if (!opts.fromLobby) {
      setDip(false);
    }
  }

  // Smoothly enter Lobby from HERO
  function toLobbyState(q) {
    cur = -1;
    seq.q = seq.qt = (typeof q === 'number') ? q : 0;
    seq.auto = false;
    seq.dirty = true;
    stage.classList.remove('is-waiting-scroll');
    if (scrollCue) scrollCue.classList.add('is-hidden');
    drawSeq();
    setState('lobby');
    setRail(-1);
    hidePortal();
    history.replaceState(null, '', '#lobby');
    startSeqLoop();
  }

  // Arrive at Lobby End (1F ABOUT)
  function arriveLobbyEnd() {
    busy = false;
    cur = 0;
    floorArrivedTime = performance.now();
    resetPlatePan();
    if (plate) {
      plate.classList.remove('is-end');
      plate.classList.add('no-fade');
    }
    if (dollyLayer) dollyLayer.classList.remove('is-on');
    seqLoad();
    seq.q = seq.qt = 1;
    seq.dirty = true;
    drawSeq();
    setState('floor');
    showPortal(0);
    setRail(0);
    updateStageHotspot();
    updateCreditBtnVisibility();
    updateAtomVisibility();
    if (scrollCue) scrollCue.classList.add('is-hidden');
    stage.classList.remove('is-waiting-scroll');
    document.documentElement.removeAttribute('data-page-floor');
    history.replaceState(null, '', '#about');
  }

  async function goLobbyEnd() {
    const t = ++token;
    busy = true;
    hidePortal();
    seqLoad();
    if (!seq.endOk) {
      await new Promise(r => {
        const iv = setInterval(() => { if (seq.endOk) { clearInterval(iv); r(); } }, 40);
        setTimeout(() => { clearInterval(iv); r(); }, 2500);
      });
    }
    if (state !== 'lobby') {
      setDip(true);
      await wait(280);
      if (!alive(t)) return;
    }
    if (dolly) {
      dolly.pause();
      try { dolly.currentTime = 0; } catch (e) {}
    }
    if (floorRaf) {
      cancelAnimationFrame(floorRaf);
      floorRaf = 0;
    }
    dollyLayer.classList.remove('is-on');
    arriveLobbyEnd();
    setDip(false);
  }

  // Jump directly to Floor i (2F〜5F, B???F)
  async function goFloor(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= FLOORS.length) return;
    if (i === 5 && !isSecretUnlocked()) {
      openCipherModal();
      return;
    }
    if (i === 0) return goLobbyEnd();
    if (busy && !opts.force) return;

    const t = ++token;
    busy = true;
    hidePortal();
    if (atomLayer) atomLayer.hidden = true;
    if (atomBubble) {
      atomBubble.hidden = true;
      atomBubble.classList.remove('is-hiding');
    }
    clearTimeout(bubbleTimer);
    const f = FLOORS[i];
    cur = i;
    setRail(i);
    warm(i);
    warm(i + 1);
    history.replaceState(null, '', '#' + f.key);

    if (floorRaf) {
      cancelAnimationFrame(floorRaf);
      floorRaf = 0;
    }
    floorQ = 0;
    floorQt = 0;
    floorLast = 0;

    const reset = () => {
      setPos(f);
      resetPlatePan();
      plate.classList.add('no-fade');
      plate.classList.remove('is-end');
      if (plateB) plateB.style.opacity = opts.instant ? '1' : '0';
      if (canVideo()) {
        stage.classList.remove('is-video-fallback');
        if (dolly) {
          dolly.pause();
          try { dolly.currentTime = 0; } catch (e) {}
          dolly.src = PATH.dolly(f.key);
        }
      } else {
        stage.classList.add('is-video-fallback');
        if (dolly) {
          dolly.pause();
          dolly.removeAttribute('src');
        }
      }
      dollyLayer.classList.remove('is-on');
      stage.classList.remove('is-waiting-scroll');
      if (scrollCue) scrollCue.classList.add('is-hidden');
      updateAtomVisibility();
    };

    const loadPlates = () => Promise.all([
      loadImg(plateA, PATH.plate(f.key, 'start')),
      loadImg(plateB, PATH.plate(f.key, 'end'))
    ]);

    if (opts.instant) {
      reset();
      await loadPlates();
      if (!alive(t)) return;
      floorQ = floorQt = 1;
      if (dolly) {
        const syncEnd = () => {
          if (Number.isFinite(dolly.duration) && dolly.duration > 0) {
            try { dolly.currentTime = dolly.duration; } catch (e) {}
          }
        };
        if (dolly.readyState >= 1) syncEnd();
        else dolly.addEventListener('loadedmetadata', syncEnd, { once: true });
      }
      plate.classList.add('is-end');
      setDip(false);
      return arrive(i, t);
    }

    setDip(true);
    await wait(280);
    if (!alive(t)) return;
    reset();
    await loadPlates();
    if (!alive(t)) return;

    setState('floor');
    plate.classList.remove('no-fade');
    document.documentElement.removeAttribute('data-page-floor');
    setDip(false);

    // Freeze on Start Still Frame — waiting for scroll trigger
    stage.classList.add('is-waiting-scroll');
    if (scrollCue) scrollCue.classList.remove('is-hidden');
    busy = false;
  }

  function arrive(i, t) {
    if (!alive(t)) return;
    floorArrivedTime = performance.now();
    setState('floor');
    stage.classList.remove('is-waiting-scroll');
    document.documentElement.removeAttribute('data-page-floor');
    if (scrollCue) scrollCue.classList.add('is-hidden');
    resetPlatePan();
    showPortal(i);
    setRail(i);
    busy = false;
    updateAtomVisibility();
    updateStageHotspot();
    updateCreditBtnVisibility();
    if (typeof updateAmbientPlate === 'function') updateAmbientPlate();
    if (usedKeyboard) setTimeout(() => portalLink.focus({ preventScroll: true }), 400);
  }

  function jump(i) {
    if (i === cur) return;
    if (i === 5 && !isSecretUnlocked()) {
      openCipherModal();
      return;
    }
    token++;
    if (floorRaf) {
      cancelAnimationFrame(floorRaf);
      floorRaf = 0;
    }
    if (dolly) dolly.pause();
    busy = false;
    goFloor(i, { force: true });
  }

  // Click background: only fast-forward in hero if clicked outside interactive controls
  stage.addEventListener('click', e => {
    const creditModal = $('creditModal');
    if (creditModal && !creditModal.hidden) return;
    if (state === 'hero') {
      if (!e.target.closest('button,a,.contactLayer,.creditModal')) {
        heroQt = 1;
        startHeroLoop();
      }
    }
    // On floor state, ONLY #floorHotspot and #portalLink navigate to pages. Background click does nothing.
  });

  /* ---------------- Input Handling ---------------- */
  window.addEventListener('wheel', e => {
    const creditModal = $('creditModal');
    if (!contact.hidden || (creditModal && !creditModal.hidden)) return;
    e.preventDefault();

    if (state === 'hero') {
      if (scrollCue) scrollCue.classList.add('is-hidden');
      heroNudge(e.deltaY / 4800);
    } else if (state === 'lobby') {
      seqNudge(e.deltaY / 2400);
    } else if (state === 'floor') {
      if (cur === 0 || (plate && plate.classList.contains('is-end'))) {
        // 到着直後（250ms以内）はビデオ再生時の慣性スクロールによる意図しないパン移動を抑止
        if (performance.now() - floorArrivedTime < 250) {
          return;
        }

        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          // --- 横長時 (Landscape: 左右スクロールで切れてる上下を表示 / 上下スクロールバックで巻き戻し) ---
          const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);

          if (isHorizontal) {
            // 静止画の横長は「左右スクロール」で切れている「上下」を表示 (platePanY 0.0〜1.0)
            if (Math.abs(e.deltaX) > 0.5) {
              platePanY = clamp01(platePanY + e.deltaX / (window.innerHeight * 1.5));
            }
            platePanX = 0.5; // 水平位置は中央固定

            const pVal = `50.0% ${(platePanY * 100).toFixed(1)}%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(0.5, platePanY);
            if (cur === 2) updateAtomDollPosition(0.5, platePanY);
            if (cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            return;
          } else {
            // 上下スクロール (垂直操作: 上スクロールでスクロールバック / 巻き戻し)
            if (e.deltaY < -15) {
              platePanX = 0.5;
              platePanY = 0.5;
              if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
              if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
              updateStageHotspot(0.5, 0.5);
              if (cur === 2) updateAtomDollPosition(0.5, 0.5);

              if (cur === 0) {
                goHero({ fromLobby: true });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              floorQt = Math.min(0.90, floorQt + e.deltaY / 2400);
              startFloorLoop();
              return;
            }
            return;
          }
        } else {
          // --- 縦長時 (Portrait: 左右スクロールで切れてる左右を表示 / 上下スクロールバックで巻き戻し) ---
          const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY);

          if (isHorizontalSwipe) {
            // 静止画の縦長画面は「左右スクロール」で切れている「左右」を表示 (platePanX 0.0〜1.0)
            if (Math.abs(e.deltaX) > 0.5) {
              platePanX = clamp01(platePanX + e.deltaX / (window.innerWidth * 1.5));
            }
            platePanY = 0.5; // 垂直位置は常に完全中央50%固定（上ズレを物理的に排除）

            const pVal = `${(platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(platePanX, 0.5);
            if (cur === 2) updateAtomDollPosition(platePanX, 0.5);
            if (cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            return;
          } else {
            // 上下スクロール (垂直操作: 上スクロールでスクロールバック / 巻き戻し)
            if (e.deltaY < -15) {
              if (cur === 0) {
                goHero({ fromLobby: true });
                return;
              }
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              floorQt = Math.min(0.90, floorQt + e.deltaY / 2400);
              startFloorLoop();
              return;
            }
            return;
          }
        }
      }
      if (scrollCue) scrollCue.classList.add('is-hidden');
      stage.classList.remove('is-waiting-scroll');
      floorNudge(e.deltaY / 2400);
    }
  }, { passive: false });

  let touchStartX = null, touchStartY = null;
  let touchOriginX = null, touchOriginY = null;

  stage.addEventListener('touchstart', e => {
    const creditModal = $('creditModal');
    if (creditModal && !creditModal.hidden) {
      touchStartX = null;
      touchStartY = null;
      return;
    }
    const isBlockingUI = e.target.closest('.contactLayer, .cipherModal, .creditModal, .cipherHintModal, .lab__header, .lab__rail, .atomBubble, button');
    if (isBlockingUI) {
      touchStartX = null;
      touchStartY = null;
      return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchOriginX = touchStartX;
    touchOriginY = touchStartY;
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    const creditModal = $('creditModal');
    if (creditModal && !creditModal.hidden) return;
    if (touchStartY == null || touchStartX == null) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = touchStartX - x;
    const dy = touchStartY - y;

    if (touchOriginX != null && touchOriginY != null) {
      const dist = Math.hypot(x - touchOriginX, y - touchOriginY);
      if (dist > 8) {
        isTouchDragging = true;
        lastDragTime = performance.now();
      }
    }

    if (state === 'hero') {
      if (scrollCue) scrollCue.classList.add('is-hidden');
      heroNudge(dy / (innerHeight * 6.0));
      touchStartY = y;
      touchStartX = x;
    } else if (state === 'lobby') {
      seqNudge((touchStartY - y) / (innerHeight * 3.0));
      touchStartY = y;
      touchStartX = x;
    } else if (state === 'floor') {
      if (cur === 0 || (plate && plate.classList.contains('is-end'))) {
        if (performance.now() - floorArrivedTime < 250) {
          touchStartY = y;
          touchStartX = x;
          return;
        }

        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          // --- 横長スワイプ (Landscape: 左右スワイプで切れてる上下を表示 / 上下スワイプで巻き戻し) ---
          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          if (isHorizontal) {
            // 左右スワイプで上下を表示 (platePanY 0.0〜1.0)
            if (Math.abs(dx) > 0.8) {
              platePanY = clamp01(platePanY + dx / (window.innerHeight * 1.5));
            }
            platePanX = 0.5; // 水平位置は中央固定

            const pVal = `50.0% ${(platePanY * 100).toFixed(1)}%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(0.5, platePanY);
            if (cur === 2) updateAtomDollPosition(0.5, platePanY);
            if (cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            touchStartY = y;
            touchStartX = x;
            return;
          } else {
            // 垂直スワイプ: 上下操作 (スクロールバック / 巻き戻し)
            if (dy < -20) {
              platePanX = 0.5;
              platePanY = 0.5;
              if (plate) plate.style.setProperty('--pos', '50.0% 50.0%');
              if (dollyLayer) dollyLayer.style.setProperty('--pos', '50.0% 50.0%');
              updateStageHotspot(0.5, 0.5);
              if (cur === 2) updateAtomDollPosition(0.5, 0.5);

              if (cur === 0) {
                touchStartY = null;
                touchStartX = null;
                goHero({ fromLobby: true });
                return;
              }
              touchStartY = y;
              touchStartX = x;
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              floorQt = Math.min(0.90, floorQt + dy / (innerHeight * 3.0));
              startFloorLoop();
              return;
            }
            touchStartY = y;
            touchStartX = x;
            return;
          }
        } else {
          // --- 縦長スワイプ (Portrait: 左右スワイプで切れてる左右を表示 / 上下スワイプで巻き戻し) ---
          const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);

          if (isHorizontalSwipe) {
            // 左右スワイプ: 水平パン (platePanX 0.0〜1.0)
            if (Math.abs(dx) > 0.8) {
              platePanX = clamp01(platePanX + dx / (window.innerWidth * 1.2));
            }
            platePanY = 0.5; // 垂直位置は常に完全中央50%固定（上ズレを物理的に排除）

            const pVal = `${(platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(platePanX, 0.5);
            if (cur === 2) updateAtomDollPosition(platePanX, 0.5);
            if (cur === 0) {
              seq.dirty = true;
              drawSeq();
            }
            touchStartY = y;
            touchStartX = x;
            return;
          } else {
            // 垂直スワイプ: 上下操作 (スクロールバック / 巻き戻し)
            if (dy < -20) {
              if (cur === 0) {
                touchStartY = null;
                touchStartX = null;
                goHero({ fromLobby: true });
                return;
              }
              touchStartY = y;
              touchStartX = x;
              if (scrollCue) scrollCue.classList.add('is-hidden');
              stage.classList.remove('is-waiting-scroll');
              floorQt = Math.min(0.90, floorQt + dy / (innerHeight * 3.0));
              startFloorLoop();
              return;
            }
            touchStartY = y;
            touchStartX = x;
            return;
          }
        }
      }
      touchStartY = y;
      touchStartX = x;
      if (scrollCue) scrollCue.classList.add('is-hidden');
      stage.classList.remove('is-waiting-scroll');
      floorNudge(dy / (innerHeight * 3.0));
    }
  }, { passive: true });

  ['touchend', 'touchcancel'].forEach(ev => {
    stage.addEventListener(ev, () => {
      touchStartX = null;
      touchStartY = null;
      touchOriginX = null;
      touchOriginY = null;
      setTimeout(() => {
        isTouchDragging = false;
      }, 150);
    }, { passive: true });
  });

  // Desktop mouse drag-to-pan support
  let isMouseDown = false;
  let mouseStartX = null, mouseStartY = null;
  let mouseOriginX = null, mouseOriginY = null;

  stage.addEventListener('mousedown', e => {
    if (e.button !== 0) return; // Primary left click only
    const creditModal = $('creditModal');
    if (creditModal && !creditModal.hidden) return;
    const isBlockingUI = e.target.closest('.contactLayer, .cipherModal, .creditModal, .cipherHintModal, .lab__header, .lab__rail, .atomBubble, button');
    if (isBlockingUI) return;

    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseOriginX = mouseStartX;
    mouseOriginY = mouseStartY;
  });

  window.addEventListener('mousemove', e => {
    if (!isMouseDown || mouseStartX == null || mouseStartY == null) return;
    const x = e.clientX;
    const y = e.clientY;
    const dx = mouseStartX - x;
    const dy = mouseStartY - y;

    const dist = Math.hypot(x - mouseOriginX, y - mouseOriginY);
    if (dist > 8) {
      isTouchDragging = true;
      lastDragTime = performance.now();
    }

    if (state === 'floor') {
      if (cur === 0 || (plate && plate.classList.contains('is-end'))) {
        const boxRatio = window.innerWidth / window.innerHeight;
        const isLandscape = boxRatio >= 1.05;

        if (isLandscape) {
          const isHorizontal = Math.abs(dx) > Math.abs(dy);
          if (isHorizontal && Math.abs(dx) > 0.8) {
            platePanY = clamp01(platePanY + dx / (window.innerHeight * 1.5));
            platePanX = 0.5;
            const pVal = `50.0% ${(platePanY * 100).toFixed(1)}%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(0.5, platePanY);
            if (cur === 2) updateAtomDollPosition(0.5, platePanY);
            if (cur === 0) { seq.dirty = true; drawSeq(); }
          }
        } else {
          const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
          if (isHorizontalSwipe && Math.abs(dx) > 0.8) {
            platePanX = clamp01(platePanX + dx / (window.innerWidth * 1.2));
            platePanY = 0.5;
            const pVal = `${(platePanX * 100).toFixed(1)}% 50.0%`;
            if (plate) plate.style.setProperty('--pos', pVal);
            if (dollyLayer) dollyLayer.style.setProperty('--pos', pVal);
            updateStageHotspot(platePanX, 0.5);
            if (cur === 2) updateAtomDollPosition(platePanX, 0.5);
            if (cur === 0) { seq.dirty = true; drawSeq(); }
          }
        }
      }
    }
    mouseStartX = x;
    mouseStartY = y;
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    mouseStartX = null;
    mouseStartY = null;
    mouseOriginX = null;
    mouseOriginY = null;
    setTimeout(() => { isTouchDragging = false; }, 150);
  });

  window.addEventListener('keydown', e => {
    usedKeyboard = true;
    if (!contact.hidden) {
      if (e.key === 'Escape') closeContact();
      return;
    }
    const adv = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter';
    const rev = e.key === 'ArrowUp' || e.key === 'PageUp';

    if (state === 'hero') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        if (scrollCue) scrollCue.classList.add('is-hidden');
        heroNudge(0.006);
      } else if (rev) {
        e.preventDefault();
        heroNudge(-0.006);
      }
      return;
    }
    if (state === 'lobby') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        seq.auto = true;
      } else if (rev) {
        e.preventDefault();
        seqNudge(-0.008);
      }
      return;
    }
    if (state === 'floor') {
      if (cur === 0) {
        if (rev) {
          e.preventDefault();
          goHero({ fromLobby: true });
          return;
        }
      } else {
        if (adv) {
          if (e.target.closest && e.target.closest('button,a')) return;
          e.preventDefault();
          if (scrollCue) scrollCue.classList.add('is-hidden');
          stage.classList.remove('is-waiting-scroll');
          floorNudge(0.012);
          return;
        } else if (rev) {
          e.preventDefault();
          floorNudge(-0.012);
          return;
        }
      }
    }
    if (/^[1-6]$/.test(e.key) && state === 'floor') {
      jump(+e.key - 1);
    }
  });

  window.addEventListener('pointerdown', () => { usedKeyboard = false; }, { passive: true });

  /* ---------------- 3F アトム人形インタラクション (マスター写真上のアトムに完全同期した透明ホットスポット & 自動フェード消去吹き出し) ---------------- */
  const atomLayer = document.getElementById('atomLayer');
  const atomDollWrap = document.getElementById('atomDollWrap');
  const atomBubble = document.getElementById('atomBubble');
  let bubbleTimer = 0;

  function updateAtomDollPosition(px = platePanX, py = platePanY) {
    if (!atomDollWrap) return;
    const cover = getCoverRect(1920, 1080, window.innerWidth, window.innerHeight, px, py);
    // Verified 100.00% exact match against lp_dolly.mp4 video end frame (1920x1080, error=0.00px):
    // Doll coordinates: left=1244, top=608, width=93, height=195 (feet planted flat on desk at y=803)
    const dollLeft = cover.offsetX + (1244 / 1920) * cover.renderW;
    const dollTop = cover.offsetY + (608 / 1080) * cover.renderH;
    const dollW = (93 / 1920) * cover.renderW;
    const dollH = (195 / 1080) * cover.renderH;

    atomDollWrap.style.left = `${dollLeft}px`;
    atomDollWrap.style.top = `${dollTop}px`;
    atomDollWrap.style.width = `${dollW}px`;
    atomDollWrap.style.height = `${dollH}px`;
  }

  function updateAtomVisibility() {
    if (!atomLayer) return;
    // 3F (LP floor) is cur === 2, ONLY visible when arrived at the desk end plate
    if (state === 'floor' && cur === 2 && plate && plate.classList.contains('is-end')) {
      atomLayer.hidden = false;
      updateAtomDollPosition();
    } else {
      atomLayer.hidden = true;
      if (atomBubble) {
        atomBubble.hidden = true;
        atomBubble.classList.remove('is-hiding');
      }
      clearTimeout(bubbleTimer);
    }
  }

  if (atomDollWrap) {
    atomDollWrap.addEventListener('click', e => {
      e.stopPropagation(); // MUST NOT navigate away to LP link
      // Bobblehead animation
      atomDollWrap.classList.remove('is-bobbling');
      void atomDollWrap.offsetWidth;
      atomDollWrap.classList.add('is-bobbling');
      setTimeout(() => { atomDollWrap.classList.remove('is-bobbling'); }, 1200);

      if (!atomBubble) return;
      clearTimeout(bubbleTimer);
      atomBubble.hidden = false;
      atomBubble.classList.remove('is-hiding');
      bubbleTimer = setTimeout(() => {
        atomBubble.classList.add('is-hiding');
        setTimeout(() => {
          atomBubble.hidden = true;
          atomBubble.classList.remove('is-hiding');
        }, 350);
      }, 8000);
    });
  }

  const atomCopyBtn = $('atomCopyBtn');
  if (atomCopyBtn) {
    atomCopyBtn.addEventListener('click', async e => {
      e.stopPropagation();
      e.preventDefault();
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        atomBubble.classList.add('is-hiding');
        setTimeout(() => {
          atomBubble.hidden = true;
          atomBubble.classList.remove('is-hiding');
        }, 350);
      }, 4000);

      const keyword = 'hungryart';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(keyword);
        } else {
          throw new Error('fallback');
        }
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = keyword;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(ta);
      }
      atomCopyBtn.classList.add('is-copied');
      setTimeout(() => {
        atomCopyBtn.classList.remove('is-copied');
      }, 1500);
    });
  }

  window.addEventListener('resize', () => {
    seqSize();
    if (state === 'floor') {
      const isNarrowHoriz = (window.innerWidth / window.innerHeight) < 1.45;
      if (!isNarrowHoriz) {
        // Automatically reset pan to 0.5 when resized back to desktop landscape
        // so Atom doll and background NEVER drift or move!
        platePanX = 0.5;
        platePanY = 0.5;
        if (plate) plate.style.setProperty('--pos', '50% 50%');
      }
      const f = FLOORS[cur];
      if (f) setPos(f);
      if (cur === 2) updateAtomDollPosition();
      updateStageHotspot();
    }
    updateCreditBtnVisibility();
    updateCreditBtnPosition();
  }, { passive: true });

  /* ---------------- B???F Secured Access Terminal UI ---------------- */
  const AUTH_KEY = 'cenotaph_unlocked';
  const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours persistent access

  function isSecretUnlocked() {
    try {
      const raw = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && data.unlocked && data.expiresAt > Date.now()) {
        return true;
      }
    } catch (e) {
      if (sessionStorage.getItem(AUTH_KEY) === 'unlocked') return true;
    }
    return false;
  }

  function setSecretUnlocked() {
    const payload = JSON.stringify({
      unlocked: true,
      expiresAt: Date.now() + AUTH_DURATION
    });
    try { localStorage.setItem(AUTH_KEY, payload); } catch (e) {}
    try { sessionStorage.setItem(AUTH_KEY, payload); } catch (e) {}
  }

  let unlockedSecret = isSecretUnlocked();
  const cipherModal = document.getElementById('cipherModal');
  const authCard = document.getElementById('authCard');
  const keyInput = document.getElementById('keyInput');
  const cipherForm = document.getElementById('cipherForm');
  const authBtn = document.getElementById('btn');
  const cipherHintBtn = document.getElementById('cipherHintBtn');
  const cipherCancel = document.getElementById('cipherCancel');

  function openCipherModal() {
    if (!cipherModal) return;
    document.body.classList.add('cipher-locked');
    cipherModal.hidden = false;
    cipherModal.style.display = 'flex';
    cipherModal.style.opacity = '1';
    if (authCard) authCard.classList.remove('is-authenticated', 'success-border');
    if (authBtn) {
      authBtn.textContent = '認証';
      authBtn.classList.remove('btn-success');
      authBtn.disabled = false;
    }
    if (keyInput) {
      keyInput.value = '';
      keyInput.classList.remove('input-valid', 'is-error');
      keyInput.disabled = false;
      keyInput.blur();
    }
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function closeCipherModal() {
    if (!cipherModal) return;
    document.body.classList.remove('cipher-locked');
    cipherModal.hidden = true;
    cipherModal.style.display = 'none';
    cipherModal.style.opacity = '';
  }

  function handleCipherUnlock() {
    unlockedSecret = true;
    setSecretUnlocked();

    if (keyInput) {
      keyInput.blur();
      keyInput.classList.add('input-valid');
      keyInput.disabled = true;
    }
    if (authCard) {
      authCard.classList.add('is-authenticated', 'success-border');
    }
    if (authBtn) {
      authBtn.classList.add('btn-success');
      authBtn.textContent = '承認完了';
      authBtn.disabled = true;
    }

    // Play checkmark circle & mark animation, then transition to B???F
    setTimeout(() => {
      cipherModal.style.transition = 'opacity 0.35s ease';
      cipherModal.style.opacity = '0';
      setTimeout(() => {
        closeCipherModal();
        jump(5); // Transition to B???F (Floor index 5, other.html)
      }, 350);
    }, 950);
  }

  function handleCipherError() {
    if (keyInput) {
      keyInput.classList.add('is-error');
      setTimeout(() => {
        keyInput.classList.remove('is-error');
      }, 600);
    }
  }

  if (cipherForm) {
    cipherForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = (keyInput.value || '').trim().replace(/\s+/g, '').toLowerCase();
      // Correct password: ハングリーアート
      if (val === 'ハングリーアート' || val === 'hungryart' || val === 'hungry-art' || val === 'hungry_art') {
        handleCipherUnlock();
      } else {
        handleCipherError();
      }
    });
  }

  const cipherHintModal = document.getElementById('cipherHintModal');
  const cipherHintClose = document.getElementById('cipherHintClose');
  const cipherHintOkBtn = document.getElementById('cipherHintOkBtn');
  const cipherHintBackdrop = document.getElementById('cipherHintBackdrop');

  function openCipherHint() {
    if (cipherHintModal) cipherHintModal.hidden = false;
  }
  function closeCipherHint() {
    if (cipherHintModal) cipherHintModal.hidden = true;
  }
  if (cipherHintBtn) cipherHintBtn.addEventListener('click', openCipherHint);
  if (cipherHintClose) cipherHintClose.addEventListener('click', closeCipherHint);
  if (cipherHintOkBtn) cipherHintOkBtn.addEventListener('click', closeCipherHint);
  if (cipherHintBackdrop) cipherHintBackdrop.addEventListener('click', closeCipherHint);

  if (cipherCancel) {
    cipherCancel.addEventListener('click', closeCipherModal);
  }

  // Intercept background interaction completely during modal display
  if (cipherModal) {
    const backdrop = document.getElementById('cipherModalBackdrop');
    ['wheel', 'touchmove', 'pointerdown', 'click'].forEach(ev => {
      cipherModal.addEventListener(ev, e => {
        if (e.target === cipherModal || e.target === backdrop) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, { passive: false });
    });
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (cipherModal && !cipherModal.hidden) closeCipherModal();
      const creditModal = $('creditModal');
      if (creditModal && !creditModal.hidden) closeCreditModal();
    }
    // 'H' key toggles hotspot visualization live on index.html
    if ((e.key === 'h' || e.key === 'H') && !e.target.closest('input, textarea')) {
      if (stage) stage.classList.toggle('is-debug-hotspots');
    }
  });

  const headerCredit = $('headerCreditBtn');
  if (headerCredit) headerCredit.addEventListener('click', openCreditModal);
  const creditClose = $('creditModalClose');
  if (creditClose) creditClose.addEventListener('click', closeCreditModal);

  // Credit modal: 枠以外の操作を一切受け付けない (クリック・ホイール・タッチを遮断)
  const creditModal = $('creditModal');
  if (creditModal) {
    ['wheel', 'touchmove', 'pointerdown', 'click', 'touchstart'].forEach(ev => {
      creditModal.addEventListener(ev, e => {
        if (!e.target.closest('.creditModal__dialog')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, { passive: false });
    });
  }

  rail.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const targetIdx = +b.dataset.stageJump - 1;
    if (targetIdx === 5) {
      if (isSecretUnlocked()) {
        jump(5);
        return;
      }
      openCipherModal();
      return;
    }
    jump(targetIdx);
  });

  $('brand').addEventListener('click', e => {
    e.preventDefault();
    goHero();
  });

  /* ---------------- Contact Layer ---------------- */
  let lastFocus = null;
  function openContact() {
    lastFocus = document.activeElement;
    contact.hidden = false;
    contact.querySelector('[data-contact-close]').focus();
  }
  function closeContact() {
    contact.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  const btnContact = document.querySelector('[data-contact]');
  if (btnContact) btnContact.addEventListener('click', openContact);
  if (contact) {
    const btnClose = contact.querySelector('[data-contact-close]');
    if (btnClose) btnClose.addEventListener('click', closeContact);
    contact.addEventListener('click', e => { if (e.target === contact) closeContact(); });
  }

  /* ---------------- Initialization ---------------- */
  const hash = location.hash.replace('#', '');
  const idx = FLOORS.findIndex(f => f.key === hash);
  seqSize();
  if (params.get('debug') === 'hotspots' || params.get('debug') === '1') {
    if (stage) stage.classList.add('is-debug-hotspots');
  }
  if (idx === 5 && !isSecretUnlocked()) {
    // Secret restricted floor! Direct URL access strictly intercepted!
    history.replaceState(null, '', location.pathname);
    setState('hero');
    seqLoad();
    if (heroVideo) {
      heroVideo.pause();
      try { heroVideo.currentTime = 0; } catch (e) {}
    }
    openCipherModal();
  } else if (idx === 0) {
    setState('lobby');
    goLobbyEnd();
  } else if (idx > 0) {
    setState('floor');
    goFloor(idx, { instant: true, force: true });
  } else if (hash === 'lobby') {
    seqLoad();
    toLobbyState(0);
  } else {
    setState('hero');
    seqLoad(); // Preload lobby frames in background while user views HERO
    if (heroVideo) {
      heroVideo.pause();
      try { heroVideo.currentTime = 0; } catch (e) {}
    }
    if (cenotaph) {
      cenotaph.style.opacity = '1';
      cenotaph.style.pointerEvents = 'auto';
      cenotaph.style.filter = 'none';
      cenotaph.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }

  addEventListener('hashchange', () => {
    const k = location.hash.replace('#', '');
    const j = FLOORS.findIndex(f => f.key === k);
    if (j === 5 && !isSecretUnlocked()) {
      // Intercept URL hash change to #other
      history.replaceState(null, '', location.pathname + (cur >= 0 ? '#' + FLOORS[cur].key : ''));
      openCipherModal();
      return;
    }
    if (j >= 0 && j !== cur) {
      if (j === 0) goLobbyEnd();
      else goFloor(j, { instant: false, force: true });
    } else if (k === 'top' || k === '') {
      goHero();
    }
  });
})();
