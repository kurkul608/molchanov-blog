# Design: Markdown for Agents (free, site-level)

Status: accepted · Date: 2026-10-04

## 1. Problem

AI agents and AI search tools read web pages. HTML costs them many tokens (layout, scripts, navigation) and adds noise. Cloudflare has a paid feature, "Markdown for Agents" (Pro plan and up). When a client sends `Accept: text/markdown`, Cloudflare converts the HTML to Markdown on the fly.

We want the same result on the Free plan. Our content is already Markdown, so we can do it better than an HTML-to-Markdown converter: we serve the source, not a reconstruction.

## 2. Goals

1. Every content page has a clean Markdown version.
2. An agent can get it in three ways:
   - by URL (`/blog/<slug>.md`);
   - by content negotiation (`Accept: text/markdown` on the normal URL);
   - by discovery (`<link rel="alternate">`, HTTP `Link` header, `/llms.txt`).
3. Google never treats the Markdown copy as duplicate content.
4. Zero cost on the Free plan. No client JavaScript. No effect on Lighthouse scores.

## 3. Non-goals

- Converting arbitrary HTML to Markdown at request time.
- Serving Markdown for asset URLs (images, CSS, JS, feeds).
- Personalized or authenticated content.

## 4. Overview

```
                    build time (Astro)                         request time (Pages Functions)
 src/content/*.mdx ──► remark pipeline ──► dist/blog/<slug>.md      GET /blog/<slug>/
                    └► HTML pages       ──► dist/blog/<slug>/index.html   │
                    └► /llms.txt, /llms-full.txt                         ▼
                                                              functions/_middleware.ts
                                                              Accept prefers text/markdown?
                                                                yes ──► ASSETS.fetch(/blog/<slug>.md)
                                                                no  ──► next() (HTML) + Vary + Link
```

Two parts:

1. **Build time:** Astro writes a `.md` file next to every content page.
2. **Request time:** a Pages Functions middleware does content negotiation and adds headers. If the function is not deployed or fails, the `.md` URLs still work as static files.

## 5. URL scheme

| HTML page | Markdown version |
|-----------|------------------|
| `/` | `/index.md` |
| `/blog/` | `/blog.md` (post list) |
| `/blog/<slug>/` | `/blog/<slug>.md` |
| `/about/` | `/about.md` |
| `/now/` | `/now.md` |
| `/projects/` | `/projects.md` |

Rule: strip the trailing slash and append `.md`. The root maps to `/index.md`. This follows the llms.txt convention ("append `.md` to the page URL").

## 6. Build time

### 6.1 Content sources

- Posts: `posts` collection (`src/content/posts/*.mdx`).
- Static pages (`/about`, `/now`, `/projects`): a `pages` collection (`src/content/pages/*.mdx`). The HTML route and the Markdown endpoint both read the same entry. One source, two outputs.
- Lists (`/`, `/blog/`): generated from collection data.

### 6.2 MDX to clean Markdown

`entry.body` gives the raw MDX source. Raw MDX is not clean Markdown: it has `import` lines and JSX components. We transform it with a unified pipeline:

```
remark-parse → remark-mdx → remark-frontmatter
  → stripMdxEsm        remove import/export nodes
  → lowerJsx           replace each JSX element with its Markdown fallback
  → absolutizeUrls     make relative links and images absolute (https://molchanov.blog/...)
→ remark-gfm → remark-stringify
```

`lowerJsx` rules:

1. A component in the fallback registry renders its own Markdown. Example: `<Callout type="note">text</Callout>` becomes `> **Note:** text`.
2. An unknown component keeps only its children.
3. A component with no children and no fallback is removed. The build logs a warning.

The registry lives next to each component. When we add a component that can appear in posts, we add its Markdown fallback in the same slice. A unit test fails if an MDX component used in content has no fallback.

### 6.3 Output format

```markdown
---
title: "Why I'm moving from frontend to AI engineering"
description: "..."
url: https://molchanov.blog/blog/frontend-to-ai-engineering/
author: Petr Molchanov
published: 2026-10-20
updated: 2026-10-20
tags: [ai-engineering, typescript]
---

# Why I'm moving from frontend to AI engineering

<body>
```

- The YAML header carries the canonical HTML URL, so agents cite the HTML page.
- The H1 is added from `title`, because the post body starts at H2.

### 6.4 Endpoints

Astro static endpoints (prerendered to files in `dist/`):

| File | Output |
|------|--------|
| `src/pages/blog/[slug].md.ts` | `dist/blog/<slug>.md` |
| `src/pages/[page].md.ts` | `dist/about.md`, `dist/now.md`, `dist/projects.md` |
| `src/pages/index.md.ts` | `dist/index.md` |
| `src/pages/blog.md.ts` | `dist/blog.md` |
| `src/pages/llms.txt.ts` | `dist/llms.txt` |
| `src/pages/llms-full.txt.ts` | `dist/llms-full.txt` (all posts, newest first) |

### 6.5 `/llms.txt`

Follows https://llmstxt.org:

```markdown
# Petr Molchanov

> Frontend engineer moving into AI engineering. Writes about building AI tools in TypeScript, frontend performance, and the transition from frontend to AI engineering.

## Posts

- [Post title](https://molchanov.blog/blog/<slug>.md): one-line description

## About

- [About](https://molchanov.blog/about.md): background, skills, contact
- [Projects](https://molchanov.blog/projects.md): open-source work

## Optional

- [All posts in one file](https://molchanov.blog/llms-full.txt)
```

### 6.6 Discovery in HTML

The SEO head component adds on every page that has a Markdown version:

```html
<link rel="alternate" type="text/markdown" href="https://molchanov.blog/blog/<slug>.md" />
```

## 7. Request time: Pages Functions middleware

File: `functions/_middleware.ts` (Cloudflare Pages convention, outside `src/`).

### 7.1 Logic

```
onRequest(context):
  if method not in [GET, HEAD]           → next()
  mdPath = toMarkdownPath(url.pathname)  → null for assets and unknown shapes → next()
  if prefersMarkdown(Accept header):
     res = ASSETS.fetch(mdPath)
     if res.ok → return markdownResponse(res)
     else      → next()                   (no Markdown version: serve HTML)
  res = next()
  if res is HTML: add  Vary: Accept
                       Link: <mdUrl>; rel="alternate"; type="text/markdown"
  return res
```

### 7.2 `prefersMarkdown`

Parse `Accept` with q-values. Return true when `text/markdown` is present and its q is greater than or equal to the q of `text/html` (missing `text/html` counts as q=0). `*/*` alone returns false: browsers and generic clients get HTML.

| Accept | Result |
|--------|--------|
| `text/markdown` | Markdown |
| `text/markdown, text/html;q=0.9` | Markdown |
| `text/html, text/markdown;q=0.5` | HTML |
| `text/html,application/xhtml+xml,*/*;q=0.8` (browser) | HTML |
| `*/*` | HTML |

### 7.3 Markdown response headers

```
Content-Type: text/markdown; charset=utf-8
Vary: Accept
Link: <https://molchanov.blog/blog/<slug>/>; rel="canonical"
X-Robots-Tag: noindex
Content-Signal: search=yes, ai-input=yes, ai-train=yes
x-markdown-tokens: <estimate>
Cache-Control: public, max-age=0, must-revalidate
```

- `rel="canonical"` + `noindex` keep the Markdown copy out of Google's index, so there is no duplicate content.
- `x-markdown-tokens` mirrors Cloudflare's header. Estimate: `ceil(characters / 4)`.
- `Content-Signal` mirrors Cloudflare's Content Signals Policy. All three signals are `yes` (decided 2026-10-04).

### 7.4 Direct `.md` requests

Requests to `/blog/<slug>.md` do not need the function. `public/_headers` sets the same headers for static files:

```
/*.md
  Content-Type: text/markdown; charset=utf-8
  X-Robots-Tag: noindex
  Content-Signal: search=yes, ai-input=yes, ai-train=yes
/llms*.txt
  Content-Type: text/plain; charset=utf-8
```

The canonical `Link` header for direct `.md` hits comes from the YAML `url` field. `_headers` cannot compute it per file.

### 7.5 Function routing and quota

`public/_routes.json` limits the function to HTML routes, so asset requests never use the quota:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_astro/*", "/images/*", "/*.md", "/*.txt", "/*.xml", "/*.ico", "/*.png", "/*.svg", "/*.webp", "/*.woff2"]
}
```

Free plan: 100,000 function requests per day. That covers this blog with a large margin.

## 8. Code placement (Feature-Sliced Design)

| Path | Responsibility |
|------|----------------|
| `src/shared/lib/agent-markdown/` | MDX→Markdown pipeline, YAML header serializer, URL helpers, token estimate |
| `src/shared/lib/agent-markdown/fallbacks.ts` | Registry type and lookup for JSX fallbacks |
| `src/shared/ui/*/markdown.ts` | Markdown fallback next to each MDX-usable component |
| `src/entities/post/lib/to-agent-markdown.ts` | Post entry → Markdown document |
| `src/entities/page/lib/to-agent-markdown.ts` | Static page entry → Markdown document |
| `src/app/seo/` | `<link rel="alternate">` in the head component |
| `src/pages/**/*.md.ts`, `llms*.txt.ts` | Thin endpoints, call entity functions only |
| `functions/_middleware.ts` | Negotiation and headers; imports pure helpers from `functions/lib/` |
| `functions/lib/negotiation.ts` | `prefersMarkdown`, `toMarkdownPath` (pure, unit-tested) |

`functions/` cannot import from `src/` aliases at Pages build time, so the negotiation helpers live in `functions/lib/` and have their own tests.

## 9. Testing

Unit (Vitest):

1. `prefersMarkdown`: every row in the table in 7.2.
2. `toMarkdownPath`: root, trailing slash, no trailing slash, nested, asset paths (return null).
3. MDX pipeline: imports removed, known component uses its fallback, unknown component keeps children, relative URLs become absolute.
4. Fallback coverage: every JSX component used in `src/content/**` has a fallback.
5. Middleware with a mocked `ASSETS`: Markdown hit, Markdown miss falls back to HTML, HTML gets `Vary` and `Link`.

Build checks (part of `pnpm build`):

- Every post and page has a matching `.md` file in `dist/`.
- `dist/llms.txt` lists every published post.

After deploy (manual, once):

```sh
curl -sI -H "Accept: text/markdown" https://molchanov.blog/blog/<slug>/   # expect text/markdown
curl -sI https://molchanov.blog/blog/<slug>/                              # expect text/html + Vary + Link
curl -s  https://molchanov.blog/llms.txt
```

## 10. Open decisions

1. ~~`ai-train`~~ Decided 2026-10-04: `yes`. The goal is visibility.
2. **`llms-full.txt`**: keep it while it stays under ~500 KB; after that, split by pillar.

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Function quota exceeded | `_routes.json` excludes assets; static `.md` URLs work without the function |
| Markdown copy indexed by Google | `X-Robots-Tag: noindex` + canonical `Link`; `.md` files not in `sitemap.xml` |
| A new MDX component without a fallback leaks JSX into Markdown | Fallback coverage test fails the build |
| CDN caches the wrong variant | `Vary: Accept` on both variants; the function runs before the static cache for HTML routes |

## 12. Effort

About 3–4 hours, built as part of the initial scaffold.
