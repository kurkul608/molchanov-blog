import { describe, expect, it } from 'vitest';
import { appendHeaderToken, prefersMarkdown, toCanonicalUrl, toMarkdownPath } from './negotiation';

describe('prefersMarkdown', () => {
  it.each([
    ['text/markdown', true],
    ['text/markdown, text/html;q=0.9', true],
    ['text/html, text/markdown;q=0.5', false],
    ['text/html,application/xhtml+xml,*/*;q=0.8', false],
    ['*/*', false],
  ])('%s -> %s', (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });

  it('handles empty, equal-q, zero-q, and spacing cases', () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown('')).toBe(false);
    expect(prefersMarkdown('text/html;q=0.5, text/markdown;q=0.5')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0')).toBe(false);
    expect(prefersMarkdown(' Text/Markdown ; q=1 , text/html ; q=0.1')).toBe(true);
  });
});

describe('toMarkdownPath', () => {
  it('maps the root', () => {
    expect(toMarkdownPath('/')).toBe('/index.md');
  });

  it('maps paths with a trailing slash', () => {
    expect(toMarkdownPath('/blog/')).toBe('/blog.md');
    expect(toMarkdownPath('/about/')).toBe('/about.md');
  });

  it('maps paths without a trailing slash', () => {
    expect(toMarkdownPath('/about')).toBe('/about.md');
  });

  it('maps nested paths', () => {
    expect(toMarkdownPath('/blog/frontend-to-ai-engineering/')).toBe('/blog/frontend-to-ai-engineering.md');
  });

  it('returns null for assets and unknown shapes', () => {
    expect(toMarkdownPath('/favicon.svg')).toBeNull();
    expect(toMarkdownPath('/_astro/index.abc123.css')).toBeNull();
    expect(toMarkdownPath('/blog/post.md')).toBeNull();
    expect(toMarkdownPath('/rss.xml')).toBeNull();
    expect(toMarkdownPath('/llms.txt')).toBeNull();
    expect(toMarkdownPath('/blog//post/')).toBeNull();
    expect(toMarkdownPath('/_astro/')).toBeNull();
  });
});

describe('toCanonicalUrl', () => {
  it('maps Markdown paths back to HTML URLs', () => {
    expect(toCanonicalUrl('/index.md')).toBe('https://molchanov.blog/');
    expect(toCanonicalUrl('/blog.md')).toBe('https://molchanov.blog/blog/');
    expect(toCanonicalUrl('/blog/post.md')).toBe('https://molchanov.blog/blog/post/');
  });
});

describe('appendHeaderToken', () => {
  it('adds a token once', () => {
    const headers = new Headers({ Vary: 'Accept-Encoding' });
    appendHeaderToken(headers, 'Vary', 'Accept');
    appendHeaderToken(headers, 'Vary', 'accept');
    expect(headers.get('Vary')).toBe('Accept-Encoding, Accept');
  });
});
