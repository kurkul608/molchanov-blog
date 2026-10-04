// Pure helpers for IndexNow submission (see docs/design/indexnow.md).
import { createHash } from 'node:crypto';

export const SITE = 'https://molchanov.blog';
export const HOST = 'molchanov.blog';
export const INDEXNOW_KEY = '9d0f6e5695b8bf08f1232cd5f8a22f1b';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** dist-relative HTML file -> public page URL, or null when the file is not a page. */
export function htmlFileToUrl(file) {
  if (!file.endsWith('index.html') || file.startsWith('_astro/')) return null;
  const dir = file.slice(0, -'index.html'.length).replace(/\/$/, '');
  if (dir === '404') return null;
  return dir === '' ? `${SITE}/` : `${SITE}/${dir}/`;
}

export function hashContent(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * URLs to submit: new pages, changed pages, and removed pages.
 * Without an old manifest (first deploy), every page is submitted.
 */
export function diffManifests(oldManifest, newManifest) {
  const next = newManifest.pages;
  if (!oldManifest || !oldManifest.pages) return Object.keys(next).sort();
  const prev = oldManifest.pages;
  const changed = Object.keys(next).filter((url) => prev[url] !== next[url]);
  const removed = Object.keys(prev).filter((url) => !(url in next));
  return [...changed, ...removed].sort();
}

export function buildPayload(urlList) {
  return {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
    urlList,
  };
}
