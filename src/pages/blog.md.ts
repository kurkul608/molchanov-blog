import type { APIRoute } from 'astro';
import { buildBlogMarkdown } from '@app/agent-markdown';
import { getPublishedPosts } from '@entities/post';

export const GET: APIRoute = async () => {
  return new Response(buildBlogMarkdown(await getPublishedPosts()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
