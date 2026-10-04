import { absoluteUrl } from '@shared/lib';
import { mdxToMarkdown, renderAgentMarkdown } from '@shared/lib/agent-markdown';
import { mdxFallbacks } from '@shared/ui';
import { pageMarkdownPath, pageUrl } from '../model/paths';
import type { StaticPage } from '../model/types';

export interface PageMarkdownContext {
  author: string;
  onWarning?: (message: string) => void;
}

/** Static page entry -> Markdown document served at `/<id>.md`. */
export function pageToAgentMarkdown(page: StaticPage, { author, onWarning }: PageMarkdownContext): string {
  const { title, description, updated } = page.data;
  const url = pageUrl(page.id);
  return renderAgentMarkdown({
    frontmatter: { title, description, url, author, updated },
    title,
    body: mdxToMarkdown(page.body ?? '', {
      pageUrl: url,
      fallbacks: mdxFallbacks,
      onWarning: onWarning ?? ((message) => console.warn(`[agent-markdown] ${page.id}: ${message}`)),
    }),
  });
}

/** One Markdown list line that links to the page's Markdown copy. */
export function pageListItem(page: StaticPage): string {
  return `- [${page.data.title}](${absoluteUrl(pageMarkdownPath(page.id))}): ${page.data.description}`;
}
