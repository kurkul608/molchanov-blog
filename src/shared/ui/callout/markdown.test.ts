import { describe, expect, it } from 'vitest';
import { mdxToMarkdown } from '@shared/lib/agent-markdown';
import { calloutMarkdown } from './markdown';

const options = { pageUrl: 'https://molchanov.blog/', fallbacks: { Callout: calloutMarkdown } };

describe('calloutMarkdown', () => {
  it('renders a note as a labeled blockquote', () => {
    expect(mdxToMarkdown('<Callout type="note">text</Callout>', options)).toBe('> **Note:** text\n');
  });

  it('uses the type label and keeps later paragraphs', () => {
    const source = '<Callout type="warning">\n\nFirst.\n\nSecond.\n\n</Callout>';
    expect(mdxToMarkdown(source, options)).toBe('> **Warning:** First.\n>\n> Second.\n');
  });

  it('prefers an explicit title and defaults unknown types to note', () => {
    expect(mdxToMarkdown('<Callout title="Heads up">x</Callout>', options)).toBe('> **Heads up:** x\n');
    expect(mdxToMarkdown('<Callout type="odd">x</Callout>', options)).toBe('> **Note:** x\n');
  });
});
