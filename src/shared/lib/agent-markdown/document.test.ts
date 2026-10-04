import { describe, expect, it } from 'vitest';
import { estimateTokens, renderAgentMarkdown } from './document';
import { serializeFrontmatter } from './frontmatter';

describe('serializeFrontmatter', () => {
  it('writes strings, dates, and arrays, and skips undefined', () => {
    const yaml = serializeFrontmatter({
      title: "Why I'm moving: a note",
      url: 'https://molchanov.blog/blog/x/',
      published: new Date('2026-10-20T00:00:00Z'),
      updated: undefined,
      tags: ['ai-engineering', 'typescript'],
    });
    expect(yaml).toBe(
      [
        'title: "Why I\'m moving: a note"',
        'url: https://molchanov.blog/blog/x/',
        'published: 2026-10-20',
        'tags: [ai-engineering, typescript]',
      ].join('\n'),
    );
  });

  it('quotes values YAML would read as other types', () => {
    expect(serializeFrontmatter({ a: 'true', b: '2026', c: '#tag' })).toBe('a: "true"\nb: "2026"\nc: "#tag"');
  });
});

describe('renderAgentMarkdown', () => {
  it('adds the header and the H1', () => {
    const doc = renderAgentMarkdown({ frontmatter: { title: 'Hello' }, title: 'Hello', body: '## Part\n\nText.\n' });
    expect(doc).toBe('---\ntitle: Hello\n---\n\n# Hello\n\n## Part\n\nText.\n');
  });

  it('handles an empty body', () => {
    expect(renderAgentMarkdown({ frontmatter: { title: 'X' }, title: 'X', body: '' })).toBe('---\ntitle: X\n---\n\n# X\n');
  });
});

describe('estimateTokens', () => {
  it('is ceil(characters / 4)', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcde')).toBe(2);
  });
});
