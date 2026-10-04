import { absoluteUrl } from '@shared/lib';
import { mdxToMarkdown, renderAgentMarkdown } from '@shared/lib/agent-markdown';
import { mdxFallbacks } from '@shared/ui';
import { BLOG_PATH, postMarkdownPath, postUrl } from '../model/paths';
import type { Post } from '../model/types';

export interface AgentMarkdownContext {
  author: string;
  onWarning?: (message: string) => void;
}

/** Post body as clean Markdown, without the header. */
export function postBodyToMarkdown(post: Post, onWarning?: (message: string) => void): string {
  return mdxToMarkdown(post.body ?? '', {
    pageUrl: postUrl(post.id),
    fallbacks: mdxFallbacks,
    onWarning: onWarning ?? ((message) => console.warn(`[agent-markdown] ${post.id}: ${message}`)),
  });
}

/** Post entry -> Markdown document served at `/blog/<slug>.md`. */
export function postToAgentMarkdown(post: Post, { author, onWarning }: AgentMarkdownContext): string {
  const { title, description, published, updated, tags } = post.data;
  return renderAgentMarkdown({
    frontmatter: {
      title,
      description,
      url: postUrl(post.id),
      author,
      published,
      updated: updated ?? published,
      tags,
    },
    title,
    body: postBodyToMarkdown(post, onWarning),
  });
}

/** One Markdown list line that links to the post's Markdown copy. */
export function postListItem(post: Post): string {
  return `- [${post.data.title}](${absoluteUrl(postMarkdownPath(post.id))}): ${post.data.description}`;
}

/** Post list served at `/blog.md`. */
export function postsToListMarkdown(posts: readonly Post[], { author }: AgentMarkdownContext): string {
  const body = posts.length > 0 ? posts.map(postListItem).join('\n') : 'No posts yet.';
  return renderAgentMarkdown({
    frontmatter: {
      title: 'Blog',
      description: `All posts by ${author}, newest first.`,
      url: absoluteUrl(BLOG_PATH),
      author,
    },
    title: 'Blog',
    body,
  });
}
