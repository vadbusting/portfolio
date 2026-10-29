/**
 * TESHIMA LAB Portfolio — In-memory Video Blob Cache
 * Protects iOS WebKit RAM via bounded cache eviction and revokeObjectURL.
 */
import { heroVideo, dolly } from './dom.js';
import { MAX_BLOB_CACHE } from './config.js';

export const videoBlobCache = new Map();
export const videoBlobPending = new Map();

export function storeVideoBlob(url, blobUrl) {
  if (videoBlobCache.size >= MAX_BLOB_CACHE) {
    for (const [cachedUrl, cachedBlob] of videoBlobCache.entries()) {
      if (heroVideo && heroVideo.src === cachedBlob) continue;
      if (dolly && dolly.src === cachedBlob) continue;
      try { URL.revokeObjectURL(cachedBlob); } catch (e) {}
      videoBlobCache.delete(cachedUrl);
      break;
    }
  }
  videoBlobCache.set(url, blobUrl);
}

export function preloadVideoBlob(url) {
  if (!url || videoBlobCache.has(url)) return Promise.resolve(videoBlobCache.get(url));
  if (videoBlobPending.has(url)) return videoBlobPending.get(url);
  const p = fetch(url, { cache: 'force-cache' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      storeVideoBlob(url, blobUrl);
      videoBlobPending.delete(url);
      return blobUrl;
    })
    .catch(() => {
      videoBlobPending.delete(url);
      return url;
    });
  videoBlobPending.set(url, p);
  return p;
}

export function getVideoSrc(url) {
  return videoBlobCache.get(url) || url;
}
