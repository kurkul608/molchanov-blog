import { serializeFrontmatter, type Frontmatter } from './frontmatter';

export interface AgentMarkdownDocument {
  frontmatter: Frontmatter;
  /** Rendered as the H1. Post and page bodies start at H2. */
  title: string;
  body: string;
}

/** Joins a YAML header, an H1, and a Markdown body into one document. */
export function renderAgentMarkdown({ frontmatter, title, body }: AgentMarkdownDocument): string {
  const parts = [`---\n${serializeFrontmatter(frontmatter)}\n---`, `# ${title}`];
  const trimmed = body.trim();
  if (trimmed) parts.push(trimmed);
  return `${parts.join('\n\n')}\n`;
}

/** Rough token count, mirrors Cloudflare's `x-markdown-tokens`: `ceil(characters / 4)`. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
