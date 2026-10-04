# Design: IndexNow after each deploy

Status: accepted · Date: 2026-10-04

## Goal

After each deploy, tell IndexNow which pages are new, changed, or removed. IndexNow shares the list with Bing, Yandex, and other participating engines. Bing's index also feeds ChatGPT search, so fast indexing helps GEO. Google does not use IndexNow; it reads `sitemap-index.xml`.

## How it works

1. **Key file.** `public/9d0f6e5695b8bf08f1232cd5f8a22f1b.txt` contains the key. IndexNow keys are public by design: the file proves that we own the host.
2. **Manifest.** `scripts/build-manifest.mjs` runs at the end of `pnpm build`. It writes `dist/deploy-manifest.json` with the commit SHA (`CF_PAGES_COMMIT_SHA`) and a SHA-256 hash of every HTML page.
3. **Workflow.** `.github/workflows/indexnow.yml` runs on every push to `main`:
   1. It saves the live manifest right away, before the new deploy replaces it.
   2. It polls `https://molchanov.blog/deploy-manifest.json` until `sha` equals the pushed commit (timeout: 15 minutes).
   3. It diffs the old and new manifests and posts the new, changed, and removed URLs to `https://api.indexnow.org/indexnow`.
4. **Manual run.** Actions → IndexNow → Run workflow → "Submit every page".

## Rules

- Only HTML pages are submitted. Markdown copies (`.md`) are `noindex` and never submitted.
- No changes, no request. A README-only commit sends nothing.
- If the deploy fails or takes over 15 minutes, the workflow fails. That makes a failed deploy visible in GitHub.
- If the workflow starts after the new deploy is already live, it cannot diff, so it submits every page. The site is small, so this is safe.

## Files

| File | Role |
|------|------|
| `public/<key>.txt` | Key verification |
| `scripts/indexnow-lib.mjs` | Pure helpers: URL mapping, hashing, diff, payload |
| `scripts/build-manifest.mjs` | Post-build manifest |
| `scripts/indexnow-submit.mjs` | Wait for deploy, diff, submit |
| `.github/workflows/indexnow.yml` | Trigger |
| `tests/indexnow.test.ts` | Unit tests for the helpers |
