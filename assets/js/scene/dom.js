/**
 * TESHIMA LAB Portfolio — DOM Reference Registry
 */
export const $ = (id) => document.getElementById(id);

export const stage = $('stage');
export const lab = $('lab');
export const plate = $('plate');
export const plateA = $('plateImg');
export const dollyLayer = $('dollyLayer');
export const dolly = $('dolly');
export const dip = $('dip');
export const portal = $('portal');
export const portalTitle = $('portalTitle');
export const portalLink = $('portalLink');
export const rail = $('rail');
export const heroVideo = $('heroVideo');
export const scrollCue = $('scrollCue');
export const cenotaph = $('cenotaph');
export const seqCv = $('seq');
export const seqCtx = seqCv ? seqCv.getContext('2d') : null;

// Plate layer 2 (end-frame still cross-fade)
export let plateB = null;
if (plateA && plate) {
  plateB = plateA.cloneNode();
  plateB.classList.add('b');
  plate.appendChild(plateB);
}

// Interactive Layers
export const stageHotspot = $('stageHotspot');
export const emailHotspot = $('emailHotspot');
export const headerCreditBtn = $('headerCreditBtn');
export const creditModal = $('creditModal');
export const creditModalClose = $('creditModalClose');
export const creditModalBackdrop = $('creditModalBackdrop');
export const atomLayer = $('atomLayer');
export const atomDollWrap = $('atomDollWrap');
export const atomDoll = $('atomDoll');
export const atomShadow = $('atomShadow');
export const atomBubble = $('atomBubble');
export const atomKeyword = $('atomKeyword');
export const atomCopyBtn = $('atomCopyBtn');
export const cipherModal = $('cipherModal');
export const cipherModalBackdrop = $('cipherModalBackdrop');
export const cipherForm = $('cipherForm');
export const keyInput = $('keyInput');
export const cipherError = $('cipherError');
export const cipherHintLink = $('cipherHintLink');
export const cipherHintModal = $('cipherHintModal');
export const cipherHintOkBtn = $('cipherHintOkBtn');
export const authCard = $('authCard');
export const halEyeFocal = $('halEyeFocal');
export const halEyeGreenGlow = $('halEyeGreenGlow');
export const halEyeImgGreen = $('halEyeImgGreen');
