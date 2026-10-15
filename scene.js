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
    { key: 'about',        no: '01',    name: 'ABOUT',        href: 'about.html',            lobby: true },
    { key: 'presentation', no: '02',    name: 'PRESENTATION', href: 'presentation.html?v=5', pos: '50% 50%' },
    { key: 'lp',           no: '03',    name: 'LP',           href: 'lp.html?v=5',           pos: '50% 50%' },
    { key: 'web',          no: '04',    name: 'WEB',          href: 'https://www.originalsoccerball.com/', external: true, pos: '50% 50%' },
    { key: 'direction',    no: '05',    name: 'DIRECTION',    href: 'https://new.express.adobe.com/webpage/XRy2MzIpmkxug', external: true, pos: '50% 50%' },
    { key: 'other',        no: 'B???F', name: 'OTHER',        href: 'other.html',            pos: '50% 50%', secret: true }
  ];

  const PATH = {
    plate: (k, s) => `assets/scenes/${k}_${s}.webp`,
    dolly: k => `assets/video/${k}_dolly.mp4`,
    seq: i => `assets/lobby_seq/f${String(i).padStart(3, '0')}.webp`,
    lobbyEnd: 'assets/scenes/lobby_end.webp',
    lobbyStart: 'assets/scenes/lobby_start.webp',
    heroVideo: 'assets/video/hero_entrance.mp4',
    heroPoster: 'assets/scenes/hero_start.webp'
  };

  const SEQ_COUNT = 96;
  const WATCHDOG_MS = 9000;

  /* ---------------- DOM References ---------------- */
  const $ = id => document.getElementById(id);
  const stage = $('stage'), lab = $('lab'), plate = $('plate'), plateA = $('plateImg');
  const dollyLayer = $('dollyLayer'), dolly = $('dolly'), dip = $('dip');
  const portal = $('portal'), portalTitle = $('portalTitle'), portalLink = $('portalLink'), rail = $('rail');
  const contact = $('contactLayer'), heroVideo = $('heroVideo');
  const seqCv = $('seq'), seqCtx = seqCv.getContext('2d');
  const plateB = plateA.cloneNode();
  plateB.classList.add('b');
  plate.appendChild(plateB);

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const conn = navigator.connection || {};
  const params = new URLSearchParams(location.search);
  let videoBroken = false;
  const canVideo = () => !videoBroken && !mq.matches && !conn.saveData && params.get('novideo') !== '1';
  const lightNet = () => conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  let state = 'hero', cur = -1, token = 0, busy = false, usedKeyboard = false;
  const alive = t => t === token;

  /* ---------------- State & UI Helpers ---------------- */
  function setState(s) {
    state = s;
    stage.dataset.state = s;
    stage.dataset.floor = String(cur);
    lab.dataset.stage = s === 'hero' ? '0' : (s === 'floor' ? String(cur + 1) : 'L');
  }

  const setDip = on => dip.classList.toggle('is-on', on);

  function setRail(i) {
    rail.querySelectorAll('button').forEach((b, k) => b.classList.toggle('is-active', k === i));
  }

  function showPortal(i) {
    const f = FLOORS[i];
    portalTitle.textContent = f.name;
    portalLink.href = f.href;
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
  }

  function hidePortal() {
    portal.classList.remove('is-visible');
    portal.setAttribute('aria-hidden', 'true');
    portalLink.tabIndex = -1;
  }

  async function loadImg(img, src) {
    if (img.getAttribute('src') !== src) img.src = src;
    try { await img.decode(); } catch (e) { /* ignore */ }
  }

  const setPos = f => [plate, dollyLayer].forEach(l => l.style.setProperty('--pos', f.pos || '50% 50%'));

  /* ---------------- Lobby Sequence (Canvas Scrubbing) ---------------- */
  const seq = { imgs: new Array(SEQ_COUNT), ok: new Array(SEQ_COUNT).fill(false), end: new Image(), endOk: false, q: 0, qt: 0, started: false, auto: false, raf: 0, last: 0, dirty: true };
  seq.end.onload = () => { seq.endOk = true; seq.dirty = true; drawSeq(); };

  function seqOrder() {
    const out = [], seen = new Set();
    [SEQ_COUNT - 1, 0].forEach(i => { out.push(i); seen.add(i); });
    for (let s = 32; s >= 1; s = s >> 1) {
      for (let i = 0; i < SEQ_COUNT; i += s) {
        if (!seen.has(i)) { seen.add(i); out.push(i); }
      }
    }
    return out;
  }

  function seqLoad() {
    if (seq.started) return;
    seq.started = true;
    seq.end.src = PATH.lobbyEnd;
    const order = seqOrder();
    let k = 0;
    const next = () => {
      if (k >= order.length) return;
      const i = order[k++], im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        seq.ok[i] = true;
        seq.dirty = true;
        if (state === 'lobby' || (state === 'floor' && cur === 0)) drawSeq();
        next();
      };
      im.onerror = next;
      im.src = PATH.seq(i);
      seq.imgs[i] = im;
    };
    for (let n = 0; n < (lightNet() ? 2 : 4); n++) next();
  }

  function nearest(i) {
    for (let d = 0; d < SEQ_COUNT; d++) {
      if (i - d >= 0 && seq.ok[i - d]) return i - d;
      if (i + d < SEQ_COUNT && seq.ok[i + d]) return i + d;
    }
    return -1;
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

  function cover(img, a) {
    const cw = seqCv.width, ch = seqCv.height, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    seqCtx.globalAlpha = a;
    seqCtx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function drawSeq() {
    seqSize();
    if (!seq.dirty) return;
    seq.dirty = false;
    const f = clamp01(seq.q) * (SEQ_COUNT - 1), i0 = Math.floor(f), a = f - i0;
    const A = nearest(i0);
    seqCtx.globalCompositeOperation = 'source-over';
    seqCtx.clearRect(0, 0, seqCv.width, seqCv.height);
    if (A >= 0) cover(seq.imgs[A], 1);
    if (a > 0.03 && i0 + 1 < SEQ_COUNT) {
      const B = nearest(i0 + 1);
      if (B >= 0 && B !== A) cover(seq.imgs[B], a);
    }
    const e = smooth(0.88, 1.0, seq.q);
    if (e > 0 && seq.endOk) cover(seq.end, e);
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
    if (seq.auto) seq.qt = clamp01(seq.qt + dt * 0.12);
    const diff = seq.qt - seq.q;
    if (Math.abs(diff) > 0.0002) {
      seq.q += diff * Math.min(1, dt * 7);
      seq.dirty = true;
      drawSeq();
    }
    if (seq.qt >= 0.999 && seq.q >= 0.994 && !busy) {
      setSeq(1);
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
      goHero();
      return;
    }
    seq.qt = clamp01(seq.qt + d);
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

  /* ---------------- Video Playback ---------------- */
  function playClip(v, src, onStart) {
    return new Promise(resolve => {
      let done = false, started = false, timer;
      const finish = ok => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        ['ended', 'error', 'playing'].forEach(ev => v.removeEventListener(ev, h[ev]));
        resolve(ok);
      };
      const h = {
        playing: () => {
          if (!started) {
            started = true;
            clearTimeout(timer);
            onStart && onStart();
          }
        },
        ended: () => finish(true),
        error: () => finish(false)
      };
      Object.keys(h).forEach(ev => v.addEventListener(ev, h[ev]));
      timer = setTimeout(() => {
        if (!started) { videoBroken = true; finish(false); }
      }, WATCHDOG_MS);
      v.cancelSkip = () => finish(false);
      v.muted = true;
      v.playsInline = true;
      v.src = src;
      v.load();
      const p = v.play();
      if (p && p.catch) p.catch(() => { videoBroken = true; finish(false); });
    });
  }

  function stopClip(v) {
    try { v.pause(); } catch (e) {}
    if (v.cancelSkip) {
      const c = v.cancelSkip;
      v.cancelSkip = null;
      c();
    }
  }

  function clearClip(v) {
    stopClip(v);
    v.removeAttribute('src');
    try { v.load(); } catch (e) {}
  }

  /* ---------------- Navigation Transitions ---------------- */

  // Return to HERO (entrance video + CENOTAPH for)
  async function goHero() {
    token++;
    stopClip(dolly);
    busy = false;
    setDip(true);
    await wait(220);
    hidePortal();
    setRail(-1);
    cur = -1;
    clearClip(dolly);
    dollyLayer.classList.remove('is-on');
    setState('hero');
    if (heroVideo && heroVideo.paused) {
      try { heroVideo.play(); } catch (e) {}
    }
    history.replaceState(null, '', location.pathname + location.search);
    setDip(false);
  }

  // Smoothly enter Lobby from HERO
  function toLobbyState(q) {
    cur = -1;
    seq.q = seq.qt = q || 0;
    seq.auto = false;
    seq.dirty = true;
    drawSeq();
    setState('lobby');
    setRail(-1);
    hidePortal();
    history.replaceState(null, '', '#lobby');
    startSeqLoop();
  }

  function enterLobbyFromHero() {
    if (busy || state !== 'hero') return;
    busy = true;
    seqLoad();
    toLobbyState(0);
    setTimeout(() => { busy = false; }, 350);
  }

  // Arrive at Lobby End (1F ABOUT)
  function arriveLobbyEnd() {
    busy = false;
    cur = 0;
    seq.q = seq.qt = 1;
    seq.dirty = true;
    drawSeq();
    setState('floor');
    showPortal(0);
    setRail(0);
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
      await wait(250);
      if (!alive(t)) return;
    }
    clearClip(dolly);
    dollyLayer.classList.remove('is-on');
    arriveLobbyEnd();
    setDip(false);
  }

  // Jump directly to Floor i (2F〜5F, B???F)
  async function goFloor(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= FLOORS.length) return;
    if (i === 0) return goLobbyEnd();
    if (busy && !opts.force) return;

    const t = ++token;
    busy = true;
    hidePortal();
    const f = FLOORS[i];
    cur = i;
    setRail(i);
    warm(i);
    warm(i + 1);
    history.replaceState(null, '', '#' + f.key);

    const reset = () => {
      setPos(f);
      plate.classList.add('no-fade');
      plate.classList.remove('is-end');
      clearClip(dolly);
      dollyLayer.classList.remove('is-on');
    };

    const loadPlates = () => Promise.all([
      loadImg(plateA, PATH.plate(f.key, 'start')),
      loadImg(plateB, PATH.plate(f.key, 'end'))
    ]);

    if (opts.instant) {
      reset();
      await loadPlates();
      if (!alive(t)) return;
      plate.classList.add('is-end');
      setDip(false);
      return arrive(i, t);
    }

    setDip(true);
    await wait(240);
    if (!alive(t)) return;
    reset();
    await loadPlates();
    if (!alive(t)) return;

    setState('floor');
    plate.classList.remove('no-fade');
    setDip(false);

    // Play the floor footage directly (contains elevator opening / entrance)
    let played = false;
    const clipPromise = canVideo()
      ? playClip(dolly, PATH.dolly(f.key), () => dollyLayer.classList.add('is-on')).then(ok => { played = ok; return ok; })
      : Promise.resolve(false);

    const ok = await clipPromise;
    if (!alive(t)) return;

    // Settle onto end frame
    plate.classList.add('is-end');
    arrive(i, t);
  }

  function arrive(i, t) {
    if (!alive(t)) return;
    setState('floor');
    showPortal(i);
    setRail(i);
    busy = false;
    if (usedKeyboard) setTimeout(() => portalLink.focus({ preventScroll: true }), 400);
  }

  function jump(i) {
    if (i === cur) return;
    token++;
    stopClip(dolly);
    busy = false;
    goFloor(i, { force: true });
  }

  // Click background to instantly jump to end of video
  stage.addEventListener('click', e => {
    if (state === 'floor' && !e.target.closest('button,a,.contactLayer')) {
      if (dolly && !dolly.paused) {
        try { dolly.currentTime = dolly.duration || 999; } catch (e) {}
      }
    }
  });

  /* ---------------- Input Handling ---------------- */
  let heroScrollAccum = 0;

  window.addEventListener('wheel', e => {
    if (!contact.hidden) return;
    e.preventDefault();

    if (state === 'hero') {
      if (e.deltaY > 0) {
        heroScrollAccum += e.deltaY;
        if (heroScrollAccum > 60) {
          heroScrollAccum = 0;
          enterLobbyFromHero();
        }
      } else {
        heroScrollAccum = 0;
      }
    } else if (state === 'lobby') {
      seqNudge(e.deltaY / 2200);
    }
  }, { passive: false });

  let touchStartY = null;

  stage.addEventListener('touchstart', e => {
    touchStartY = e.target.closest('button,a,.contactLayer') ? null : e.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    if (touchStartY == null) return;
    const y = e.touches[0].clientY;
    const dy = touchStartY - y;

    if (state === 'hero') {
      if (dy > 35) {
        touchStartY = null;
        enterLobbyFromHero();
      }
    } else if (state === 'lobby') {
      seqNudge((touchStartY - y) / (innerHeight * 1.4));
      touchStartY = y;
    }
  }, { passive: true });

  stage.addEventListener('touchend', () => { touchStartY = null; }, { passive: true });

  window.addEventListener('keydown', e => {
    usedKeyboard = true;
    if (!contact.hidden) {
      if (e.key === 'Escape') closeContact();
      return;
    }
    const adv = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter';

    if (state === 'hero') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        enterLobbyFromHero();
      }
      return;
    }
    if (state === 'lobby') {
      if (adv) {
        if (e.target.closest && e.target.closest('button,a')) return;
        e.preventDefault();
        seq.auto = true;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        seqNudge(-0.08);
      }
      return;
    }
    if (/^[1-6]$/.test(e.key) && state === 'floor') {
      jump(+e.key - 1);
    }
  });

  window.addEventListener('pointerdown', () => { usedKeyboard = false; }, { passive: true });

  rail.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) jump(+b.dataset.stageJump - 1);
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
  if (idx === 0) {
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
      heroVideo.play().catch(() => {});
    }
  }

  addEventListener('hashchange', () => {
    const k = location.hash.replace('#', '');
    const j = FLOORS.findIndex(f => f.key === k);
    if (j >= 0 && j !== cur) {
      if (j === 0) goLobbyEnd();
      else goFloor(j, { instant: false, force: true });
    } else if (k === 'top' || k === '') {
      goHero();
    }
  });
})();
