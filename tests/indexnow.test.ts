import { describe, expect, it } from 'vitest';
import { buildPayload, diffManifests, htmlFileToUrl, INDEXNOW_KEY } from '../scripts/indexnow-lib.mjs';

describe('htmlFileToUrl', () => {
  it('maps the root page', () => {
    expect(htmlFileToUrl('index.html')).toBe('https://molchanov.blog/');
  });
  it('maps nested pages with a trailing slash', () => {
    expect(htmlFileToUrl('blog/my-post/index.html')).toBe('https://molchanov.blog/blog/my-post/');
  });
  it('skips 404, assets, and non-index files', () => {
    expect(htmlFileToUrl('404/index.html')).toBeNull();
    expect(htmlFileToUrl('_astro/x/index.html')).toBeNull();
    expect(htmlFileToUrl('404.html')).toBeNull();
    expect(htmlFileToUrl('about.md')).toBeNull();
  });
});

describe('diffManifests', () => {
  const next = { sha: 'b', pages: { 'https://molchanov.blog/': 'h1', 'https://molchanov.blog/about/': 'h2-new', 'https://molchanov.blog/now/': 'h3' } };

  it('submits every page without an old manifest', () => {
    expect(diffManifests(null, next)).toHaveLength(3);
  });

  it('submits new, changed, and removed pages only', () => {
    const prev = { sha: 'a', pages: { 'https://molchanov.blog/': 'h1', 'https://molchanov.blog/about/': 'h2-old', 'https://molchanov.blog/old/': 'h4' } };
    expect(diffManifests(prev, next)).toEqual([
      'https://molchanov.blog/about/',
      'https://molchanov.blog/now/',
      'https://molchanov.blog/old/',
    ]);
  });

  it('returns nothing when no page changed', () => {
    expect(diffManifests(next, next)).toEqual([]);
  });
});

describe('buildPayload', () => {
  it('points keyLocation at the key file', () => {
    const payload = buildPayload(['https://molchanov.blog/']);
    expect(payload.host).toBe('molchanov.blog');
    expect(payload.keyLocation).toBe(`https://molchanov.blog/${INDEXNOW_KEY}.txt`);
  });
});
