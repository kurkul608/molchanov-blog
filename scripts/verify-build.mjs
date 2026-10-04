#!/usr/bin/env node
// Post-build checks for the Markdown for Agents feature (docs/design/markdown-for-agents.md, section 9).
// 1. Every HTML content page in dist/ has a matching .md file.
// 2. dist/llms.txt lists every published post.
// 3. Draft posts are absent from every output.
// 4. Required static files exist; the sitemap lists no .md or .txt URLs.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://molchanov.blog';
const errors = [];
const read = (path) => readFileSync(join(DIST, path), 'utf8');
const exists = (path) => existsSync(join(DIST, path));

for (const file of ['index.md', 'blog.md', 'llms.txt', 'llms-full.txt', 'robots.txt', 'rss.xml', 'sitemap-index.xml', '_headers', '_routes.json', '404.html']) {
  if (!exists(file)) errors.push(`missing dist/${file}`);
}

// Front matter of the source posts: find drafts.
const POSTS_DIR = 'src/content/posts';
const posts = readdirSync(POSTS_DIR)
  .filter((name) => /\.mdx?$/.test(name))
  .map((name) => {
    const source = readFileSync(join(POSTS_DIR, name), 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    return { slug: name.replace(/\.mdx?$/, ''), draft: /^draft:\s*true\s*$/m.test(frontmatter) };
  });

const llms = exists('llms.txt') ? read('llms.txt') : '';
const outputs = ['llms.txt', 'llms-full.txt', 'rss.xml', 'blog.md', 'index.md']
  .filter(exists)
  .map((file) => [file, read(file)]);
const sitemaps = readdirSync(DIST).filter((name) => /^sitemap.*\.xml$/.test(name));

for (const { slug, draft } of posts) {
  const url = `${SITE}/blog/${slug}`;
  if (draft) {
    if (exists(`blog/${slug}`) || exists(`blog/${slug}.md`)) errors.push(`draft "${slug}" is in dist/blog/`);
    for (const [file, text] of outputs) if (text.includes(`${url}/`) || text.includes(`${url}.md`)) errors.push(`draft "${slug}" is listed in ${file}`);
    for (const file of sitemaps) if (read(file).includes(url)) errors.push(`draft "${slug}" is in ${file}`);
  } else {
    if (!exists(`blog/${slug}/index.html`)) errors.push(`missing dist/blog/${slug}/index.html`);
    if (!exists(`blog/${slug}.md`)) errors.push(`missing dist/blog/${slug}.md`);
    if (!llms.includes(`${url}.md`)) errors.push(`llms.txt does not list "${slug}"`);
  }
}

// Every HTML page except 404 has a Markdown copy: /a/b/index.html -> /a/b.md, /index.html -> /index.md.
const walk = (dir) =>
  readdirSync(join(DIST, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(path) : [path];
  });
for (const file of walk('')) {
  if (!file.endsWith('index.html') || file.startsWith('_astro/')) continue;
  const dir = file.slice(0, -'index.html'.length).replace(/\/$/, '');
  if (dir === '404') continue;
  const markdown = dir === '' ? 'index.md' : `${dir}.md`;
  if (!exists(markdown)) errors.push(`dist/${file} has no Markdown copy (expected dist/${markdown})`);
}

for (const file of sitemaps) {
  if (/<loc>[^<]*\.(md|txt)<\/loc>/.test(read(file))) errors.push(`${file} lists .md or .txt URLs`);
}

if (errors.length > 0) {
  console.error('verify-build failed:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`verify-build OK: ${posts.filter((p) => !p.draft).length} published post(s), ${posts.filter((p) => p.draft).length} draft(s) excluded.`);
