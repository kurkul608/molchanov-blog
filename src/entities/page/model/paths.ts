import { absoluteUrl, toMarkdownPath } from '@shared/lib';

export function pagePath(id: string): string {
  return `/${id}/`;
}

export function pageMarkdownPath(id: string): string {
  return toMarkdownPath(pagePath(id));
}

export function pageUrl(id: string): string {
  return absoluteUrl(pagePath(id));
}
