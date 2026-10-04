# molchanov.blog — Agent Rules

> Canonical rules for every AI agent working in this repository (Claude Code, Cline, Gemini CLI, Antigravity).
> Client-specific files (for example `CLAUDE.md`) import this file and never duplicate it.

## Project

Personal technical blog of Petr Molchanov, an applied AI engineer with a fullstack background.
Domain: https://molchanov.blog. The goal is to show real engineering work to readers and to search engines (SEO), and to be cited by AI search (GEO).

## Language — HARD RULE

**This repository is English only. No Cyrillic characters, ever.**

This applies to everything committed: source code, identifiers, comments, Markdown/MDX content, frontmatter, commit messages, branch names, PR titles and descriptions, config files, test names, and file names.

- The author may talk to you in Russian. Reply in chat in his language, but write only English to the repository.
- Before you finish a task, run `node scripts/check-no-cyrillic.mjs`. It must exit with code 0.
- English style: plain, short sentences, active voice. No AI filler words ("delve", "realm", "leverage", "seamless", "robust", "cutting-edge").

## Privacy — HARD RULE

This repository is public.

- Never name the author's current employer.
- The author's own role and results at the current job may be described without the company name ("at my current job"): what he built, the stack, and metrics he has approved (for example, an agent that handles 100+ tasks a month). Never describe the employer's internal code, data, business domain, or anything that identifies the company.
- Never mention the author's job search, applications, or job-search tooling.
- Describe past work in general terms ("a large legacy React 17 codebase"), without client or company names, unless the author explicitly approves the name.
- Never invent metrics, results, or experience. If a number is unknown, ask or leave it out.

## Tooling

- Package manager: **pnpm only**. No `npm install`, `yarn`, or `npx` (use `pnpm exec` / `pnpm dlx`).
- **Do not start long-running processes**: no `dev`, `preview`, `start`, or `watch`. Allowed: `build`, `check`, `lint`, `test`, `install`, one-off scripts. If you need a running server, ask the author.
- Hosting: Cloudflare Pages. Build command `pnpm build`, output directory `dist`.

## Architecture — Astro + React + Feature-Sliced Design

Stack: Astro (static output), React for components, TypeScript strict, MDX for posts.

### Component model

- UI components are **React (`.tsx`)**. Astro renders them to static HTML with zero JavaScript by default.
- Add a `client:*` directive only when a component needs interactivity. Prefer `client:visible` or `client:idle` over `client:load`.
- `.astro` files are allowed only for routes (`src/pages`), layouts, and `<head>` / SEO wiring.
- Performance budget: Lighthouse 95+ on mobile. Every new client island needs a reason.

### Layers (Feature-Sliced Design)

```
src/
  pages/      Astro routes. Thin: fetch data, compose widgets. No business logic.
  app/        Layouts, global styles, site config, analytics and SEO head wiring.
  widgets/    Large page blocks: Header, Footer, PostList, AuthorCard.
  features/   User actions: theme-toggle, copy-code, share-post.
  entities/   Domain models with their UI: post, author, project.
  shared/     Reusable code with no domain knowledge: ui kit, lib, config, assets.
  content/    MDX posts (content collections, schema in src/content.config.ts).
```

Rules:

1. A layer imports only from layers below it: `pages → app → widgets → features → entities → shared`.
2. Slices on the same layer never import each other.
3. Each slice exposes a public API through `index.ts`. Import from the slice root, never from its internals.
4. Slice segments: `ui/`, `model/`, `lib/`, `config/` — create only the ones you need.
5. Reuse first. Before you create a component, search `shared/ui` and `entities/*/ui`. Generic UI goes to `shared/ui`; nothing domain-specific there.
6. Use path aliases (`@app`, `@widgets`, `@features`, `@entities`, `@shared`), not long relative paths.

## SEO and GEO requirements

Every page must have: a unique `<title>` and meta description, a canonical URL, Open Graph and Twitter Card tags, and valid JSON-LD.

- Site-wide: `Person` (with `sameAs` links) and `WebSite`.
- Post pages: `BlogPosting` and `BreadcrumbList`.
- Keep `sitemap.xml`, `robots.txt`, and the RSS feed valid. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are allowed.
- In posts, answer the heading's question in the first 2–3 sentences of each section.

## Analytics

- Primary: Cloudflare Web Analytics (enabled in the Cloudflare dashboard, no code needed for Pages).
- Backup: self-hosted Umami. Website ID and script URLs live in `src/shared/config/analytics.ts`:
  - tracker: `https://umami.kurkul608.online/script.js`
  - session recorder: `https://umami.kurkul608.online/recorder.js`
  - website ID: `3308b70b-da31-4ea0-bb09-e1f3de3b8c31`
- Load analytics scripts with `defer`. They must never block rendering.

## Definition of done

1. `pnpm check` and `pnpm build` pass.
2. `node scripts/check-no-cyrillic.mjs` exits with code 0.
3. No new client island without a reason in the PR description.
4. No private information (see Privacy).
