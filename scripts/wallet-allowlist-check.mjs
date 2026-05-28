#!/usr/bin/env node
/**
 * Pre-deploy guard: every wallet address that appears in deployable source code
 * must be on the allowlist below, OR the build fails.
 *
 * Origin story (2026-04-25): Visionaire hallucinated `0xc73bf21F2b3E1632a55a44d3Ce2dB04D9d0c139C`
 * from the abbreviation `0xc73b...39C`, Claude Code shipped it into TASK.md/spec.md/code,
 * the seller deployed with a wrong payTo, $6.03 USDC sent to unowned address space.
 *
 * Rule: if you want a new address in deployable code, add it to the allowlist FIRST
 * (with a comment naming the wallet it represents). No silent additions allowed.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, relative } from 'path';

// Prefer `git ls-files` for the source-of-truth file list, but fall back to
// a filesystem walk when git is unavailable (e.g. Vercel build sandbox has
// no .git directory and `git` exits with status 128).
function listTrackedFiles() {
  try {
    return execSync(
      "git ls-files src/ public/ 'next.config.*' 'package.json'",
      { stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    const root = process.cwd();
    const SKIP = new Set(['node_modules', '.next', '.vercel', '.git']);
    const out = [];

    const walk = (dir) => {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        if (SKIP.has(name) || name.startsWith('.')) continue;
        const p = join(dir, name);
        const s = statSync(p);
        if (s.isDirectory()) walk(p);
        else out.push(relative(root, p));
      }
    };

    walk(join(root, 'src'));
    walk(join(root, 'public'));

    if (existsSync(join(root, 'package.json'))) out.push('package.json');
    for (const f of readdirSync(root)) {
      if (/^next\.config\./.test(f)) out.push(f);
    }

    return out;
  }
}

// EVERY allowlisted wallet must be cross-referenced with memory/wallets.private.md.
// Update both when adding/removing.
const ALLOWLIST = new Set([
  // Visionaire AI cold (Phantom) — canonical x402 payTo, identity wallet
  '0xc73b84c2015c2ee9b8bf8955533802226e9d239c',
  // Visionaire Labs ops (Phantom multi-chain, visionairelabs.sol on Solana)
  '0x76f833cc751d4891c567b335b1e4c8720c2c6dac',
  // visionaire-buyer-base (CDP TEE, autonomous buyer)
  '0x2ebe2bdb68845b456667d779bc01d198bed287a3',
  // Native Base USDC contract (not a wallet, but appears in payment configs)
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  // Native Base USDC contract — checksum form
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
]);

// EXPLICITLY BLOCKED — tripwire for the known hallucination
const BLOCKLIST = new Set([
  // Hallucinated address from 2026-04-25, $6.03 stranded there
  '0xc73bf21f2b3e1632a55a44d3ce2db04d9d0c139c',
  // Address-poisoning attack wallets (scammer dust, 2026-04-25)
  '0x2ebfb6a617e6b3e152ebc7f73c42eefe746f07a3',
  '0x2eb61331f80ef12290be82dfce5d097546de1743',
  '0x2eb928d6028e05dfce796e8041027cadffa4b743',
]);

// Only scan src/ and configs that ship to production
const FILES_TO_SCAN = listTrackedFiles();

// Word-boundary guards: don't slice the first 40 hex chars out of 64-char tx hashes.
// A real EVM address is exactly 40 hex chars, with a non-hex char (or string boundary) on each side.
const ADDR_RE = /(?<![a-fA-F0-9])0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g;
let violations = [];

for (const file of FILES_TO_SCAN) {
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  const matches = content.matchAll(ADDR_RE);
  for (const m of matches) {
    const addr = m[0].toLowerCase();
    // Get the line for context
    const idx = m.index;
    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const lineEnd = content.indexOf('\n', idx);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    const lineNum = content.slice(0, idx).split('\n').length;

    if (BLOCKLIST.has(addr)) {
      violations.push({ severity: 'CRITICAL', file, line: lineNum, addr: m[0], context: line.trim() });
    } else if (!ALLOWLIST.has(addr)) {
      violations.push({ severity: 'UNKNOWN', file, line: lineNum, addr: m[0], context: line.trim() });
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ Wallet allowlist check FAILED\n');
  for (const v of violations) {
    console.error(`  [${v.severity}] ${v.file}:${v.line}`);
    console.error(`    ${v.addr}`);
    console.error(`    | ${v.context}`);
    console.error('');
  }
  console.error('Fix: update ALLOWLIST in visionaire-site/scripts/wallet-allowlist-check.mjs');
  console.error('     AND wallets.private.md to match. Then re-run.\n');
  process.exit(1);
}

console.log('✓ Wallet allowlist check passed. All addresses in deployable code are known-good.');
