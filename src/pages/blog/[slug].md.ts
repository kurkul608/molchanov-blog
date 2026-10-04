import type { APIRoute, GetStaticPaths } from 'astro';
import { buildPostMarkdown } from '@app/agent-markdown';
import { getPublishedPosts, type Post } from '@entities/post';

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = ({ props }) => {
  return new Response(buildPostMarkdown(props.post), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
