import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '@app/agent-markdown';
import { getStaticPages } from '@entities/page';
import { getPublishedPosts } from '@entities/post';

export const GET: APIRoute = async () => {
  return new Response(buildLlmsTxt(await getPublishedPosts(), await getStaticPages()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
