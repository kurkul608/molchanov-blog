import type { FallbackRegistry } from '@shared/lib/agent-markdown';
import { Callout, calloutMarkdown } from './callout';

/**
 * Components available in every MDX file without an import.
 * Every entry needs a Markdown fallback in `mdxFallbacks` (a unit test checks this).
 */
export const mdxComponents = {
  Callout,
} as const;

export const mdxFallbacks: FallbackRegistry = {
  Callout: calloutMarkdown,
};
