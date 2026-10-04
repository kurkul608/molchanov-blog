// Cloudflare Pages middleware: Markdown content negotiation for HTML routes.
// See docs/design/markdown-for-agents.md, section 7.
import { appendHeaderToken, markdownHeaders, prefersMarkdown, SITE_URL, toMarkdownPath } from './lib/negotiation';

/** The subset of the Pages Functions context this middleware uses. */
export interface MiddlewareContext {
  request: Request;
  env: { ASSETS: { fetch: (input: Request | string | URL, init?: RequestInit) => Promise<Response> } };
  next: () => Promise<Response>;
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const { request, env, next } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const url = new URL(request.url);
  const markdownPath = toMarkdownPath(url.pathname);
  if (!markdownPath) return next();

  if (prefersMarkdown(request.headers.get('Accept'))) {
    const asset = await env.ASSETS.fetch(new URL(markdownPath, url.origin));
    if (asset.ok) {
      const body = await asset.text();
      return new Response(request.method === 'HEAD' ? null : body, {
        status: 200,
        headers: markdownHeaders(markdownPath, body),
      });
    }
    // No Markdown version for this page: fall through to HTML.
  }

  const response = await next();
  const type = response.headers.get('Content-Type') ?? '';
  if (!type.includes('text/html')) return response;

  const withHeaders = new Response(response.body, response);
  appendHeaderToken(withHeaders.headers, 'Vary', 'Accept');
  withHeaders.headers.append('Link', `<${SITE_URL}${markdownPath}>; rel="alternate"; type="text/markdown"`);
  return withHeaders;
}
