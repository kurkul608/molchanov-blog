import type { APIRoute } from 'astro';
import { buildHomeMarkdown } from '@app/agent-markdown';
import { getPublishedPosts } from '@entities/post';

export const GET: APIRoute = async () => {
  return new Response(buildHomeMarkdown(await getPublishedPosts()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
