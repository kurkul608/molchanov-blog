import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Node, Parent } from 'unist';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { mdxComponents, mdxFallbacks } from '@shared/ui';

const CONTENT_DIR = fileURLToPath(new URL('../src/content', import.meta.url));
const parser = unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter, ['yaml']);

function listMdx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listMdx(path);
    return /\.mdx?$/.test(entry.name) ? [path] : [];
  });
}

/** Component names (capitalized JSX elements) used in a file. Lowercase names are HTML tags. */
function componentNames(source: string): Set<string> {
  const names = new Set<string>();
  const walk = (node: Node): void => {
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const name = (node as Node & { name: string | null }).name;
      if (name && /^[A-Z]/.test(name)) names.add(name);
    }
    if ('children' in node) for (const child of (node as Parent).children) walk(child);
  };
  walk(parser.parse(source));
  return names;
}

const files = listMdx(CONTENT_DIR);

describe('MDX fallback coverage', () => {
  it('finds content files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => [relative(CONTENT_DIR, file), file]))(
    'every component in %s has a Markdown fallback',
    (_name, file) => {
      const missing = [...componentNames(readFileSync(file, 'utf8'))].filter((name) => !Object.hasOwn(mdxFallbacks, name));
      expect(missing, `Add a Markdown fallback for: ${missing.join(', ')}`).toEqual([]);
    },
  );

  it('every global MDX component has a fallback', () => {
    for (const name of Object.keys(mdxComponents)) expect(Object.hasOwn(mdxFallbacks, name), name).toBe(true);
  });
});
