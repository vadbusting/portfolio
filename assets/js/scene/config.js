/**
 * TESHIMA LAB Portfolio — Scene Engine Configuration
 */
import { Device } from '../device.js';

export const FLOORS = Object.freeze([
  { key: 'about',        no: '1F',    name: 'ABOUT',        href: 'about.html',            lobby: true },
  { key: 'presentation', no: 'B1F',   name: 'PRESENTATION', href: 'presentation.html?v=130', pos: '50% 50%' },
  { key: 'lp',           no: 'B2F',   name: 'LP',           href: 'lp.html?v=130',           pos: '50% 50%' },
  { key: 'web',          no: 'B3F',   name: 'WEB',          href: 'https://www.originalsoccerball.com/', external: true, pos: '50% 50%' },
  { key: 'direction',    no: 'B4F',   name: 'DIRECTION',    href: 'https://new.express.adobe.com/webpage/XRy2MzIpmkxug', external: true, pos: '50% 50%' },
  { key: 'other',        no: 'B???F', name: 'OTHER',        href: 'other.html',            pos: '50% 50%', secret: true }
]);

export const PATH = Object.freeze({
  plate: (k, s) => s === 'start' ? 'assets/scenes/floor_start.webp' : `assets/scenes/${k}_${s}.webp`,
  dolly: (k) => Device.isMobileOrTablet() ? `assets/video/${k}_dolly_mobile.mp4` : `assets/video/${k}_dolly.mp4`,
  lobbyEnd: 'assets/scenes/lobby_end.webp',
  heroVideo: Device.isMobileOrTablet() ? 'assets/video/hero_entrance_mobile.mp4?v=130' : 'assets/video/hero_entrance.mp4?v=130'
});

export const MASTER_W = 2752;
export const MASTER_H = 1536;

export const FLOOR_HOTSPOTS = Object.freeze({
  0: {
    x: 1452 / MASTER_W, y: 263 / MASTER_H, w: 965 / MASTER_W, h: 1051 / MASTER_H,
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
  },
  1: {
    x: 888 / MASTER_W, y: 334 / MASTER_H, w: 974 / MASTER_W, h: 571 / MASTER_H
  },
  2: {
    x: 1045 / MASTER_W, y: 670 / MASTER_H, w: 675 / MASTER_W, h: 430 / MASTER_H
  },
  3: {
    x: 642 / MASTER_W, y: 178 / MASTER_H, w: 1468 / MASTER_W, h: 826 / MASTER_H
  },
  4: {
    x: 896 / MASTER_W, y: 590 / MASTER_H, w: 1464 / MASTER_W, h: 494 / MASTER_H,
    clipPath: 'polygon(0.0% 39.7%, 32.8% 0.0%, 55.6% 9.7%, 88.1% 29.6%, 100.0% 41.7%, 76.8% 100.0%, 33.6% 62.0%)'
  },
  5: {
    x: 958 / MASTER_W, y: 330 / MASTER_H, w: 840 / MASTER_W, h: 840 / MASTER_H,
    clipPath: 'circle(50% at 50% 50%)',
    borderRadius: '50%'
  }
});

export const AUTH_CONFIG = Object.freeze({
  STORAGE_KEY: 'cenotaph_unlocked',
  VALID_KEYWORD: 'hungryart',
  EXPIRATION_MS: 30 * 24 * 60 * 60 * 1000 // 30 days
});

export const MAX_BLOB_CACHE = 2;
