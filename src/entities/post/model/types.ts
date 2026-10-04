import type { CollectionEntry } from 'astro:content';
import type { Pillar } from '../config/pillars';

export type Post = CollectionEntry<'posts'>;

/** Plain post data for UI components. */
export interface PostSummary {
  slug: string;
  href: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date | undefined;
  tags: readonly string[];
  pillar: Pillar;
}
