import { AUTHOR } from '@entities/author';
import { pageListItem, pageToAgentMarkdown, type StaticPage } from '@entities/page';
import { postBodyToMarkdown, postListItem, postsToListMarkdown, postToAgentMarkdown, type Post } from '@entities/post';
import { SITE_DESCRIPTION, SITE_URL } from '@shared/config';
import { absoluteUrl } from '@shared/lib';
import { renderAgentMarkdown } from '@shared/lib/agent-markdown';

const context = { author: AUTHOR.name };

/** Pages listed under "About" in llms.txt, in this order. */
const ABOUT_PAGE_IDS = ['about', 'projects', 'now'] as const;

export const LATEST_POSTS_COUNT = 5;

export function buildPostMarkdown(post: Post): string {
  return postToAgentMarkdown(post, context);
}

export function buildPageMarkdown(page: StaticPage): string {
  return pageToAgentMarkdown(page, context);
}

export function buildBlogMarkdown(posts: readonly Post[]): string {
  return postsToListMarkdown(posts, context);
}

/** `/index.md`: short intro and the latest posts. */
export function buildHomeMarkdown(posts: readonly Post[]): string {
  const latest = posts.slice(0, LATEST_POSTS_COUNT);
  const links = AUTHOR.links.map((link) => `- [${link.label}](${link.href})`).join('\n');
  const body = [
    `${AUTHOR.tagline}. Based in ${AUTHOR.location}.`,
    '## Latest posts',
    latest.length > 0 ? latest.map(postListItem).join('\n') : 'No posts yet.',
    `All posts: ${absoluteUrl('/blog.md')}`,
    '## Profiles',
    links,
  ].join('\n\n');
  return renderAgentMarkdown({
    frontmatter: { title: AUTHOR.name, description: SITE_DESCRIPTION, url: `${SITE_URL}/`, author: AUTHOR.name },
    title: AUTHOR.name,
    body,
  });
}

function sortPages(pages: readonly StaticPage[]): StaticPage[] {
  const rank = (id: string) => {
    const index = (ABOUT_PAGE_IDS as readonly string[]).indexOf(id);
    return index === -1 ? ABOUT_PAGE_IDS.length : index;
  };
  return [...pages].sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

/** `/llms.txt`, following https://llmstxt.org. */
export function buildLlmsTxt(posts: readonly Post[], pages: readonly StaticPage[]): string {
  const sections = [
    `# ${AUTHOR.name}`,
    `> ${SITE_DESCRIPTION}`,
    `Every page has a Markdown copy: append \`.md\` to the page URL without the trailing slash (the home page is ${absoluteUrl('/index.md')}). Requests with \`Accept: text/markdown\` get Markdown on the normal URL.`,
    '## Posts',
    posts.length > 0 ? posts.map(postListItem).join('\n') : 'No posts yet.',
    '## About',
    sortPages(pages).map(pageListItem).join('\n'),
    '## Optional',
    [
      `- [All posts in one file](${absoluteUrl('/llms-full.txt')}): full text of every post, newest first`,
      `- [Post list](${absoluteUrl('/blog.md')}): every post with a one-line description`,
    ].join('\n'),
  ];
  return `${sections.join('\n\n')}\n`;
}

/** `/llms-full.txt`: the full Markdown of every post, newest first. */
export function buildLlmsFullTxt(posts: readonly Post[]): string {
  const header = [`# ${AUTHOR.name}: all posts`, `> ${SITE_DESCRIPTION}`].join('\n\n');
  if (posts.length === 0) return `${header}\n\nNo posts yet.\n`;
  const entries = posts.map((post) => {
    const { title, description, published, updated } = post.data;
    const meta = [
      `URL: ${absoluteUrl(`/blog/${post.id}/`)}`,
      `Published: ${published.toISOString().slice(0, 10)}`,
      updated ? `Updated: ${updated.toISOString().slice(0, 10)}` : null,
      `Description: ${description}`,
    ]
      .filter(Boolean)
      .join('\n');
    // Post bodies start at H2, so each post title is an H1, as in its own Markdown copy.
    return `# ${title}\n\n${meta}\n\n${postBodyToMarkdown(post).trim()}`;
  });
  return `${header}\n\n${entries.join('\n\n---\n\n')}\n`;
}
