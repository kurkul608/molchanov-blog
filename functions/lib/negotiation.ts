// Pure helpers for Markdown content negotiation. No imports from `src/`:
// Cloudflare Pages builds `functions/` on its own and does not know the `src/` aliases.

export const SITE_URL = 'https://molchanov.blog';
export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes';

interface MediaRange {
  type: string;
  q: number;
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(',')
    .map((part) => {
      const [rawType = '', ...params] = part.split(';');
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split('=').map((s) => s.trim());
        if (key?.toLowerCase() === 'q' && value !== undefined) {
          const parsed = Number.parseFloat(value);
          q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
        }
      }
      return { type: rawType.trim().toLowerCase(), q };
    })
    .filter((range) => range.type !== '');
}

function qualityOf(ranges: MediaRange[], type: string): number {
  return ranges.reduce((best, range) => (range.type === type ? Math.max(best, range.q) : best), 0);
}

/**
 * True when the client asks for `text/markdown` with a q-value greater than or equal to
 * the q-value of `text/html` (a missing `text/html` counts as q=0). Wildcards never select
 * Markdown, so browsers and generic clients (`* / *`) get HTML.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const ranges = parseAccept(accept);
  const markdown = qualityOf(ranges, 'text/markdown');
  if (markdown <= 0) return false;
  return markdown >= qualityOf(ranges, 'text/html');
}

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * Maps an HTML page path to its static Markdown copy.
 * `/` -> `/index.md`, `/blog/` -> `/blog.md`, `/blog/post/` -> `/blog/post.md`.
 * Returns null for assets (any path with a file extension), internal paths, and unknown shapes.
 */
export function toMarkdownPath(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return '/index.md';
  if (!pathname.startsWith('/')) return null;
  const segments = pathname.replace(/\/$/, '').split('/').slice(1);
  if (segments.length === 0 || !segments.every((segment) => SEGMENT.test(segment))) return null;
  return `/${segments.join('/')}.md`;
}

/** Canonical HTML URL for a Markdown path: `/blog/post.md` -> `https://molchanov.blog/blog/post/`. */
export function toCanonicalUrl(markdownPath: string): string {
  const base = markdownPath.replace(/\.md$/, '');
  return base === '/index' ? `${SITE_URL}/` : `${SITE_URL}${base}/`;
}

/** Rough token count, mirrors Cloudflare's `x-markdown-tokens`: `ceil(characters / 4)`. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function markdownHeaders(markdownPath: string, body: string): Headers {
  return new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    Vary: 'Accept',
    Link: `<${toCanonicalUrl(markdownPath)}>; rel="canonical"`,
    'X-Robots-Tag': 'noindex',
    'Content-Signal': CONTENT_SIGNAL,
    'x-markdown-tokens': String(estimateTokens(body)),
    'Cache-Control': 'public, max-age=0, must-revalidate',
  });
}

/** Adds a token to a comma-separated header (for example `Vary`) without duplicates. */
export function appendHeaderToken(headers: Headers, name: string, token: string): void {
  const current = headers.get(name);
  if (!current) {
    headers.set(name, token);
    return;
  }
  const tokens = current.split(',').map((t) => t.trim().toLowerCase());
  if (!tokens.includes(token.toLowerCase())) headers.set(name, `${current}, ${token}`);
}
