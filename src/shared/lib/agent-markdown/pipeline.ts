import type { Parent, Root, RootContent } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify, { type Options as StringifyOptions } from 'remark-stringify';
import { unified } from 'unified';
import { getFallback, type FallbackRegistry, type JsxProps } from './fallbacks';

export interface MdxToMarkdownOptions {
  /** Absolute URL of the HTML page. Relative links and images resolve against it. */
  pageUrl: string;
  /** Markdown fallbacks for MDX components, keyed by component name. */
  fallbacks?: FallbackRegistry;
  /** Called for components that have no fallback and no children (they are removed). */
  onWarning?: (message: string) => void;
}

const STRINGIFY_OPTIONS: StringifyOptions = {
  bullet: '-',
  emphasis: '_',
  strong: '*',
  fences: true,
  listItemIndent: 'one',
  rule: '-',
};

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter, ['yaml', 'toml']).use(remarkGfm);
// Stringify without remark-mdx: the tree holds no MDX nodes at that point,
// and the MDX extension would escape `<` and `{` in plain text.
const stringifier = unified().use(remarkGfm).use(remarkStringify, STRINGIFY_OPTIONS);

type JsxElement = MdxJsxFlowElement | MdxJsxTextElement;

const DROPPED_TYPES = new Set(['mdxjsEsm', 'yaml', 'toml', 'mdxFlowExpression', 'mdxTextExpression']);

function hasChildren(node: RootContent | Root): node is Parent & (RootContent | Root) {
  return 'children' in node && Array.isArray(node.children);
}

function isJsx(node: RootContent): node is JsxElement {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

/** Removes `import` / `export` statements, front matter, and `{expressions}` (including JSX comments). */
export function stripMdxEsm(tree: Root): void {
  const walk = (parent: Parent): void => {
    parent.children = parent.children.filter((child) => !DROPPED_TYPES.has(child.type));
    for (const child of parent.children) if (hasChildren(child)) walk(child);
  };
  walk(tree);
}

function readProps(element: JsxElement): JsxProps {
  const props: Record<string, string | true> = {};
  for (const attribute of element.attributes) {
    if (attribute.type !== 'mdxJsxAttribute') continue;
    const { value } = attribute;
    if (value === null || value === undefined) props[attribute.name] = true;
    else if (typeof value === 'string') props[attribute.name] = value;
    else props[attribute.name] = value.value;
  }
  return props;
}

/**
 * `<Callout>text</Callout>` on one line parses as an inline element inside a paragraph.
 * When the element is the only content of that paragraph, treat it as a block element.
 */
function liftSoleJsx(node: RootContent): RootContent {
  if (node.type !== 'paragraph') return node;
  const meaningful = node.children.filter((child) => !(child.type === 'text' && child.value.trim() === ''));
  const [only] = meaningful;
  if (meaningful.length !== 1 || only?.type !== 'mdxJsxTextElement') return node;
  const lifted: MdxJsxFlowElement = {
    type: 'mdxJsxFlowElement',
    name: only.name,
    attributes: only.attributes,
    children: only.children.length > 0 ? [{ type: 'paragraph', children: only.children }] : [],
  };
  return lifted;
}

/**
 * Replaces each JSX element with plain Markdown:
 * 1. a component with a registered fallback renders its own Markdown;
 * 2. an unknown component keeps only its children;
 * 3. a component with no children and no fallback is removed, with a warning.
 */
export function lowerJsx(tree: Root, fallbacks: FallbackRegistry = {}, onWarning?: (message: string) => void): void {
  const lowerElement = (element: JsxElement): RootContent[] => {
    const children = element.children as RootContent[];
    if (element.name === null) return children; // fragment: <>...</>
    const fallback = getFallback(fallbacks, element.name);
    if (fallback) {
      return fallback({
        name: element.name,
        props: readProps(element),
        children,
        inline: element.type === 'mdxJsxTextElement',
      });
    }
    if (children.length > 0) return children;
    onWarning?.(`<${element.name} /> has no Markdown fallback and no children; removed from the Markdown copy.`);
    return [];
  };

  const walk = (parent: Parent): void => {
    const next: RootContent[] = [];
    for (const original of parent.children) {
      const child = liftSoleJsx(original);
      // Children first, so nested components are already plain Markdown.
      if (hasChildren(child)) walk(child);
      if (isJsx(child)) next.push(...lowerElement(child));
      else next.push(child);
    }
    parent.children = next as Parent['children'];
  };
  walk(tree);
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Resolves a relative URL against `base`. Absolute and protocol-relative URLs are returned unchanged. */
export function toAbsoluteUrl(url: string, base: string): string {
  if (url === '' || HAS_SCHEME.test(url) || url.startsWith('//')) return url;
  return new URL(url, base).href;
}

/** Makes link, image, and definition URLs absolute. */
export function absolutizeUrls(tree: Root, pageUrl: string): void {
  const walk = (node: Root | RootContent): void => {
    if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
      node.url = toAbsoluteUrl(node.url, pageUrl);
    }
    if (hasChildren(node)) for (const child of node.children) walk(child);
  };
  walk(tree);
}

/** Converts MDX source (for example `entry.body`) to clean Markdown for agents. */
export function mdxToMarkdown(source: string, options: MdxToMarkdownOptions): string {
  const tree = parser.parse(source);
  stripMdxEsm(tree);
  lowerJsx(tree, options.fallbacks, options.onWarning);
  absolutizeUrls(tree, options.pageUrl);
  return `${stringifier.stringify(tree).trim()}\n`;
}
