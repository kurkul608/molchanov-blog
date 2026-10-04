import { SITE_URL } from '@shared/config';

/** Resolves a site path (for example `/blog/`) to an absolute URL on the production domain. */
export function absoluteUrl(path: string, site: string = SITE_URL): string {
  return new URL(path, site).href;
}

/**
 * Maps an HTML page path to its Markdown copy:
 * strip the trailing slash and append `.md`. The root maps to `/index.md`.
 */
export function toMarkdownPath(htmlPath: string): string {
  const trimmed = htmlPath.replace(/\/+$/, '');
  return trimmed === '' ? '/index.md' : `${trimmed}.md`;
}
