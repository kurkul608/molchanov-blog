#!/usr/bin/env node
// Post-build: writes dist/deploy-manifest.json with a content hash per HTML page.
// The IndexNow workflow compares the live manifest before and after a deploy.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashContent, htmlFileToUrl } from './indexnow-lib.mjs';

const DIST = 'dist';

const walk = (dir) =>
  readdirSync(join(DIST, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(path) : [path];
  });

const pages = {};
for (const file of walk('')) {
  const url = htmlFileToUrl(file);
  if (url) pages[url] = hashContent(readFileSync(join(DIST, file), 'utf8'));
}

const manifest = {
  // Cloudflare Pages sets CF_PAGES_COMMIT_SHA during the build.
  sha: process.env.CF_PAGES_COMMIT_SHA ?? 'local',
  pages,
};
writeFileSync(join(DIST, 'deploy-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`deploy-manifest OK: ${Object.keys(pages).length} page(s), sha ${manifest.sha}.`);
