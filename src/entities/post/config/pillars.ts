import type { CollectionEntry } from 'astro:content';

export type Pillar = CollectionEntry<'posts'>['data']['pillar'];

export const PILLAR_LABELS: Readonly<Record<Pillar, string>> = {
  'multi-agent-systems': 'Multi-agent systems',
  'trustworthy-agents': 'Trustworthy agents',
  'fullstack-for-ai': 'Fullstack for AI',
};
