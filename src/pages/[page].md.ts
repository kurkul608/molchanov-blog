import type { APIRoute, GetStaticPaths } from 'astro';
import { buildPageMarkdown } from '@app/agent-markdown';
import { getStaticPages, type StaticPage } from '@entities/page';

export const getStaticPaths = (async () => {
  const pages = await getStaticPages();
  return pages.map((page) => ({ params: { page: page.id }, props: { page } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: StaticPage }> = ({ props }) => {
  return new Response(buildPageMarkdown(props.page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
