import { getCollection } from 'astro:content';
import { byPublishedDesc } from './paths';
import type { Post } from './types';

/** Drafts are visible in development only. Production builds never include them. */
export function isPublished(post: Post): boolean {
  return import.meta.env.DEV || !post.data.draft;
}

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isPublished);
  return posts.sort(byPublishedDesc);
}
