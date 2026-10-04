import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '@app/agent-markdown';
import { getPublishedPosts } from '@entities/post';

export const GET: APIRoute = async () => {
  return new Response(buildLlmsFullTxt(await getPublishedPosts()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
