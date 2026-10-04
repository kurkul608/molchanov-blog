import type { CollectionEntry } from 'astro:content';

export type Pillar = CollectionEntry<'posts'>['data']['pillar'];

export const PILLAR_LABELS: Readonly<Record<Pillar, string>> = {
  'ai-engineering': 'AI engineering',
  'frontend-at-scale': 'Frontend at scale',
  'frontend-to-ai': 'Frontend to AI',
};
