import { describe, expect, it, vi } from 'vitest';
import { onRequest, type MiddlewareContext } from './_middleware';

const MARKDOWN = '---\ntitle: Post\n---\n\n# Post\n\nBody.\n';

function setup(options: { accept?: string; method?: string; path?: string; markdownExists?: boolean; htmlType?: string }) {
  const { accept, method = 'GET', path = '/blog/post/', markdownExists = true, htmlType = 'text/html; charset=utf-8' } = options;
  const headers = new Headers();
  if (accept) headers.set('Accept', accept);
  const request = new Request(`https://molchanov.blog${path}`, { method, headers });
  const assetsFetch = vi.fn(async (input: Request | string | URL) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (markdownExists && url.pathname.endsWith('.md')) return new Response(MARKDOWN, { status: 200 });
    return new Response('Not found', { status: 404 });
  });
  const next = vi.fn(async () => new Response('<!doctype html><title>Post</title>', { headers: { 'Content-Type': htmlType } }));
  const context: MiddlewareContext = { request, env: { ASSETS: { fetch: assetsFetch } }, next };
  return { context, assetsFetch, next };
}

describe('functions/_middleware', () => {
  it('serves Markdown when the client prefers it', async () => {
    const { context, assetsFetch, next } = setup({ accept: 'text/markdown' });
    const response = await onRequest(context);

    expect(next).not.toHaveBeenCalled();
    expect(String(assetsFetch.mock.calls[0]?.[0])).toBe('https://molchanov.blog/blog/post.md');
    expect(await response.text()).toBe(MARKDOWN);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(response.headers.get('Link')).toBe('<https://molchanov.blog/blog/post/>; rel="canonical"');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('Content-Signal')).toBe('search=yes, ai-input=yes, ai-train=yes');
    expect(response.headers.get('x-markdown-tokens')).toBe(String(Math.ceil(MARKDOWN.length / 4)));
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
  });

  it('returns headers without a body for HEAD', async () => {
    const { context } = setup({ accept: 'text/markdown', method: 'HEAD' });
    const response = await onRequest(context);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(await response.text()).toBe('');
  });

  it('falls back to HTML when there is no Markdown version', async () => {
    const { context, next } = setup({ accept: 'text/markdown', markdownExists: false });
    const response = await onRequest(context);
    expect(next).toHaveBeenCalledOnce();
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('adds Vary and Link to HTML responses', async () => {
    const { context, assetsFetch } = setup({ accept: 'text/html,application/xhtml+xml,*/*;q=0.8' });
    const response = await onRequest(context);
    expect(assetsFetch).not.toHaveBeenCalled();
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(response.headers.get('Link')).toBe('<https://molchanov.blog/blog/post.md>; rel="alternate"; type="text/markdown"');
    expect(await response.text()).toContain('<title>Post</title>');
  });

  it('maps the root to /index.md', async () => {
    const { context } = setup({ path: '/' });
    const response = await onRequest(context);
    expect(response.headers.get('Link')).toBe('<https://molchanov.blog/index.md>; rel="alternate"; type="text/markdown"');
  });

  it('passes through non-HTML responses, assets, and other methods', async () => {
    const nonHtml = setup({ htmlType: 'application/json' });
    expect((await onRequest(nonHtml.context)).headers.get('Vary')).toBeNull();

    const asset = setup({ path: '/favicon.svg', accept: 'text/markdown' });
    await onRequest(asset.context);
    expect(asset.assetsFetch).not.toHaveBeenCalled();
    expect(asset.next).toHaveBeenCalledOnce();

    const post = setup({ method: 'POST', accept: 'text/markdown' });
    await onRequest(post.context);
    expect(post.assetsFetch).not.toHaveBeenCalled();
  });
});
