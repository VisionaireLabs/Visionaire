#!/usr/bin/env node
/**
 * check-links.mjs — validate internal markdown links across the repo
 *
 * Scans all tracked .md files for relative link references and verifies
 * that each referenced file/path actually exists. External (http/https)
 * links are reported but not fetched — this is a fast pre-deploy guard,
 * not a crawler.
 *
 * Exit 0 = all internal links resolve.
 * Exit 1 = one or more broken internal links found.
 *
 * Referenced by: package.json "check-links" and "preship" scripts.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// ── File discovery ─────────────────────────────────────────────────────────

function listTrackedMarkdown() {
  try {
    return execSync('git ls-files "*.md"', { stdio: ['ignore', 'pipe', 'ignore'], cwd: root })
      .toString()
      .trim()
      .split('\n')
      .filter(f => f.endsWith('.md'));
  } catch {
    // Fallback: walk filesystem
    const SKIP = new Set(['node_modules', '.next', '.vercel', '.git']);
    const out = [];
    const walk = (dir) => {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        if (SKIP.has(name) || name.startsWith('.')) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (name.endsWith('.md')) out.push(p.slice(root.length + 1));
      }
    };
    walk(root);
    return out;
  }
}

// ── Link extraction ─────────────────────────────────────────────────────────

// Matches: [text](url) and bare <url> references
const LINK_RE = /\[(?:[^\]]*)\]\(([^)]+)\)/g;

function extractLinks(content) {
  const links = [];
  let m;
  while ((m = LINK_RE.exec(content)) !== null) {
    links.push(m[1].split('#')[0].trim()); // strip fragment, trim whitespace
  }
  return links;
}

function isExternal(href) {
  return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
}

function isAnchorOnly(href) {
  return href.startsWith('#') || href === '';
}

// ── Main ────────────────────────────────────────────────────────────────────

const files = listTrackedMarkdown();
let broken = 0;
let checked = 0;
let externalCount = 0;

for (const relFile of files) {
  const absFile = join(root, relFile);
  const content = readFileSync(absFile, 'utf-8');
  const links = extractLinks(content);
  const fileDir = dirname(absFile);

  for (const href of links) {
    if (!href || isAnchorOnly(href)) continue;
    if (isExternal(href)) { externalCount++; continue; }

    // Internal relative path
    checked++;
    const target = resolve(fileDir, href);

    // Accept exact file match or directory with README
    const exists =
      existsSync(target) ||
      existsSync(target + '.md') ||
      existsSync(join(target, 'README.md')) ||
      existsSync(join(target, 'index.md'));

    if (!exists) {
      console.error(`${RED}❌ broken link${RESET} in ${relFile}: ${href}`);
      broken++;
    }
  }
}

console.log(
  `${GREEN}check-links${RESET}: scanned ${files.length} files` +
  ` — ${checked} internal links checked` +
  `, ${externalCount} external (unchecked)` +
  `, ${broken} broken`
);

if (broken > 0) {
  console.error(`${RED}✖ ${broken} broken internal link(s) found${RESET}`);
  process.exit(1);
}

console.log(`${GREEN}✅ all internal links resolve${RESET}`);
