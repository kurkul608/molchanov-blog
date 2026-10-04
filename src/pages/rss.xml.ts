import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedPosts, postPath } from '@entities/post';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@shared/config';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site ?? SITE_URL,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: postPath(post.id),
      categories: [...post.data.tags],
    })),
    customData: '<language>en</language>',
  });
};
