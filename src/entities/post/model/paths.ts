import { absoluteUrl, toMarkdownPath } from '@shared/lib';
import type { Post, PostSummary } from './types';

export const BLOG_PATH = '/blog/';

export function postPath(slug: string): string {
  return `${BLOG_PATH}${slug}/`;
}

export function postMarkdownPath(slug: string): string {
  return toMarkdownPath(postPath(slug));
}

export function postUrl(slug: string): string {
  return absoluteUrl(postPath(slug));
}

export function toPostSummary(post: Post): PostSummary {
  const { title, description, published, updated, tags, pillar } = post.data;
  return { slug: post.id, href: postPath(post.id), title, description, published, updated, tags, pillar };
}

export function byPublishedDesc(a: Post, b: Post): number {
  return b.data.published.getTime() - a.data.published.getTime();
}
