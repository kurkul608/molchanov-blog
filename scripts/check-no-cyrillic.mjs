#!/usr/bin/env node
// Fails if any tracked or staged text file contains Cyrillic characters.
// This repository is English only (see AGENTS.md).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CYRILLIC = new RegExp('[' + String.fromCharCode(0x0400) + '-' + String.fromCharCode(0x052f) + ']');
const BINARY_EXT = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip)$/i;

const files = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && !BINARY_EXT.test(file) && file !== 'pnpm-lock.yaml');

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (CYRILLIC.test(file)) hits.push(`${file}: file name`);
  text.split('\n').forEach((line, index) => {
    if (CYRILLIC.test(line)) hits.push(`${file}:${index + 1}`);
  });
}

if (hits.length > 0) {
  console.error('Cyrillic characters found (this repository is English only):');
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`OK: ${files.length} files checked, no Cyrillic.`);
