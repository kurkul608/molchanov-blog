#!/usr/bin/env node
// Runs in GitHub Actions after a push to main.
// 1. Reads the manifest that was live before the deploy (OLD_MANIFEST file, optional).
// 2. Polls the live site until deploy-manifest.json reports the pushed commit (EXPECTED_SHA).
// 3. Submits new, changed, and removed page URLs to IndexNow.
// Set SUBMIT_ALL=true to submit every page.
import { existsSync, readFileSync } from 'node:fs';
import { buildPayload, diffManifests, INDEXNOW_ENDPOINT, SITE } from './indexnow-lib.mjs';

const { OLD_MANIFEST, EXPECTED_SHA, SUBMIT_ALL } = process.env;
const TIMEOUT_MS = 15 * 60 * 1000;
const INTERVAL_MS = 20 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchLiveManifest() {
  const response = await fetch(`${SITE}/deploy-manifest.json?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function waitForDeploy() {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const manifest = await fetchLiveManifest();
    if (manifest && (!EXPECTED_SHA || manifest.sha === EXPECTED_SHA)) return manifest;
    console.log(`Waiting for deploy of ${EXPECTED_SHA ?? 'latest'} (live: ${manifest?.sha ?? 'none'})...`);
    await sleep(INTERVAL_MS);
  }
  throw new Error(`Deploy of ${EXPECTED_SHA} not live after ${TIMEOUT_MS / 60000} minutes.`);
}

const oldManifest = OLD_MANIFEST && existsSync(OLD_MANIFEST) ? JSON.parse(readFileSync(OLD_MANIFEST, 'utf8')) : null;
const newManifest = await waitForDeploy();

// If the old manifest is already the new deploy, there is nothing to compare against.
const sameDeploy = oldManifest && oldManifest.sha === newManifest.sha;
const urls = SUBMIT_ALL === 'true' || sameDeploy ? diffManifests(null, newManifest) : diffManifests(oldManifest, newManifest);

if (urls.length === 0) {
  console.log('No page changes. Nothing to submit.');
  process.exit(0);
}

console.log(`Submitting ${urls.length} URL(s):\n${urls.join('\n')}`);
const response = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(buildPayload(urls)),
});
console.log(`IndexNow response: ${response.status}`);
if (response.status !== 200 && response.status !== 202) {
  console.error(await response.text());
  process.exit(1);
}
