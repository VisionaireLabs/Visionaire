#!/usr/bin/env node
/**
 * health-check.mjs — Visionaire system health checker
 * No external dependencies. Exit 0 = healthy, 1 = errors found.
 * Closes: https://github.com/VisionaireLabs/Visionaire/issues/3
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, resolve } from 'path';

// ANSI color codes
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const ROOT = resolve(import.meta.dirname, '..');

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ${c.green}✔${c.reset} ${label}`);
  passed++;
}

function fail(label) {
  console.log(`  ${c.red}✖${c.reset} ${label}`);
  failed++;
}

function section(title) {
  console.log(`\n${c.cyan}${c.bold}${title}${c.reset}`);
}

// ── 1. Required files ──────────────────────────────────────────────────────
section('Required files');

const REQUIRED_FILES = [
  'SOUL.md',
  'AGENTS.md',
  'USER.md',
  'MEMORY.md',
  'HEARTBEAT.md',
  'TOOLS.md',
];

for (const file of REQUIRED_FILES) {
  const path = join(ROOT, file);
  if (existsSync(path)) {
    ok(file);
  } else {
    fail(`${file} ${c.dim}(missing)${c.reset}`);
  }
}

// ── 2. scripts/*.mjs syntax check ─────────────────────────────────────────
section('Script syntax (scripts/*.mjs)');

const scriptsDir = join(ROOT, 'scripts');
const mjsFiles = existsSync(scriptsDir)
  ? readdirSync(scriptsDir).filter((f) => f.endsWith('.mjs'))
  : [];

if (mjsFiles.length === 0) {
  console.log(`  ${c.yellow}–${c.reset} No .mjs files found in scripts/`);
} else {
  for (const file of mjsFiles) {
    const fullPath = join(scriptsDir, file);
    try {
      execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      ok(`scripts/${file}`);
    } catch (err) {
      const msg = err.stderr?.toString().trim() || 'syntax error';
      fail(`scripts/${file} ${c.dim}— ${msg}${c.reset}`);
    }
  }
}

// ── 3. memory/*.json validity ─────────────────────────────────────────────
section('JSON validity (memory/*.json)');

const memoryDir = join(ROOT, 'memory');
const jsonFiles = existsSync(memoryDir)
  ? readdirSync(memoryDir).filter((f) => f.endsWith('.json'))
  : [];

if (jsonFiles.length === 0) {
  console.log(`  ${c.dim}–${c.reset} No .json files found in memory/`);
} else {
  for (const file of jsonFiles) {
    const fullPath = join(memoryDir, file);
    try {
      JSON.parse(readFileSync(fullPath, 'utf8'));
      ok(`memory/${file}`);
    } catch (err) {
      fail(`memory/${file} ${c.dim}— ${err.message}${c.reset}`);
    }
  }
}

// ── 4. Required directories ────────────────────────────────────────────────
section('Required directories');

const REQUIRED_DIRS = ['memory', 'cron'];

for (const dir of REQUIRED_DIRS) {
  const path = join(ROOT, dir);
  if (existsSync(path)) {
    ok(`${dir}/`);
  } else {
    fail(`${dir}/ ${c.dim}(missing)${c.reset}`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
const total = passed + failed;
const status = failed === 0
  ? `${c.green}${c.bold}healthy${c.reset}`
  : `${c.red}${c.bold}${failed} error${failed !== 1 ? 's' : ''}${c.reset}`;

console.log(
  `\n${c.bold}Summary:${c.reset} ${passed}/${total} checks passed — ${status}\n`
);

process.exit(failed === 0 ? 0 : 1);
