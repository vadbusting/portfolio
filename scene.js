/* TESHIMA LAB portfolio v18
 * 3D night exterior (scroll) → doors open → lobby sequence (scroll-scrubbed frames) → lobby end = 1F ABOUT + floor select (right)
 * → pick 2F+ → elevator (cab POV) → floor dolly → portal.   Page scroll is OFF once the lobby sequence ends.
 * All visible text is reused verbatim from the original site (hero-v13 markup).
 */
(function () {
  'use strict';

  /* ---------------- config ---------------- */
  const FLOORS = [
    { key: 'about',        no: '01', name: 'ABOUT',        href: 'about.html',            lobby: true },
    { key: 'presentation', no: '02', name: 'PRESENTATION', href: 'presentation.html?v=5', pos: '50% 50%' },
    { key: 'lp',           no: '03', name: 'LP',           href: 'lp.html?v=5',           pos: '46% 50%' },
    { key: 'web',          no: '04', name: 'WEB',          href: 'https://www.originalsoccerball.com/', external: true, pos: '46% 50%' },
    { key: 'direction',    no: '05', name: 'DIRECTION',    href: 'https://new.express.adobe.com/webpage/XRy2MzIpmkxug', external: true, pos: '56% 50%' },
    { key: 'other',        no: '06', name: 'OTHER',        href: 'other.html',            pos: '50% 50%' }
  ];
  const PATH = { plate: (k, s) => `assets/scenes/${k}_${s}.webp`, dolly: k => `assets/video/${k}_dolly.mp4`, seq: i => `assets/lobby_seq/f${String(i).padStart(3, '0')}.webp`, lobbyEnd: 'assets/scenes/lobby_end.webp', lobbyStart: 'assets/scenes/lobby_start.webp' };
  const SEQ_COUNT = 96;                  // assets/lobby_seq/manifest.json
  const WATCHDOG_MS = 4500, RIDE_MS = 1500, OPEN_MS = 1500;

  /* ---------------- refs ---------------- */
  const $ = id => document.getElementById(id);
  const stage = $('stage'), lab = $('lab'), plate = $('plate'), plateA = $('plateImg');
  const dollyLayer = $('dollyLayer'), dolly = $('dolly'), cab = $('cab'), digits = $('cabDigits'), dip = $('dip');
  const portal = $('portal'), portalTitle = $('portalTitle'), portalLink = $('portalLink'), rail = $('rail');
  const contact = $('contactLayer'), loaderEl = $('loader'), extCopy = document.querySelector('.lab__copy');
  const seqCv = $('seq'), seqCtx = seqCv.getContext('2d');
  const plateB = plateA.cloneNode(); plateB.classList.add('b'); plate.appendChild(plateB);

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const conn = navigator.connection || {};
  const params = new URLSearchParams(location.search);
  let videoBroken = false;
  const canVideo = () => !videoBroken && !mq.matches && !conn.saveData && params.get('novideo') !== '1';
  const lightNet = () => conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  let state = 'exterior', cur = -1, token = 0, busy = false, usedKeyboard = false;
  const alive = t => t === token;

  /* ---------------- state / UI helpers ---------------- */
  function setState(s) {
    state = s; stage.dataset.state = s; stage.dataset.floor = String(cur);
    lab.dataset.stage = s === 'exterior' ? '0' : (s === 'floor' ? String(cur + 1) : 'L');
  }
  const setDip = on => dip.classList.toggle('is-on', on);
  function setRail(i) { rail.querySelectorAll('button').forEach((b, k) => b.classList.toggle('is-active', k === i)); }
  function showPortal(i) {
    const f = FLOORS[i];
    portalTitle.textContent = f.name; portalLink.href = f.href;
    if (f.external) { portalLink.target = '_blank'; portalLink.rel = 'noopener'; } else { portalLink.removeAttribute('target'); portalLink.removeAttribute('rel'); }
    portal.classList.add('is-visible'); portal.setAttribute('aria-hidden', 'false'); portalLink.tabIndex = 0;
  }
  function hidePortal() { portal.classList.remove('is-visible'); portal.setAttribute('aria-hidden', 'true'); portalLink.tabIndex = -1; }
  async function loadImg(img, src) { if (img.getAttribute('src') !== src) img.src = src; try { await img.decode(); } catch (e) { /* ignore */ } }
  const setPos = f => [plate, dollyLayer].forEach(l => l.style.setProperty('--pos', f.pos || '50% 50%'));

  /* ---------------- lobby sequence (scroll-scrubbed canvas frames) ---------------- */
  const seq = { imgs: new Array(SEQ_COUNT), ok: new Array(SEQ_COUNT).fill(false), end: new Image(), endOk: false, q: 0, qt: 0, started: false, auto: false, raf: 0, last: 0, dirty: true };
  seq.end.onload = () => { seq.endOk = true; seq.dirty = true; drawSeq(); };
  function seqOrder() {                  // coarse → fine so any scroll position has a usable frame early
    const out = [], seen = new Set();
    [SEQ_COUNT - 1, 0].forEach(i => { out.push(i); seen.add(i); });
    for (let s = 32; s >= 1; s = s >> 1) for (let i = 0; i < SEQ_COUNT; i += s) if (!seen.has(i)) { seen.add(i); out.push(i); }
    return out;
  }
  function seqLoad() {
    if (seq.started) return; seq.started = true;
    seq.end.src = PATH.lobbyEnd;
    const order = seqOrder(); let k = 0;
    const next = () => {
      if (k >= order.length) return;
      const i = order[k++], im = new Image(); im.decoding = 'async';
      im.onload = () => { seq.ok[i] = true; seq.dirty = true; if (state === 'lobby' || (state === 'floor' && cur === 0)) drawSeq(); next(); };
      im.onerror = next; im.src = PATH.seq(i); seq.imgs[i] = im;
    };
    for (let n = 0; n < (lightNet() ? 2 : 4); n++) next();       // a few parallel streams
  }
  function nearest(i) { for (let d = 0; d < SEQ_COUNT; d++) { if (i - d >= 0 && seq.ok[i - d]) return i - d; if (i + d < SEQ_COUNT && seq.ok[i + d]) return i + d; } return -1; }
  function seqSize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 780 ? 1.5 : 1.75);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (seqCv.width !== w || seqCv.height !== h) { seqCv.width = w; seqCv.height = h; seq.dirty = true; }
  }
  function cover(img, a) {
    const cw = seqCv.width, ch = seqCv.height, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return; const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    seqCtx.globalAlpha = a; seqCtx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function drawSeq() {
    seqSize(); if (!seq.dirty) return; seq.dirty = false;
    const f = clamp01(seq.q) * (SEQ_COUNT - 1), i0 = Math.floor(f), a = f - i0;
    const A = nearest(i0); seqCtx.globalCompositeOperation = 'source-over'; seqCtx.clearRect(0, 0, seqCv.width, seqCv.height);
    if (A >= 0) cover(seq.imgs[A], 1);
    if (a > 0.03 && i0 + 1 < SEQ_COUNT) { const B = nearest(i0 + 1); if (B >= 0 && B !== A) cover(seq.imgs[B], a); }
    const e = smooth(0.9, 1.0, seq.q);                          // settle onto the hi-res end still
    if (e > 0 && seq.endOk) cover(seq.end, e);
    seqCtx.globalAlpha = 1;
  }
  function setSeq(q) { seq.q = clamp01(q); seq.dirty = true; drawSeq(); }
  addEventListener('resize', () => { seq.dirty = true; if (state === 'lobby' || (state === 'floor' && cur === 0)) drawSeq(); }, { passive: true });

  function seqLoop(now) {
    if (state !== 'lobby') { seq.raf = 0; return; }
    const dt = seq.last ? Math.min(.08, (now - seq.last) / 1000) : 0; seq.last = now;
    if (seq.auto) seq.qt = clamp01(seq.qt + dt * 0.12);
    const diff = seq.qt - seq.q;
    if (Math.abs(diff) > 0.0002) { seq.q += diff * Math.min(1, dt * 7); seq.dirty = true; drawSeq(); }
    if (seq.qt >= 0.999 && seq.q >= 0.996 && !busy) { setSeq(1); arriveLobbyEnd(); return; }
    seq.raf = requestAnimationFrame(seqLoop);
  }
  const startSeqLoop = () => { if (!seq.raf) { seq.last = 0; seq.raf = requestAnimationFrame(seqLoop); } };
  function seqNudge(d) {
    if (busy) return; seq.auto = false;
    if (seq.qt <= 0.001 && d < -0.004) { goExterior(); return; }       // scrolling back past the start returns to the 3D approach
    seq.qt = clamp01(seq.qt + d);
  }

  /* ---------------- floor assets warm-up ---------------- */
  const warmed = new Set();
  function warm(i) {
    if (i < 1 || i >= FLOORS.length || warmed.has(i) || lightNet()) return; warmed.add(i);
    const f = FLOORS[i];
    [PATH.plate(f.key, 'start'), PATH.plate(f.key, 'end')].forEach(s => { const im = new Image(); im.decoding = 'async'; im.src = s; });
    if (canVideo()) { try { fetch(PATH.dolly(f.key), { cache: 'force-cache', priority: 'low' }).catch(() => {}); } catch (e) {} }
  }
  rail.addEventListener('pointerover', e => { const b = e.target.closest('button'); if (b) warm(+b.dataset.stageJump - 1); });

  /* ---------------- video with watchdog ---------------- */
  function playClip(v, src, onStart) {
    return new Promise(resolve => {
      let done = false, started = false, timer;
      const finish = ok => { if (done) return; done = true; clearTimeout(timer); ['ended', 'error', 'playing'].forEach(ev => v.removeEventListener(ev, h[ev])); resolve(ok); };
      const h = { playing: () => { if (!started) { started = true; clearTimeout(timer); onStart && onStart(); } }, ended: () => finish(true), error: () => finish(false) };
      Object.keys(h).forEach(ev => v.addEventListener(ev, h[ev]));
      timer = setTimeout(() => { if (!started) { videoBroken = true; finish(false); } }, WATCHDOG_MS);
      v.cancelSkip = () => finish(false);
      v.muted = true; v.playsInline = true; v.src = src; v.load();
      const p = v.play(); if (p && p.catch) p.catch(() => { videoBroken = true; finish(false); });
    });
  }
  function stopClip(v) { try { v.pause(); } catch (e) {} if (v.cancelSkip) { const c = v.cancelSkip; v.cancelSkip = null; c(); } }
  function clearClip(v) { stopClip(v); v.removeAttribute('src'); try { v.load(); } catch (e) {} }

  /* ---------------- exterior: 3D night approach → doors open ---------------- */
  const END_U = 0.10;                    // path position: doors open, camera frames the lobby start still exactly (matte inside the 3D scene)
  let extP = 0, extReady = false, extLoading = null, extFailed = false, extAuto = false, extRaf = 0, extLast = 0;
  const hasWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
  function loadExterior() {
    if (extLoading) return extLoading;
    extLoading = new Promise(resolve => {
      let t;
      const fin = ok => { clearTimeout(t); removeEventListener('exterior-ready', onOk); removeEventListener('exterior-fail', onNg); if (!ok) extFailed = true; extReady = ok; if (loaderEl) setTimeout(() => loaderEl.classList.add('is-done'), ok ? 450 : 0); resolve(ok); };
      const onOk = () => fin(true), onNg = () => fin(false);
      addEventListener('exterior-ready', onOk); addEventListener('exterior-fail', onNg);
      t = setTimeout(() => fin(false), 40000);
      import('./exterior.js').catch(() => fin(false));
    });
    return extLoading;
  }
  function applyExt() {
    if (window.Exterior) window.Exterior.setProgress(extP * END_U); else window.__extU = extP * END_U;
    if (extCopy) extCopy.style.opacity = extP > 0.05 ? '0' : '';
  }
  function extLoop(now) {
    if (state !== 'exterior') { extRaf = 0; return; }
    const dt = extLast ? Math.min(.08, (now - extLast) / 1000) : 0; extLast = now;
    if (extAuto && extReady) { extP = Math.min(1, extP + dt * 0.14); applyExt(); }
    if (extReady && extP >= 0.999 && window.Exterior && window.Exterior.rendered() >= END_U * 0.992 && !busy) handoffToLobby();
    extRaf = requestAnimationFrame(extLoop);
  }
  const startExtLoop = () => { if (!extRaf) { extLast = 0; extRaf = requestAnimationFrame(extLoop); } };
  function extNudge(d) { if (!extReady || busy) return; extAuto = false; extP = Math.min(1, Math.max(0, extP + d)); applyExt(); }
  function toLobbyState(q) {
    cur = -1; seq.q = seq.qt = q || 0; seq.auto = false; seq.dirty = true; drawSeq();
    setState('lobby'); setRail(-1); hidePortal();
    history.replaceState(null, '', '#lobby');
    setTimeout(() => { if (state !== 'exterior') window.__extPaused = true; }, 1400);
    startSeqLoop();
  }
  function handoffToLobby() { if (busy) return; extAuto = false; toLobbyState(0); }       // seamless: frame 0 == the matte photo in the 3D scene
  async function goExterior() {
    if (busy || extFailed || !hasWebGL()) return; busy = true; token++;
    setDip(true); await wait(320);
    hidePortal(); setRail(-1); cur = -1;
    window.__extPaused = false; extP = 0.9; applyExt(); setState('exterior'); setDip(false);
    history.replaceState(null, '', location.pathname + location.search);
    busy = false; startExtLoop(); loadExterior().then(applyExt);
  }
  async function bootExterior() {
    if (!hasWebGL()) { extFailed = true; loaderEl && loaderEl.classList.add('is-done'); return toLobbyState(0); }
    startExtLoop();
    const ok = await loadExterior();
    if (!ok) { loaderEl && loaderEl.classList.add('is-done'); return toLobbyState(0); }
    applyExt(); seqLoad();                                          // pull the lobby frames in while the visitor scrolls the approach
  }

  /* ---------------- lobby end = 1F ABOUT ---------------- */
  function arriveLobbyEnd() {
    busy = false; cur = 0; seq.q = seq.qt = 1; seq.dirty = true; drawSeq();
    setState('floor'); showPortal(0); setRail(0);
    history.replaceState(null, '', '#about');
    window.__extPaused = true;
  }
  async function goLobbyEnd() {                                     // jump straight to ABOUT (from a deep link or from another floor)
    const t = ++token; busy = true; hidePortal();
    seqLoad(); if (!seq.endOk) await new Promise(r => { const iv = setInterval(() => { if (seq.endOk) { clearInterval(iv); r(); } }, 40); setTimeout(() => { clearInterval(iv); r(); }, 2500); });
    if (state !== 'exterior' && state !== 'lobby') { setDip(true); await wait(300); if (!alive(t)) return; }
    stopClip(dolly); dollyLayer.classList.remove('is-on'); cab.className = 'cab';
    window.__extPaused = true; arriveLobbyEnd(); setDip(false);
  }

  /* ---------------- elevator (cab POV) + floor dolly (2F+) ---------------- */
  async function goFloor(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= FLOORS.length) return;
    if (i === 0) return goLobbyEnd();
    if (busy && !opts.force) return;
    const t = ++token; busy = true; hidePortal();
    const f = FLOORS[i]; cur = i; setRail(i);
    warm(i); warm(i + 1);
    history.replaceState(null, '', '#' + f.key);
    const reset = () => {
      setPos(f); plate.classList.add('no-fade'); plate.classList.remove('is-end');
      clearClip(dolly); dollyLayer.classList.remove('is-on');
      cab.className = 'cab'; digits.textContent = '00';
    };
    const loadPlates = () => Promise.all([loadImg(plateA, PATH.plate(f.key, 'start')), loadImg(plateB, PATH.plate(f.key, 'end'))]);

    if (opts.instant) {                                      // deep link / skip → final frame
      reset(); await loadPlates(); if (!alive(t)) return;
      plate.classList.add('is-end'); setDip(false); window.__extPaused = true; return arrive(i, t);
    }

    // 1) dip → inside the cab, doors closed
    setDip(true); await wait(300); if (!alive(t)) return;
    reset(); await loadPlates(); if (!alive(t)) return;
    setState('elevator'); setDip(false);
    plate.classList.remove('no-fade');

    // 2) ride: indicator counts up, subtle shake
    cab.classList.add('is-riding');
    const n = i + 1, step = Math.max(120, RIDE_MS / n);
    for (let k = 1; k <= n; k++) { await wait(step); if (!alive(t)) return; digits.textContent = String(k).padStart(2, '0'); }
    cab.classList.remove('is-riding'); cab.classList.add('is-arrived');
    await wait(450); if (!alive(t)) return;

    // 3) doors open — the floor footage starts behind them
    cab.classList.add('is-open');
    let played = false;
    const clip = canVideo() ? playClip(dolly, PATH.dolly(f.key), () => dollyLayer.classList.add('is-on')).then(ok => { played = ok; return ok; }) : Promise.resolve(false);
    await wait(OPEN_MS - 200); if (!alive(t)) return;

    // 4) step out: the cab recedes around the viewer
    cab.classList.add('is-leaving');
    const ok = await Promise.race([clip, wait(3600).then(() => 'timeout')]); if (!alive(t)) return;
    if (ok !== true && !played) { plate.classList.add('is-end'); await wait(1300); if (!alive(t)) return; }
    arrive(i, t);
  }

  function arrive(i, t) {
    if (!alive(t)) return;
    setState('floor'); showPortal(i); setRail(i); busy = false;
    if (usedKeyboard) setTimeout(() => portalLink.focus({ preventScroll: true }), 700);
  }
  function skip() { if (state === 'elevator') goFloor(cur, { instant: true, force: true }); }

  /* ---------------- input ---------------- */
  // Scroll drives: the 3D approach, then the lobby sequence. At the lobby end the page stops scrolling — pick a floor on the rail.
  window.addEventListener('wheel', e => {
    if (!contact.hidden) return;
    e.preventDefault();
    if (state === 'exterior') extNudge(e.deltaY / 1500);
    else if (state === 'lobby') seqNudge(e.deltaY / 1900);
  }, { passive: false });
  let ly = null;
  stage.addEventListener('touchstart', e => { ly = e.target.closest('button,a,.contactLayer') ? null : e.touches[0].clientY; if (state === 'elevator') skip(); }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (ly == null) return; const y = e.touches[0].clientY;
    if (state === 'exterior') extNudge((ly - y) / (innerHeight * 0.9)); else if (state === 'lobby') seqNudge((ly - y) / (innerHeight * 1.2));
    ly = y;
  }, { passive: true });
  stage.addEventListener('touchend', () => { ly = null; }, { passive: true });
  stage.addEventListener('click', e => { if (state === 'elevator' && !e.target.closest('button,a')) skip(); });
  window.addEventListener('keydown', e => {
    usedKeyboard = true;
    if (!contact.hidden) { if (e.key === 'Escape') closeContact(); return; }
    const adv = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter';
    if (state === 'exterior') {
      if (adv) { if (e.target.closest && e.target.closest('button,a')) return; e.preventDefault(); if (extReady) extAuto = true; }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); extNudge(-0.15); }
      return;
    }
    if (state === 'lobby') {
      if (adv) { if (e.target.closest && e.target.closest('button,a')) return; e.preventDefault(); seq.auto = true; }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); seqNudge(-0.1); }
      return;
    }
    if (e.key === 'Escape' && state === 'elevator') { skip(); return; }
    if (/^[1-6]$/.test(e.key) && state === 'floor') jump(+e.key - 1);
  });
  window.addEventListener('pointerdown', () => { usedKeyboard = false; }, { passive: true });

  function jump(i) { if (state !== 'floor' || busy || i === cur) return; goFloor(i); }
  rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b) jump(+b.dataset.stageJump - 1); });
  $('brand').addEventListener('click', e => { e.preventDefault(); if (state !== 'exterior') goExterior(); });   // original: brand = #top

  /* ---------------- contact (original) ---------------- */
  let lastFocus = null;
  function openContact() { lastFocus = document.activeElement; contact.hidden = false; contact.querySelector('[data-contact-close]').focus(); }
  function closeContact() { contact.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  document.querySelector('[data-contact]').addEventListener('click', openContact);
  contact.querySelector('[data-contact-close]').addEventListener('click', closeContact);
  contact.addEventListener('click', e => { if (e.target === contact) closeContact(); });

  /* ---------------- boot ---------------- */
  const hash = location.hash.replace('#', '');
  const idx = FLOORS.findIndex(f => f.key === hash);
  seqSize();
  if (idx === 0) { loaderEl && loaderEl.classList.add('is-done'); setState('lobby'); goLobbyEnd(); }                    // #about → lobby end
  else if (idx > 0) { loaderEl && loaderEl.classList.add('is-done'); setState('lobby'); goFloor(idx, { instant: true, force: true }); }
  else if (hash === 'lobby') { loaderEl && loaderEl.classList.add('is-done'); seqLoad(); toLobbyState(0); }
  else { setState('exterior'); bootExterior(); }
  addEventListener('hashchange', () => {
    const k = location.hash.replace('#', ''); const j = FLOORS.findIndex(f => f.key === k);
    if (j >= 0 && j !== cur && state === 'floor') goFloor(j, { instant: j > 0, force: true });
  });
})();
