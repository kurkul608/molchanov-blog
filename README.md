# molchanov.blog

Personal technical blog of Petr Molchanov, an applied AI engineer with a fullstack background.
Live at https://molchanov.blog.

The site is static HTML with almost no JavaScript. Every page also has a clean Markdown copy for AI agents.

## Stack

- [Astro](https://astro.build) 7, static output
- React 19 components, rendered to static HTML (one client island: the theme toggle)
- MDX content collections
- TypeScript (strictest preset)
- Plain CSS: global design tokens plus CSS modules
- Vitest for unit tests
- Cloudflare Pages (static files plus one Pages Functions middleware)

## Layout (Feature-Sliced Design)

```
src/
  pages/      Astro routes and endpoints. Thin: fetch data, compose widgets.
  app/        Layout, global styles, SEO head + JSON-LD, analytics, llms.txt composition.
  widgets/    header, footer, post-list, author-card
  features/   theme-toggle
  entities/   post, page, author
  shared/     config, lib (agent-markdown pipeline, url, date), ui (Callout, MDX registry)
  content/    posts/*.mdx, pages/*.mdx (schema in src/content.config.ts)
functions/    Cloudflare Pages middleware (Markdown content negotiation)
tests/        Cross-cutting tests (MDX fallback coverage)
scripts/      check-no-cyrillic.mjs, verify-build.mjs
```

Imports go down only: `pages -> app -> widgets -> features -> entities -> shared`.
Each slice has a public API in `index.ts`. Use the aliases `@app`, `@widgets`, `@features`, `@entities`, `@shared`.

## Scripts

Use pnpm only.

| Command | What it does |
|---------|--------------|
| `pnpm install` | Install dependencies |
| `pnpm check` | `astro check` (types and Astro diagnostics) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm build` | `astro check`, `astro build`, then `scripts/verify-build.mjs` |
| `pnpm check:lang` | Fails if any file contains Cyrillic characters |

`pnpm dev` and `pnpm preview` work as usual for local work by a human.

## Content

- Posts: `src/content/posts/<slug>.mdx`. Front matter: `title`, `description`, `published`, `updated?`, `tags`, `pillar` (`ai-engineering` | `frontend-at-scale` | `frontend-to-ai`), `draft` (default `false`).
- Drafts show in development only. Production builds exclude them from pages, lists, RSS, the sitemap, and the llms files.
- Static pages: `src/content/pages/{about,projects,now}.mdx`.
- MDX components (for now only `Callout`) are available in every MDX file without an import. Each one needs a Markdown fallback (see below).

## Markdown for Agents

Design: [`docs/design/markdown-for-agents.md`](docs/design/markdown-for-agents.md).

- **Build time.** Each content page gets a Markdown copy: `/index.md`, `/blog.md`, `/blog/<slug>.md`, `/about.md`, `/projects.md`, `/now.md`. The MDX source goes through a remark pipeline (`src/shared/lib/agent-markdown/`): imports and expressions are removed, JSX components become their Markdown fallback, relative URLs become absolute. Each file starts with a YAML header that holds the canonical HTML URL.
- **Discovery.** `/llms.txt`, `/llms-full.txt`, `<link rel="alternate" type="text/markdown">` in every page head, and an HTTP `Link` header from the middleware.
- **Content negotiation.** `functions/_middleware.ts` serves the Markdown copy when `Accept` prefers `text/markdown`. HTML responses get `Vary: Accept` and a `Link` header. Markdown responses get `X-Robots-Tag: noindex`, a canonical `Link`, `Content-Signal: search=yes, ai-input=yes, ai-train=yes`, and `x-markdown-tokens`.
- **Static fallback.** `public/_headers` sets the same headers for direct `.md` requests. `public/_routes.json` keeps assets out of the function.
- **New MDX component?** Add `markdown.ts` with its fallback next to the component, then register both in `src/shared/ui/mdx.ts`. `tests/fallback-coverage.test.ts` fails if a component used in content has no fallback.

Check after deploy:

```sh
curl -sI -H "Accept: text/markdown" https://molchanov.blog/about/   # text/markdown
curl -sI https://molchanov.blog/about/                              # text/html + Vary + Link
curl -s  https://molchanov.blog/llms.txt
```

## Cloudflare Pages settings

| Setting | Value |
|---------|-------|
| Framework preset | Astro |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 22 (`.nvmrc`; or set `NODE_VERSION=22`) |
| Functions | `functions/` is picked up automatically |

Analytics: Cloudflare Web Analytics is enabled in the dashboard (no code). Umami is the backup; its config lives in `src/shared/config/analytics.ts` and loads in production builds only.

## SEO

Every page has a unique title and description, a canonical URL, Open Graph and Twitter Card tags, and JSON-LD (`Person` + `WebSite` site-wide, `BlogPosting` + `BreadcrumbList` on posts). `robots.txt` allows all crawlers, including GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. The sitemap index is `/sitemap-index.xml`; the RSS feed is `/rss.xml`.

## TODO (author)

- [ ] Write `src/content/pages/about.mdx`, `projects.mdx`, and `now.mdx` (they hold "TODO: author to write" placeholders).
- [ ] Write the first real post, then delete the draft `src/content/posts/example-callout.mdx`.
- [ ] Review the default OG image `public/og-default.png` (a simple generated placeholder). Consider per-post OG images.
- [ ] Connect the repository to Cloudflare Pages and set the custom domain.
- [ ] Enable Cloudflare Web Analytics in the dashboard.
- [ ] After the first deploy, run the `curl` checks above.
- [ ] Optional: add ESLint and the FSD linter (steiger) once the codebase grows.
