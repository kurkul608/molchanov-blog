// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const NON_HTML = /\.(md|txt|xml)$/;

export default defineConfig({
  site: 'https://molchanov.blog',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      // Markdown copies, llms files, and feeds are not HTML pages.
      filter: (page) => !NON_HTML.test(new URL(page).pathname) && !page.endsWith('/404/'),
    }),
  ],
});
