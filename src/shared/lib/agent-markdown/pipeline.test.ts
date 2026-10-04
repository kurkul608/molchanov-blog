import { describe, expect, it, vi } from 'vitest';
import type { MarkdownFallback } from './fallbacks';
import { mdxToMarkdown, toAbsoluteUrl } from './pipeline';

const pageUrl = 'https://molchanov.blog/blog/example/';

const noteFallback: MarkdownFallback = ({ children }) => [
  { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'NOTE' }] }] },
  ...children,
];

describe('mdxToMarkdown', () => {
  it('removes import and export statements', () => {
    const source = [
      "import { Callout } from '@shared/ui';",
      'export const meta = { a: 1 };',
      '',
      '## Heading',
      '',
      'Text.',
    ].join('\n');
    const result = mdxToMarkdown(source, { pageUrl });
    expect(result).not.toContain('import');
    expect(result).not.toContain('export');
    expect(result).toBe('## Heading\n\nText.\n');
  });

  it('removes JSX comments and expressions', () => {
    const result = mdxToMarkdown('{/* hidden */}\n\nVisible {1 + 1} text.', { pageUrl });
    expect(result).toBe('Visible  text.\n');
  });

  it('uses the fallback of a known component', () => {
    const result = mdxToMarkdown('<Note>\n\nBody text.\n\n</Note>', {
      pageUrl,
      fallbacks: { Note: noteFallback },
    });
    expect(result).toBe('> NOTE\n\nBody text.\n');
  });

  it('passes props to the fallback', () => {
    const spy = vi.fn<MarkdownFallback>(() => []);
    mdxToMarkdown('<Box kind="tip" open level={2}>x</Box>', { pageUrl, fallbacks: { Box: spy } });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Box', props: { kind: 'tip', open: true, level: '2' } }),
    );
  });

  it('keeps only the children of an unknown component', () => {
    const result = mdxToMarkdown('<Unknown foo="bar">\n\nKept **text**.\n\n</Unknown>', { pageUrl });
    expect(result).toBe('Kept **text**.\n');
  });

  it('keeps children of an unknown inline component', () => {
    const result = mdxToMarkdown('Say <Highlight>hello</Highlight> now.', { pageUrl });
    expect(result).toBe('Say hello now.\n');
  });

  it('removes an empty unknown component and warns', () => {
    const onWarning = vi.fn();
    const result = mdxToMarkdown('Before.\n\n<Chart />\n\nAfter.', { pageUrl, onWarning });
    expect(result).toBe('Before.\n\nAfter.\n');
    expect(onWarning).toHaveBeenCalledOnce();
    expect(onWarning.mock.calls[0]?.[0]).toContain('Chart');
  });

  it('lowers nested components inside a fallback', () => {
    const result = mdxToMarkdown('<Note>\n\n<Unknown>inner</Unknown>\n\n</Note>', {
      pageUrl,
      fallbacks: { Note: noteFallback },
    });
    expect(result).toBe('> NOTE\n\ninner\n');
  });

  it('makes relative links and images absolute', () => {
    const source = [
      '[root](/about/) [sibling](./other/) [parent](../) [anchor](#part)',
      '',
      '![diagram](/images/diagram.png)',
      '',
      '[ref]: ./notes/',
      '',
      '[external](https://example.com/page) [mail](mailto:hi@example.com)',
    ].join('\n');
    const result = mdxToMarkdown(source, { pageUrl });
    expect(result).toContain('(https://molchanov.blog/about/)');
    expect(result).toContain('(https://molchanov.blog/blog/example/other/)');
    expect(result).toContain('(https://molchanov.blog/blog/)');
    expect(result).toContain('(https://molchanov.blog/blog/example/#part)');
    expect(result).toContain('(https://molchanov.blog/images/diagram.png)');
    expect(result).toContain('[ref]: https://molchanov.blog/blog/example/notes/');
    expect(result).toContain('(https://example.com/page)');
    expect(result).toContain('(mailto:hi@example.com)');
  });

  it('keeps GFM tables and fenced code', () => {
    const source = '| a | b |\n| - | - |\n| 1 | 2 |\n\n```ts\nconst x = <T,>(v: T) => v;\n```';
    const result = mdxToMarkdown(source, { pageUrl });
    expect(result).toContain('| a | b |');
    expect(result).toContain('```ts\nconst x = <T,>(v: T) => v;\n```');
  });
});

describe('toAbsoluteUrl', () => {
  it('leaves absolute and protocol-relative URLs alone', () => {
    expect(toAbsoluteUrl('https://a.dev/x', pageUrl)).toBe('https://a.dev/x');
    expect(toAbsoluteUrl('//cdn.dev/x', pageUrl)).toBe('//cdn.dev/x');
  });
});
